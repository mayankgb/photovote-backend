import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()

export function middleware(req: Request, res: Response, next: NextFunction) {

    try {
        const token = req.headers.authorization
        console.log("this is the frontendtoken",token)
    if(!token) {
        res.status(403).json({
            message: 'Unauthorised Access'
        })
        return
    }
    console.log("this is the jwt secret",process.env.JWT_SECRET)
    const decode = jwt.verify(token, process.env.JWT_SECRET! ) as {id : string , instituteId: string}
   
    console.log("this is the middleware",decode)

    res.locals.userId = decode.id
    res.locals.instituteId = decode.instituteId

    next()
    
    return
    }catch(e) {
        console.log("this is the middleware", e)
        res.status(403).json({
            message:"somthing went wrong"
        })
        return
    }
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
    try {

        const token = req.headers.authorization
        if (!token) {
            res.status(403).json({
                message: "unauthorised access"
            })
            return
        }

        const decode = jwt.verify(token, process.env.JWT_SECRET || "sec3rt") as {id: string, instituteId: string, role: string}

        if (decode.role === "ADMIN" || decode.role === "OWNER") {
            res.locals.userId = decode.id
            res.locals.instituteId = decode.instituteId
            res.locals.role = decode.role
            next()
            return
        }

        res.status(403).json({
            message: "Unauthorised Access"
        })
        return

    }catch(e) {
        console.log(e)
        res.status(500).json({
            message: "something went wrong"
        })
        return
    }
}

export async function cronMiddleware(req: Request, res: Response, next:NextFunction) {

    try{

        const secret = req.headers.authorization

        if (!secret || !(process.env.CRON_SECRET === secret)) {
            res.status(401).json({
                message: "unauthorisd access"
            })
            return
        }

        next()
        return

    }catch(e){
        console.log(e)
        res.status(500).json({
            message: "something went wrong"
        })
        return 
    }
}