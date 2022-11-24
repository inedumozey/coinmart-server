const express = require("express")
const referral = require('../controls/referral')
const { activatedUserAuth, adminAuth, supperAdminAuth } = require("../../auth/middlewares/auth")

const route = express.Router()

route.get("/get-all-hx", activatedUserAuth, referral.getReferralHistories);

route.get("/get-hx/:id", activatedUserAuth, referral.getReferralHistoriesById);

route.put("/add-refcode", activatedUserAuth, referral.addReferral);

route.get("/contest/get-all", activatedUserAuth, referral.getAllReferralContest);

route.put("/contest/reset", adminAuth, referral.resetContest);

route.put("/contest/resolve", supperAdminAuth, referral.resolveContest);

route.delete("/contest/remove-user/:id", supperAdminAuth, referral.removeUserFromContest);

module.exports = route