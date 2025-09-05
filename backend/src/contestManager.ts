import { PrismaClient } from "@prisma/client"
import Redis from "ioredis"
import { Contest } from "./contest"
import { CustomWebsocket, Participant, Position } from "./types/types"
import dotenv from "dotenv"

dotenv.config()

type contestId = string

type instituteId = string


export class ContestManager {

    private static instance: ContestManager
    private prisma: PrismaClient
    private redis: Redis
    private streamName: string
    private contestRoom: Map<contestId, Contest>
    private instituteRoom: Map<instituteId, contestId[]>
    // private 


    private constructor() {
        this.prisma = new PrismaClient()
        this.redis = new Redis({
            host: process.env.REDIS_ENDPOINT,
            username: "default",
            password: process.env.REDIS_PASSWORD,
            db: 0,
            port:11774
        })

        console.log("redis is working", this.redis)

        // this.redis = new Redis()
        this.streamName = "molest"
        this.contestRoom = new Map()
        this.instituteRoom = new Map()
    }

    static getInstance() {
        if (!this.instance) {
            this.instance = new ContestManager()
        }
        return this.instance
    }


    private endContest(contestId: string, instituteId: string) {
        this.contestRoom.delete(contestId)
        const contestIndex = this.instituteRoom.get(instituteId)?.findIndex((v) => v === contestId)
        if (contestIndex && contestIndex != -1) {
            this.instituteRoom.get(instituteId)?.splice(contestIndex, 1)
            return {
                message: "contest ended",
                status: 200
            }
        }
       return {
        message: "something went wrong",
        status: 500
       }
    }

    getAllParticipant(instituteId: string, contestId: string, userId: string) {
        if (this.instituteRoom.has(instituteId)) {
            const contestRoomId = this.instituteRoom.get(instituteId)?.find((v) => v === contestId)

            if (contestRoomId) {
                const response = this.contestRoom.get(contestRoomId)?.getAllParticipant(userId)

                if (response) {
                    return {
                        data: response,
                        status: 200
                    }
                }else {
                    return {
                        data: "no participant present in this contest",
                        status: 400
                    }
                }
            }else {
                return {
                    data: "no active contest present with this contestid",
                    status: 400
                }
            }
        }else {
            return {
                data: "no active contest present for this institute",
                status: 400
            }
        }
    }

    async upvote(voterId: string, participantId: string, contestId: string, instituteId: string) {

        if (!voterId || !participantId || !contestId || !instituteId) {
            return {
                message: "invalid inputs",
                status: 400
            }
        }
        if (this.instituteRoom.has(instituteId)) {
            const existingContest = this.instituteRoom.get(instituteId)?.find((value) => value === contestId)
            if (existingContest) {
                const contest = this.contestRoom.get(contestId)
                if (!contest) {
                    return {
                        message: "no contest present with this id",
                        status: 400
                    }
                }
                const response = contest.upvote(voterId, participantId)
                if (!response) {
                    return {
                        message: "something went wrong",
                        status: 400
                    }
                }
                if (response.status > 200) {
                    return {
                        message: response.message,
                        status: response.status
                    }
                } else if (response.status === 200) {
                    const dbResponse = await this.sendToDb(contestId, voterId, participantId)
                    if (dbResponse.status === 200) {
                        return {
                            message: response.message,
                            data: response.data,
                            status: dbResponse.status
                        }
                    }
                    return {
                        message: dbResponse.message,
                        status: dbResponse.status
                    }
                }
            }
            return {
                message: "no contest present with this id",
                status: 400
            }

        }
        return {
            message: "no institue present with this id",
            status: 400
        }

    }

    firstOnline(ws: CustomWebsocket, contestId: string) {
        if (!ws || !contestId) {
            return {
                message: "invalid inputs",
                status: 400
            }
        } else {
            this.contestRoom.get(contestId)?.firstOnline(ws)

            return {
                message: "online",
                status: 200
            }
        }
    }


