const express = require('express');
const router = express.Router();
const { createShortUrl } = require("../controllers/urlController")


router.post("/url/shorten", createShortUrl)


module.exports = router;