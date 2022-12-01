const express = require("express")
const notification = require('../controls/notification')
const { adminAuth, activatedUserAuth } = require("../../auth/middlewares/auth")

const route = express.Router()

route.post("/admin/push", activatedUserAuth, adminAuth, notification.push);
route.get("/admin/", activatedUserAuth, adminAuth, notification.getAdd_Admin);
route.get("/admin/:id", activatedUserAuth, adminAuth, notification.getAdd_Admin);

route.put("/read/:id", activatedUserAuth, notification.read);


module.exports = route