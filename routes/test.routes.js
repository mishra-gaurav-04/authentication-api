const express = require('express');
const {verifyAccessToken} = require('../services/token-service');
const router = express.Router();


router.get('/home',verifyAccessToken,async(req,res,next) => {
    res.send({
     message : 'hello from home'   
    })
});


module.exports = router;