    dissconnect(ws: CustomWebsocket) {
        const contest = this.instituteRoom.get(ws.instituteId)

        if (contest) {
            contest.map((v) => {
                const isValidUser = this.contestRoom.get(v)?.userWs.has(ws.userId)
                if (isValidUser) {
                    this.contestRoom.get(v)?.disconnect(ws.userId)
                }
            })
        }
    }

    async sendToDb(contestId: string, voterId: string, participantId: string) {
        try {

            const response = await this.redis.xadd(
                this.streamName,
                "*",
                "contestId", contestId,
                "voterId", voterId,
                "participantId", participantId,
                "type", "upvote"
            )

            console.log("successfully send to db")

            return {
                message: "succesfully send it to db",
                status: 200
            }

        } catch (e) {
            console.log(e)
            return {
                message: "something went wrong",
                status: 500
            }
        }
    }

    // endContestId(adminId: string, contestId: string, instituteId: string) {
    //     const isAdmin = this.contestRoom.get(contestId)?.adminId === adminId
    //     if (isAdmin) {
    //         this.contestRoom.get(contestId)?.endContest(contestId, instituteId)
    //         return {
    //             message: "successfully ended",
    //             status: 200
    //         }
    //     }
    //     return {
    //         message: "unauthorised access",
    //         status: 403
    //     }
    // }

   async endContestId(adminId: string, contestId: string, instituteId: string , role: string) {

        try{
            if (!this.contestRoom.has(contestId)) {
                return{
                    message: "bad request",
                    status: 400
                }
            }
    
            const isAdmin = this.contestRoom.get(contestId)?.adminId === adminId
    
            if (!isAdmin && !(role === "OWNER")) {
                return {
                    message:"unauthorise access",
                    status: 401
                }
            }
    
            const participantPosition = this.contestRoom.get(contestId)?.getWinner()
            if (!participantPosition) {
                return {
                    message: "something went wrong",
                    status: 400
                }
            }

            this.contestRoom.delete(contestId)
            this.instituteRoom.get(instituteId)?.filter((v) => v !== contestId)

            if (this.instituteRoom.get(instituteId)?.length === 0) {
                this.instituteRoom.delete(instituteId)
            }
            const data = await this.prisma.$transaction(async (tx) => {
                await tx.contest.update({
                    where: {
                        id: contestId,
                        adminId: adminId,
                        instituteId: instituteId,
                        status: "STARTED"
                    },
                    data:{
                        status: "ENDED"
                    }
                })

               const id =  await tx.position.createMany({
                    data: participantPosition.participant,
                })
                return contestId
            })

            if (data) {
                return {
                    message: contestId,
                    status: 200
                }
            }

            return {
                message: "something went wrong",
                status: 400
            }

            
        }catch(e) {
            console.log(e)
            return{
                message: "something up with the server",
                status: 400
            }
        }
    }

    async getData() {
        try {
            const data = await this.prisma.contest.findMany({
                where: {
                    status: "STARTED",
                },
                select: {
                    id: true,
                    instituteId: true,
                    name: true,
                    adminId: true,
                    participant: {
                        where: {
                            status: "APPROVE"
                        },
                        select: {
                            
                            userId: true,
                            id: true,
                            user: {
                                select: {
                                    image: true,
                                    name: true,
                                    id: true,
                                    branch: {
                                        select: {
                                            name: true
                                        }
                                    }
                                }
                            },
                            upvote: true,
                            vote: {
                                select: {
                                    voterId: true,
                                    participantId: true
                                }
                            }
                        },

                    }
                }
            })

            console.log(data)

            if (!data || data.length === 0) {
                return {
                    message: "no data is present",
                    status: 200
                }
            }

            data.map((c) => {
                const newContest = new Contest(c.id, c.name, c.instituteId, this.endContest.bind(this), c.adminId)

                if (c.participant.length) {
                    c.participant.map((p) => {
                        const newParticipant: Participant = {
                            id: p.id,
                            upvote: p.upvote,
                            user: {
                                image: p.user.image,
                                name: p.user.name,
                                id: p.user.id,
                                branch: {
                                    name: p.user.branch!.name
                                },
                            }
                        }
                        newContest.addUser(newParticipant)
                        p.vote.map((v) => {
                            newContest.addVoter(v.voterId, v.participantId)
                        })
                    })
                }

                this.contestRoom.set(c.id, newContest)

                if (this.instituteRoom.has(c.instituteId)) {
                    this.instituteRoom.get(c.instituteId)?.push(c.id)

                } else {
                    this.instituteRoom.set(c.instituteId, [c.id])
                }

                newContest.initDbLeaderBoard()
            })

            return {
                message: "successfully added contest",
                status: 200
            }


        } catch (e) {

            console.log(e)
            throw new Error(JSON.stringify(e))


        }
    }


