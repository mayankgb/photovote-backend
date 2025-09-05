import { Router } from "express";
import { middleware } from "../midldleware/middleware";
import { ContestManager } from "../contestManager";
import { endContestSchema, upvoteSchema } from "../types/types";
import dotenv from "dotenv"

dotenv.config()


export const userRouter = Router()

userRouter.post("/upvote", middleware, async (req , res) => {

    const parsedBody = upvoteSchema.safeParse(req.body)

    if (!parsedBody.success) {
        res.status(403).json({
            message: "invalid inputs"
        })
        return
    }

    const userId = res.locals.userId
    const instituteId = res.locals.instituteId
    const response = await ContestManager.getInstance().upvote(userId, parsedBody.data.participantId, parsedBody.data.contestId, instituteId)

    if (response.status > 200) {
        res.status(response.status).json({
            message: response.message
        })
        return
    }
    
    res.status(response.status).json({
        message: response.message,
        isVoted: true,
    })
    return

})

userRouter.post("/getallparticipant", middleware, async (req, res) =>  {

    try{
        const parsedBody = endContestSchema.safeParse(req.body)

        if (!parsedBody.success) {
            res.status(400).json({
                message:"invalid inputs"
            })
            console.log(parsedBody.error)
            return
        }

        const userId = res.locals.userId
        const instituteId = res.locals.instituteId
        const allParticipant = ContestManager.getInstance().getAllParticipant(instituteId, parsedBody.data.contestId, userId)

        if (allParticipant.status > 200) {
            res.status(allParticipant.status).json({
                message: allParticipant.data
            })
            return
        }

        res.status(200).json({
            data: allParticipant.data
        })
        return

    }catch(e) {
        console.log(e)
        res.status(500).json({
            message: "kuch toh gadbad hai daya"
        })
        return
    }

})

userRouter.get("/test", async(req , res) => { 
    console.log("everthing is working")
    res.json({
        message: "everything is working fine"
    })
    return
})