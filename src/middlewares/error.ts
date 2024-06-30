import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/utility-class.js";
import { ControllerType } from "../types/types.js";

export const errorMiddleware = (err:ErrorHandler, req: Request, res: Response, next: NextFunction) => {
    err.message ||= "A server error occurred";
    err.statusCode ||= 500;


    if(err.name === "CastError"){
        err.message = "Invalid Id provided"
    }

    return res.status(err.statusCode).json({
        success: false,
        message: err.message
    })
}

export const TryCatch = (fn:ControllerType) => 
    (req: Request, res: Response, next: NextFunction) => 
    Promise.resolve(fn(req, res, next)).catch(next);