const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const dotenv = require('dotenv');
const client = require('../config/init_redis');

dotenv.config();

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

const signAccessToken = (userId) => {
    return new Promise((resolve, reject) => {
        const payload = {};
        const secret = accessTokenSecret;
        const options = {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRE_TIME,
            issuer: 'localhost',
            audience: userId
        };
        jwt.sign(payload, secret, options, (err, token) => {
            if (err) {
                console.log(err);
                return reject(createError.InternalServerError());
            }
            resolve(token);
        });
    });
};

const verifyAccessToken = (req, res, next) => {
    if (!req.headers['authorization']) {
        return next(createError.Unauthorized());
    }
    const authHeader = req.headers['authorization'];
    const bearerToken = authHeader.split(' ');
    const token = bearerToken[1];

    jwt.verify(token, accessTokenSecret, (err, payload) => {
        if (err) {
            const message = err.name === 'JsonWebTokenError' ? 'Unauthorized' : err.message;
            return next(createError.Unauthorized(message));
        }
        req.payload = payload;
        next();
    });
}

const signRefreshToken = (userId) => {
    return new Promise((resolve, reject) => {
        const payload = {};
        const secret = refreshTokenSecret;
        const options = {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRE_TIME,
            issuer: 'localhost',
            audience: userId
        };
        jwt.sign(payload, secret, options, (err, token) => {
            if (err) {
                console.log(err);
                return reject(createError.InternalServerError());
            }
            client.SET(userId,token,'EX',30*24*60*60,(err,reply) => {
                if(err){
                    reject(createError.InternalServerError());
                }
            })
            resolve(token);
        });
    });
};

const verifyRefreshToken = (refreshToken) => {
    return new Promise((resolve,reject) => {
        jwt.verify(refreshToken,refreshTokenSecret,(err,payload) => {
            if(err){
                return createError.Unauthorized();
            }
            const userId = payload.aud;

            client.GET(userId,(err,result) => {
                if(err){
                    console.log(err);
                    return reject(createError.InternalServerError());
                }

                if(refreshToken === result){
                    return resolve(userId);
                }
                reject(createError.Unauthorized());
            })

            resolve(userId);
        })
    })
}

module.exports = {
    signAccessToken,
    verifyAccessToken,
    signRefreshToken,
    verifyRefreshToken
};
