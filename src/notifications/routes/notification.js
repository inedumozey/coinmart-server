const express = require("express")
const notification = require('../controls/notification')
const { adminAuth, activatedUserAuth } = require("../../auth/middlewares/auth")

const route = express.Router()

route.post("/admin/push", activatedUserAuth, adminAuth, notification.push);
route.get("/admin/", activatedUserAuth, adminAuth, notification.getAll_Admin);
route.get("/admin/:id", activatedUserAuth, adminAuth, notification.getOne_Admin);

route.put("/read/:id", activatedUserAuth, notification.read);
route.put("/delete/:id", activatedUserAuth, notification.deleteNotification);


module.exports = route