const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email : {
        type : String,
        required : true,
        unique : true,
        lowercase : true
    },
    password : {
        type : String,
        required : true,
    },
    passwordChangedAt : {
        type : Date,
        required : true
    }
});

userSchema.pre('save',async function(next){
    try{
        const salt = await bcrypt.genSalt(12);
        const hashPassword = await bcrypt.hash(this.password,salt);
        this.password = hashPassword;
        next();
    }
    catch(error){
        next(error);
    }
})

userSchema.methods.isValidPassword = async function(password){
    try{
        return await bcrypt.compare(password,this.password);
    }
    catch(err){
        throw error
    }
}


userSchema.methods.checkPasswordChange = async function(JWTTimeStamp){
    if(this.passwordChangedAt){
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime()/1000,10);
        return JWTTimeStamp < changedTimeStamp;
    }
    return false;
}

module.exports = mongoose.model('User',userSchema);