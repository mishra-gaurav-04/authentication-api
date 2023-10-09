const Joi = require('@hapi/joi');

const authSchema = Joi.object({
    email : Joi.string().email().required().lowercase(),
    password : Joi.string().min(2).required()
})


module.exports = authSchema;
