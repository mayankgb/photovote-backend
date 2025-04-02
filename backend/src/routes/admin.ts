import { Router } from "express";
import { adminMiddleware, middleware } from "../midldleware/middleware";
import { endContestSchema } from "../types/types";
import { ContestManager } from "../contestManager";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

export const adminRouter = Router()

adminRouter.post("/endcontest", adminMiddleware, async (req, res) => {
    try {
        const parsedBody = endContestSchema.safeParse(req.body)

        if (!parsedBody.success) {
            res.status(400).json({
                message: "invalid inputs"
            })
            console.log(parsedBody.error)
            return
        }

        const userId = res.locals.userId
        const instituteId = res.locals.instituteId

        const response = await ContestManager.getInstance().endContestId(userId, parsedBody.data.contestId, instituteId)

        if (response.status > 200) {
            res.status(response.status).json({
                message: response.message
            })
            return
        }

        res.status(response.status).json({
            message: response.message
        })
        return

    } catch (e) {

        console.log(e)
        res.status(500).json({
            message: "internal server"
        })
        return

    }
})


adminRouter.post("/startcontest", adminMiddleware, async (req, res) => {
    try{

        const parsedBody = endContestSchema.safeParse(req.body)

        if (!parsedBody.success) {
            res.status(400).json({
                message: "invalid inputs"
            })
            console.log(parsedBody.error)
            return
        }

        const adminId = res.locals.adminId
        const instituteId = res.locals.instituteId

        const response = await ContestManager.getInstance().startContest(parsedBody.data.contestId, adminId, instituteId)

        if (response.status > 200) {
            res.status(response.status).json({
                message: response.message
            })
            return
        }

        res.status(response.status).json({
            message: parsedBody.data.contestId
        })
        return
    }catch(e){
        console.log(e)
        res.status(500).json({
            message: "Something went wrong"
        })
        return
    }
})