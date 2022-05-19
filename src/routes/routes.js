const express = require('express');
const router = express.Router();
const urlController = require("../controllers/urlController")


router.post("/url/shorten", urlController.createShortUrl)

router.get("/:urlCode", urlController.getUrl) //localhost:3000/y1aqeknfh_ordxkyglygp

module.exports = router;