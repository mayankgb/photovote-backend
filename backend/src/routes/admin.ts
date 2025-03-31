import { Router } from "express";
import { middleware } from "../midldleware/middleware";
import { endContestSchema } from "../types/types";
import { ContestManager } from "../contestManager";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

export const adminRouter = Router()

adminRouter.post("/endcontest", middleware, async (req, res) => {
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

        const isAdmin = await prisma.user.findFirst({
            where: {
                id: userId
            },
            select: {
                role: true
            }
        })

        if (!isAdmin || !(isAdmin.role === "ADMIN" || isAdmin.role === "OWNER")) {
            res.status(401).json({
                message: "unauthorised access"
            })
        }

        const response = ContestManager.getInstance().endContestId(userId, parsedBody.data.contestId, instituteId)

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