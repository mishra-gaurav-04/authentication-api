const redis = require('redis');

const client = redis.createClient({
    legacyMode : true,
    port : 6379,
    host : "127.0.0.1"
});

client.connect().then((conn) => {
    console.log('Redis Server UP')
})
.catch((err) => {
    console.log(err);
})


module.exports = client;