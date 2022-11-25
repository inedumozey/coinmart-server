const express = require("express")
const payusers = require('../controls/payusers')
const { adminAuth, supperAdminAuth } = require("../../auth/middlewares/auth")

const route = express.Router()

route.put("/:id", adminAuth, supperAdminAuth, payusers.payusers);


module.exports = route