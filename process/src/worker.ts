import {PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import dotenv from "dotenv"

dotenv.config()

const redis = new Redis({
    host: process.env.REDIS_ENDPOINT ,
    username: "default",
    password: process.env.REDIS_PASSWORD,
    port: 15025,
    db:0
});
const prisma = new PrismaClient()

const STREAM_KEY = "molest";
const GROUP_NAME = "molestmessage";
const CONSUMER_NAME = "consumer2";

async function processUnacknowledgedMessages(): Promise<void> {
  try {
    const pending = await redis.xpending(STREAM_KEY, GROUP_NAME, "-", "+", 10) as [string, string, number, number][];;

    // Correctly extract message IDs
    const pendingMessages = pending.map((entry: [string, string, number, number]) => entry[0]);

    if (pendingMessages.length === 0) {
      console.log("No unacknowledged messages.");
      return;
    }

    const claimedMessages = await redis.xclaim(
      STREAM_KEY,
      GROUP_NAME,
      CONSUMER_NAME,
      60000,
      ...pendingMessages
    ) as [string, string[]][];

    for (const [id, fields] of claimedMessages) {
      const data: Record<string, string> = {};
      for (let i = 0; i < fields.length; i += 2) {
        data[fields[i]] = fields[i + 1];
      }

      console.log(`Processing task ${id}`, data);

      try {
        await handleTask(data);
        await redis.xack(STREAM_KEY, GROUP_NAME, id);
        console.log(`Acknowledged task ${id}`);
      } catch (err) {
        console.error(`Error processing task ${id}:`, err);
      }
    }
  } catch (error) {
    console.error("Error processing unacknowledged tasks:", error);
  }
}

async function handleTask(data: Record<string, string>): Promise<void> {
    await upvote(data.participantId, data.contestId, data.voterId)
  return new Promise((resolve) => setTimeout(resolve, 500));
}

setInterval(processUnacknowledgedMessages, 5000);


async function upvote(participantId: string, contestId: string, voterId: string) {
    const updateUser = await prisma.$transaction(async (tx) => {
        await tx.participant.update({
            where: {
                id: participantId
            },
            data: {
                upvote: { increment: 1 }
            }
        })

        await tx.vote.create({
            data: {
                contestId: contestId,
                voterId: voterId,
                participantId: participantId
            }
        })
    })
}