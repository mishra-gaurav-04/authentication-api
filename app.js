const express = require('express');
const morgan = require('morgan');
const createError = require('http-errors');
const dotenv = require('dotenv');
const authRoutes =  require('./routes/auth.routes');
const connectDB = require('./config/database');
const testRoutes = require('./routes/test.routes');
require('./config/init_redis');
const app = express();



dotenv.config();

const PORT = process.env.PORT || 5500;
const MONGO_URI = process.env.MONGO_URI;

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended : true}));

app.use('/auth',authRoutes);
app.use('/test',testRoutes);

app.use(async(req,res,next) => {
    next(createError.NotFound());
})

app.use(async(err,req,res,next) => {
    res.status(err.status || 500).send({
        status : err.status || 500,
        message : err.message
    })
});

const startServer = () => {
    connectDB(MONGO_URI)
    .then((conn) => {
        console.log('Database Connected');
        app.listen(PORT,() => {
            console.log(`Server Started at ${PORT}`);
        })
    })
    .catch((err) => {
        console.log(err);
    })
}

startServer();
