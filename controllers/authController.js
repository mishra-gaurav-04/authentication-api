const User = require('../models/User');
const createError = require('http-errors');
const authSchema = require('../utils/validation.schema');
const { signAccessToken,signRefreshToken,verifyRefreshToken } = require('../services/token-service');
const client = require('../config/init_redis');

exports.register = async(req,res,next) => {
    try{
        const result = await authSchema.validateAsync(req.body);
        const existingUser = await User.findOne({email : result.email});
        if(existingUser){
            throw createError.Conflict('Email is already in use');
        }
        const user = await User.create(result);
        const accessToken = await signAccessToken(user.id);
        const refreshToken = await signRefreshToken(user.id);
        res.send({accessToken,refreshToken});
    }
    catch(error){
        if(error.isJoi === true){
            error.status = 422;
        }
        next(error);
    }
};


exports.login = async(req,res,next) => {
    try{
        const result = await authSchema.validateAsync(req.body);
        const user = await User.findOne({email : result.email});

        if(!user){
            throw createError.NotFound('User not found');
        }

        const isValid = await user.isValidPassword(result.password)

        if(!isValid){
            throw createError.Unauthorized('Email or password is invalid');
        }

        const accessToken = await signAccessToken(user.id);
        const refreshToken = await signRefreshToken(user.id);
        res.send({accessToken,refreshToken});
    }
    catch(error){
        if(error.isJoi === true){
            return next(createError.BadRequest('Invalid email or password'))
        }
        console.log(error);
        next(error);
    }
};

exports.protected = async(req,res,next) => {
    try{
        const {aud,iat} = req.payload;

        const user = await User.findById({aud});
        
        if(!user){
            throw createError.NotFound('User Not found');
        }

        if(await user.checkPasswordChange(iat)){
            throw createError.Unauthorized('User has changed the password');
        }

        req.user = user;
        next();
    }
    catch(error){
        next(error);
    }
}

exports.refreshToken = async(req,res,next) => {
    try{
        const {refreshToken} = req.body;

        if(!refreshToken){
            throw createError.BadRequest();
        }

        const userId = await verifyRefreshToken(refreshToken);
        const accessToken = await signAccessToken(userId);
        const refToken = await signRefreshToken(userId);

        res.status(200).send({accessToken,refreshToken:refToken});

    }
    catch(error){
        next(error);
    }
};
exports.logout = async(req,res,next) => {
    try{
        const {refreshToken} = req.body;

        if(!refreshToken){
            throw createError.BadRequest();
        }
        
        const userId = await verifyRefreshToken(refreshToken);

        client.DEL(userId,(err,val) => {
            if(err){
                console.log(err);
                throw createError.InternalServerError();
            }
            console.log(val);
            res.sendStatus(204)
        })
    }
    catch(error){
        console.log(error);
        next(error);
    }
};
