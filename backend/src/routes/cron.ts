import { Router } from "express";
import { cronMiddleware } from "../midldleware/middleware";
import { cronSchema } from "../types/types";
import { ContestManager } from "../contestManager";

export const cronRouter = Router()


cronRouter.post("/startcontest", cronMiddleware, async (req, res) => {
    try {

        const parsedBody = cronSchema.safeParse(req.body)

        if (!parsedBody.success) {
            res.status(400).json({
                message:"invalid inputs"
            })
            return
        }

        const response = await ContestManager.getInstance().startContest(parsedBody.data.contestId, parsedBody.data.adminId, parsedBody.data.instituteId)

        if (response.status > 200) {
            res.status(response.status).json({
                message: response.message
            })
            return
        }

        res.status(200).json({
            message: "response.message"
        })

        return


    }catch(e) {
        console.log(e)
        res.status(500).json({
            message:"something went wrong"
        })
    }
})

cronRouter.post("/endcontest", cronMiddleware, async (req, res) => {
    try {

        const parsedBody = cronSchema.safeParse(req.body)

        if (!parsedBody.success) {
            res.status(400).json({
                message:"invalid inputs"
            })
            return
        }

        const response = await ContestManager.getInstance().endContestId(parsedBody.data.adminId, parsedBody.data.contestId, parsedBody.data.instituteId, "OWNER")

        if (response.status > 200) {
            res.status(response.status).json({
                message: response.message
            })
            return
        }

        res.status(200).json({
            message: response.message
        })

        return


    }catch(e) {
        console.log(e)
        res.status(500).json({
            message:"something went wrong"
        })
    }
})