const express = require("express")
const authCrtl = require('../controls/auth')
const { adminAuth, activatedUserAuth, supperAdminAuth } = require("../middlewares/auth")

const route = express.Router()

// route.get("/authorize", authCrtl.authorize);
route.get("/get-all-users", adminAuth, authCrtl.getUsers);

route.get("/get-profile", activatedUserAuth, authCrtl.getProfile);

route.get("/get-user/:id", adminAuth, authCrtl.getUser);

route.post("/signup", authCrtl.signup);

route.post("/resend-verification-link", authCrtl.resendVerificationLink);

route.get("/verify-email", authCrtl.verifyAccount);

route.post("/signin", authCrtl.signin);

route.post("/admin-login", activatedUserAuth, authCrtl.adminLogin);

route.get("/generate-accesstoken", authCrtl.generateAccesstoken);

route.put('/reset-password', activatedUserAuth, authCrtl.resetPassword);

route.post("/forgot-password", authCrtl.forgotPassword);

route.put('/verify-forgot-password', authCrtl.verifyForgotPassword);

route.put('/toggle-admin/:id', supperAdminAuth, authCrtl.toggleAdmin)

route.put('/toggle-block-user/:id', adminAuth, authCrtl.toggleBlockUser)

route.delete('/delete-many-accounts', supperAdminAuth, authCrtl.deleteManyAccounts)

route.delete('/delete-all-accounts', supperAdminAuth, authCrtl.deleteAllAccounts)


module.exports = route