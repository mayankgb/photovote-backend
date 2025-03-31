import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken"

export function middleware(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization
    if(!token) {
        res.status(403).json({
            message: 'Unauthorised Access'
        })
        return
    }
    const decode = jwt.verify(token, process.env.JWT_SECRET || "addasd") as {id : string , instituteId: string}

    res.locals.userId = decode.id
    res.locals.instituteId = decode.instituteId

    next()
    
    return
}