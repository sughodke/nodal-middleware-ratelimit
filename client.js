const redis = require("redis");

const client = redis.createClient(process.env.REDIS_URL);

client.on("error", err => console.log("Error " + err));
client.auth(process.env.REDIS_PASSWORD);

// Exporting a singleton
module.exports = client;
