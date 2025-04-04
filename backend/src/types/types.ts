import { WebSocket } from "ws";
import {z} from "zod"

export interface CustomWebsocket extends WebSocket {
    userId: string,
    instituteId: string
}

export interface Participant {
    upvote: number;
    id: string,
    user: {
        name: string | null;
        id: string,
        image: string | null;
        branch: {
            name: string;
        } | null;
    }
}

export interface Position {
    rank: number,
    userId: string,
    participantId: string,
    contestId: string
}

export const upvoteSchema = z.object({
    contestId: z.string({message: "invalid inputs"}).min(1),
    participantId: z.string({message: "invalid type"}).min(1, {message: "id should not be empty"})
})

export const endContestSchema = z.object({
    contestId: z.string({message: "invalid input type"}).min(1, {message: "contestId should not be empty"})
})

export const cronSchema = z.object({
    contestId: z.string().min(1),
    adminId: z.string().min(1),
    instituteId: z.string().min(1)
})