    async startContest(contestId: string , adminId: string, instituteId: string) {
        try{

            if (this.instituteRoom.has(instituteId)) {
               const index =  this.instituteRoom.get(instituteId)?.findIndex((a) => a === contestId)
                if(index && index > 0) {
                    return{
                        message: "you already in the queue sir",
                        status: 400
                    }
                }
            }else {
                this.instituteRoom.set(instituteId, [contestId])
            }

            const isParticipant = await this.prisma.contest.findFirst({
                where: {
                    id: contestId, 
                    adminId: adminId,
                    status: "CREATED"
                },
                select:{
                    _count: { select: { participant: { where: {status: "APPROVE"}}}}
                }
            })

            if (isParticipant?._count.participant === 0) {
                return {
                    message: "no participant present in this contest so you are not able to start it",
                    status: 400
                }
            }

            const data = await this.prisma.$transaction(async (tx) => {
                
                const response = await tx.contest.findFirst({
                    where: {
                        id: contestId,
                        adminId: adminId,
                        instituteId: instituteId,
                        status: "CREATED"
                    },
                    select: {
                        id: true,
                        name: true, 
                        instituteId: true,
                        adminId: true,
                        participant: {
                            where: {
                                status: "APPROVE"
                            },
                            select:{
                                id: true,
                                upvote: true,
                                user: {
                                    select:{
                                        name:true,
                                        id: true,
                                        image: true,
                                        branch: {
                                            select: {
                                                name: true
                                            }
                                        }
                                    }
                                }
    
                            }
                        }
                    }
                })

               await tx.contest.update({
                    where: {
                        id: contestId,
                        adminId: adminId,
                        instituteId: instituteId,
                        status: "CREATED"
                    },
                    data: {
                        status: "STARTED"
                    }
                })
                return response
            })


            if (data) {
                const newContest = new Contest(data.id, data.name, data.instituteId ,this.endContest.bind(this), data.adminId)

                data.participant.map((d) => {
                    const newParticipant: Participant = {
                        id: d.id,
                        upvote: d.upvote,
                        user: {
                            id:d.user.id,
                            name:d.user.name,
                            image: d.user.image,
                            branch: {
                                name: d.user.branch ? d.user.branch.name : ""
                            }
                            
                        }
                    }
                    newContest.addUser(newParticipant)
                })

                console.log(data)

                this.contestRoom.set(contestId, newContest)

                return{
                    message: newContest.id,
                    status: 200
                }
            }

            this.instituteRoom.get(instituteId)?.filter((a) => a !== contestId)
            return {
                message: "something went wrong",
                status: 403
            }

        }catch(e) {
            console.log(e)
            this.instituteRoom.get(instituteId)?.filter((a) => a !== contestId)
            return{
                message: "something went wrong",
                status: 500
            }
        }
    }

    async sendLeaderBoardToDb(leaderBoard: Position[]) {

        try{

            const response = await this.redis.xadd(
                this.streamName,
                "*",
                "leaderBoard", JSON.stringify(leaderBoard),
                "type", "leaderboard"
            )

            return {
                message: "ended",
                status: 200
            }


        }catch(e) {
            console.log(e)
            return{
                message:"something went wrong",
                status: 500
            }
        }

    }
 
}