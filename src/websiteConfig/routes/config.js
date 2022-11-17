const express = require("express")
const config = require('../controls/config')
const { adminAuth, supperAdminAuth } = require("../../auth/middlewares/auth")

const route = express.Router()

route.get("/", config.getConfig);
route.put("/update", adminAuth, config.updateConfig);
route.put("/change-admin-password", supperAdminAuth, config.changeAdminPassword);

module.exports = route;