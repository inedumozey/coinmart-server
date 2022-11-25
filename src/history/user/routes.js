const express = require("express")
const controls = require('./controls')
const { activatedUserAuth } = require("../../auth/middlewares/auth")

const route = express.Router()

route.get("/user/:id", activatedUserAuth, controls.controls);


module.exports = route