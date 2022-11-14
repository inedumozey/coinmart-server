const express = require("express")
const config = require('../controls/config')
const { adminAuth } = require("../../auth/middlewares/auth")

const route = express.Router()

route.get("/", config.getConfig);
route.put("/update", config.updateConfig);

module.exports = route;