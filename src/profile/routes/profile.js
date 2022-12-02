const express = require("express")
const profile = require('../controls/profile')
const { activatedUserAuth } = require("../../auth/middlewares/auth")

const route = express.Router()

route.put("/upload-profile", activatedUserAuth, profile.updateProfileImage);
route.put("/update-profile", activatedUserAuth, profile.updateProfile);
route.put("/update-2fa", activatedUserAuth, profile.update2fa);
route.put("/contact-admin", activatedUserAuth, profile.contactAdmin);


module.exports = route