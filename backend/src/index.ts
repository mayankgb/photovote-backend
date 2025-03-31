
import express from "express"
import { WebSocketServer } from "ws"
import cors from "cors"
import { CustomWebsocket } from "./types/types"
import jwt from "jsonwebtoken"
import { ContestManager } from "./contestManager"
import { userRouter } from "./routes/user"
import { adminRouter } from "./routes/admin"

const app = express()

app.use(cors({
    origin: "*"
}))
app.use(express.json())
app.use("/user", userRouter)
app.use("/admin", adminRouter)

app.get("/ping", async (req , res) => {
    res.status(200).json({
        message:"working"
    })
})


async function main() {
    try {

        await ContestManager.getInstance().getData()
        const port = 8001
        const server = app.listen(port)
        const wss = new WebSocketServer({ server: server })

        wss.on("connection", function connection(ws: CustomWebsocket) {
            ws.on("error", (e) => console.log(e))

            ws.on("message", function message(message: any) {
                try {
                    const data = JSON.parse(message)

                    if (data.type === "firstonline") {
                        if (!data.token) {
                            ws.send(JSON.stringify({
                                message:"no token present",
                                status: 401
                            }))
                           return 
                        }
                        const token = jwt.verify(data.token, "addasd") as { id: string, instituteId: string }
                        ws.userId = token.id
                        ws.instituteId = token.instituteId

                        if (!token.id || !token.instituteId) {
                            ws.send(JSON.stringify({
                                type: "error",
                                message: "invalid token",
                                status: 401
                            }))
                        }

                        const response = ContestManager.getInstance().firstOnline(ws ,data.contestId)
                    }
                } catch (e) {
                    console.log(e)
                    ws.send(JSON.stringify({
                        type: "error",
                        message: "something went wrong",
                        status: 403
                    }))
                    return
                }

            })
        })

    } catch (e) {
        console.log(e)
        return
    }

}



main()




// const redis = new Redis()
// async function main() {
//     await redis.xadd("molest", "*", "data", "as" )
// }
// main()