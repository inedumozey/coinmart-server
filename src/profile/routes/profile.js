const express = require("express")
const profile = require('../controls/profile')
const { activatedUserAuth } = require("../../auth/middlewares/auth")

const route = express.Router()

route.put("/upload-profile", activatedUserAuth, profile.updateProfileImage);
route.put("/upload-doc", activatedUserAuth, profile.updateDoc);
route.put("/update-2fa", activatedUserAuth, profile.update2fa);


module.exports = route