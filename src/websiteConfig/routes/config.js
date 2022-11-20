const express = require("express")
const config = require('../controls/config')
const { adminAuth, activatedUserAuth, supperAdminAuth } = require("../../auth/middlewares/auth")

const route = express.Router()

route.get("/", config.getConfig);
route.put("/update", adminAuth, config.updateConfig);
route.post("/admin-login", activatedUserAuth, config.adminLogin);
route.put("/reset-admin-password", activatedUserAuth, supperAdminAuth, config.resetAdminPassword);

module.exports = route;