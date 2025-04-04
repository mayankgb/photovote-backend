import { PrismaClient } from "@prisma/client"
import { Redis } from "ioredis"
import dotenv from "dotenv"

dotenv.config()

const prisma = new PrismaClient() 

async function main() {
    const redis = new Redis({
        host: process.env.REDIS_ENDPOINT ,
        username: "default",
        password: process.env.REDIS_PASSWORD,
        port: 15025,
        db:0
    })
    const streamName = "molest"
    const groupName = "molestmessage"
    const consumerName = "consumer1"

    async function setupStreamAndGroup() {
        try {
            await redis.xgroup('CREATE', streamName, groupName, '$', 'MKSTREAM');
        } catch (err) {
            console.log(err)
        }
    }
    await setupStreamAndGroup()

    while (1) {

        const response = await redis.xreadgroup(
            'GROUP',
            groupName,          // Consumer group name
            consumerName,       // Consumer name
            'BLOCK', 0,         // Block indefinitely until new messages arrive
            'STREAMS',
            streamName,
            '>'                 // Read new messages
        ) as [string, [string, string[]][]][];;

        if (!response) {
            return
        }

        for (const [stream, messages] of response) {
            for (const [messageId, fields] of messages) {

                try {
                    const data = parseStreamData(fields)
                    console.log(data)
                    const response = await upvote(data.participantId, data.contestId, data.voterId)
                    await redis.xack(streamName, groupName, messageId)

                } catch (e) {
                    console.log(e)
                }
            }
        }
    }
}

function parseStreamData(fields: string[]): any {
    const data: any = {};
    for (let i = 0; i < fields.length; i += 2) {
        data[fields[i]] = fields[i + 1];
    }
    return data;
}

main()

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