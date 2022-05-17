const urlModel = require("../models/urlModel")
const nanoId = require("nanoid")
const validUrl = require("valid-url")


const createShortUrl = async function (req, res) {
    let reqBody = req.body
    if (Object.keys(reqBody).length == 0)
        return res.status(400).send({ status: false, message: "Enter data in body" })

    if (!validUrl.isUri(reqBody.longUrl))
        return res.status(400).send({ status: false, message: "Enter valid url" })

    //reqBody.urlCode=(parseInt(Math.random()*10**8)).toString(36)
    reqBody.urlCode = nanoId.nanoid()
    reqBody.shortUrl = "http://localhost:3000/" + reqBody.urlCode


}

module.exports = { createShortUrl }