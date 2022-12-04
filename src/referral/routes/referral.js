const express = require("express")
const referral = require('../controls/referral')
const { activatedUserAuth, supperAdminAuth } = require("../../auth/middlewares/auth")

const route = express.Router()

route.get("/get-all-hx", activatedUserAuth, referral.getReferralHistories);

route.get("/get-hx/:id", activatedUserAuth, referral.getReferralHistoriesById);

route.put("/add-refcode", activatedUserAuth, referral.addReferral);


route.get("/contest/contestants", activatedUserAuth, referral.getAllReferralContest);

route.put("/contest/reset", activatedUserAuth, supperAdminAuth, referral.resetContest);

route.put("/contest/resolve", activatedUserAuth, supperAdminAuth, referral.resolveContest);

route.delete("/contest/remove-user/:id", activatedUserAuth, supperAdminAuth, referral.removeUserFromContest);

module.exports = route