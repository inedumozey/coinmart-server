const express = require("express")
const controls = require('./controls')
const { adminAuth, activatedUserAuth } = require("../../auth/middlewares/auth")

const route = express.Router()

route.get("/user/:id", activatedUserAuth, adminAuth, controls.controls);


module.exports = route