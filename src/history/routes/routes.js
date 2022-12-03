const express = require("express")
const controls = require('../controls/controls')
const { adminAuth, activatedUserAuth } = require("../../auth/middlewares/auth")

const route = express.Router()

route.get("/user_admin/:id", activatedUserAuth, adminAuth, controls.userAdmin);
route.get("/user", activatedUserAuth, controls.user);


module.exports = route