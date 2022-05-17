const mongoose = require("mongoose")

const urlSchema = new mongoose.Schema({
    urlCode: {
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    longUrl: {
        required: true
    },
    shortUrl: {
        required: true,
        unique: true
    }
}, { timestamps: true })

module.exports = mongoose.model("url", urlSchema)