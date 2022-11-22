const express = require("express")
const authCrtl = require('../controls/auth')
const { adminAuth, activatedUserAuth, supperAdminAuth } = require("../middlewares/auth")

const route = express.Router()

// route.get("/authorize", authCrtl.authorize);
route.get("/get-users", activatedUserAuth, adminAuth, authCrtl.getUsers);

route.get("/get-profile", activatedUserAuth, authCrtl.getProfile);

route.get("/get-users/:id", activatedUserAuth, adminAuth, authCrtl.getUser);

route.post("/signup", authCrtl.signup);

route.post("/resend-verification-link", authCrtl.resendVerificationLink);

route.get("/verify-email", authCrtl.verifyAccount);

route.post("/signin", authCrtl.signin);

route.get("/generate-accesstoken", authCrtl.generateAccesstoken);

route.put('/reset-password', activatedUserAuth, authCrtl.resetPassword);

route.post("/forgot-password", authCrtl.forgotPassword);

route.put('/verify-forgot-password', authCrtl.verifyForgotPassword);

route.put('/toggle-admin/:id', activatedUserAuth, adminAuth, authCrtl.toggleAdmin)

route.put('/toggle-block-user/:id', activatedUserAuth, adminAuth, authCrtl.toggleBlockUser)

route.put('/delete-many-accounts', activatedUserAuth, supperAdminAuth, authCrtl.deleteManyAccounts)

route.put('/delete-all-accounts', activatedUserAuth, supperAdminAuth, authCrtl.deleteAllAccounts)


module.exports = route