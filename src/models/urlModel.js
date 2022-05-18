const mongoose = require("mongoose")

const urlSchema = new mongoose.Schema({
    urlCode: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    longUrl: {
<<<<<<< HEAD
        type: String,
=======
        type:String,
>>>>>>> 54ef5f56e7b01613fa59256f6ce03cf7a4614fcf
        required: true
    },
    shortUrl: {
        type:String,
        required: true,
        unique: true
    }
}, { timestamps: true })

module.exports = mongoose.model("url", urlSchema)