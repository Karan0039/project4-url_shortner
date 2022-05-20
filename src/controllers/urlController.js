const urlModel = require("../models/urlModel")
const nanoId = require("nanoid")
const validUrl = require("valid-url")
const redis = require("redis");
const { promisify } = require("util");

const isValid = function (value) {
    if (typeof value === "undefined" || typeof value === null) return false
    if (typeof value === "string" && value.trim().length == 0) return false
    return true
};

//Connect to redis
const redisClient = redis.createClient(
    16932,
    "redis-16932.c93.us-east-1-3.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("foaM5sKgh2GmTqPmPUuCbOLnabnoRuEw", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});

//Connection setup for redis
const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);


const fetchAuthorProfile = async function (req, res) {
    let cahcedProfileData = await GET_ASYNC(`${req.params.authorId}`)
    if (cahcedProfileData) {
        res.send(cahcedProfileData)
    } else {
        let profile = await authorModel.findById(req.params.authorId);
        await SET_ASYNC(`${req.params.authorId}`, JSON.stringify(profile))
        res.send({ data: profile });
    }

};

const createShortUrl = async function (req, res) {
    try {
        let requestBody = req.body
        //  IF BODY  NOT PRESENT
        if (Object.keys(requestBody).length == 0)
            return res.status(400).send({ status: false, message: "Enter data in body" })

        if (!requestBody.longUrl)
            return res.status(400).send({ status: false, message: "longUrl is required" })
        //   URL  VALIDATION
        if (!isValid(requestBody.longUrl))
            return res.status(400).send({ status: false, message: "Enter Url in LongUrl key" })

        if (!validUrl.isUri(requestBody.longUrl))
            return res.status(400).send({ status: false, message: "Enter valid url" })

        //requestBody.urlCode=(parseInt(Math.random()*10**16)).toString(36) // Creating urlCode
        requestBody.urlCode = nanoId.nanoid(); //  URL CODE CREATION
        requestBody.shortUrl = "http://localhost:3000/" + requestBody.urlCode; // URL  SHORTING  CONCATINAION  

        let data = function (document) {
            return {
                longUrl: document.longUrl,
                shortUrl: document.shortUrl,
                urlCode: document.urlCode
            }
        }
        //  IF ALL THING ALLREADY EXIST  FOR SAME URL
        let existUrl = await GET_ASYNC(`${requestBody.longUrl}`)
        if (existUrl)
            return res.status(200).send({ status: true, data: data(JSON.parse(existUrl)) })

        existUrl = await urlModel.findOne({ longUrl: requestBody.longUrl });
        if (existUrl)
            return res.status(200).send({ status: true, data: data(existUrl) })

        //  document creation in DB
        const urlCreated = await urlModel.create(requestBody);
        //  adding document to cache
        await SET_ASYNC(`${requestBody.longUrl}`, JSON.stringify(urlCreated))
        res.status(201).send({ status: true, data: data(urlCreated) });
    }
    catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
};

//  2.
const getUrl = async function (req, res) {
    try {
        //  cheking data in cache 
        let url = await GET_ASYNC(`${req.params.urlCode}`)
        if (url) {
            res.redirect(JSON.parse(url).longUrl)
        } else {
            //  checking data in DB
            let url = await urlModel.findOne({ urlCode: req.params.urlCode });
            //when data not found
            if (!url)
                return res.status(404).send({ status: false, message: "Url Not Found for Given UrlCode" });
            //  adding data in cache is document found in DB
            await SET_ASYNC(`${req.params.urlCode}`, JSON.stringify(url))
            res.redirect(url.longUrl);
        }
    }
    catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
};

module.exports = { createShortUrl, getUrl }

