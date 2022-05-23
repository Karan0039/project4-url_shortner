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

//1.
const createShortUrl = async function (req, res) {
    try {
        let requestBody = req.body
        //  IF BODY  NOT PRESENT
        if (Object.keys(requestBody).length == 0)
            return res.status(400).send({ status: false, message: "Enter data in body" })

        //   URL  VALIDATION
        if (!isValid(requestBody.longUrl))
            return res.status(400).send({ status: false, message: "Enter Url in LongUrl key" })

        // if (!validUrl.isUri(requestBody.longUrl))
        //     return res.status(400).send({ status: false, message: "Enter valid url" });
        let regx = /^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})?$/;
        if (!regx.test(requestBody.longUrl)) {
            return res.status(400).send({ status: false, message: "Enter valid url" })
        }
        //  FUNCTION  FOR MAKING  RESPONSE
        let data = function (document) {
            return {
                longUrl: document.longUrl,
                shortUrl: document.shortUrl,
                urlCode: document.urlCode
            }
        }
        //  IF  DATA  EXIST  IN CACHE
        let existUrl = await GET_ASYNC(`${requestBody.longUrl}`)
        if (existUrl)
            return res.status(200).send({ status: true, message: "Allready Created", data: data(JSON.parse(existUrl)) });

        //  IF ALL THING ALLREADY EXIST  FOR SAME URL  IN DB
        existUrl = await urlModel.findOne({ longUrl: requestBody.longUrl });
        if (existUrl) {
            await SET_ASYNC(`${requestBody.longUrl}`, JSON.stringify(existUrl));  //  SAVING  IN CACHE AFTET FINDING  FROM DB
            return res.status(200).send({ status: true, message: "Allready Created", data: data(existUrl) });
        }

        //requestBody.urlCode=(parseInt(Math.random()*10**16)).toString(36) // Creating urlCode
        //  DOCUMENT CREATION  IN  DB
        requestBody.urlCode = nanoId.nanoid(); //  URL CODE CREATION
        requestBody.shortUrl = "http://localhost:3000/" + requestBody.urlCode; // URL  SHORTING  CONCATINAION
        const urlCreated = await urlModel.create(requestBody);
        await SET_ASYNC(`${requestBody.longUrl}`, JSON.stringify(urlCreated));  //  ADDING  DOC  IN CACHE 
        res.status(201).send({ status: true, data: data(urlCreated) });
    }
    catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
};

//  2.
const getUrl = async function (req, res) {
    try {
        const reqParams = req.params.urlCode
        // CHECKING  DATA EXISTANCE  IN CACHE
        let url = await GET_ASYNC(`${req.params.urlCode}`)
        if (url) {
            const a = JSON.parse(url).longUrl
            return res.status(302).redirect(a)
        } else {
            //  CHECKING  DATA EXISTANCE  IN DB
            let url = await urlModel.findOne({ urlCode: req.params.urlCode });
            // IF  DOC  NOT  FOUND  IN  DB
            if (!url)
                return res.status(404).send({ status: false, message: "Url Not Found for Given UrlCode" });
            //  ADDING  IN  CACHE IF DOC FOUND  IN  DB
            await SET_ASYNC(`${req.params.urlCode}`, JSON.stringify(url))
            res.status(302).redirect(url.longUrl);
        }
    }
    catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
};

module.exports = { createShortUrl, getUrl }

