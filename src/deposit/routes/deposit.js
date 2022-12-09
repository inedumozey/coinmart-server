const express = require("express")
const deposit = require('../controls/deposit')
const { adminAuth, activatedUserAuth } = require("../../auth/middlewares/auth")

const route = express.Router()

route.post("/deposit", activatedUserAuth, deposit.deposit);
route.get("/deposit/latest", deposit.latest);
route.post("/payment-handler", deposit.depositWebhook);
route.get("/deposit/get-all-admin", activatedUserAuth, adminAuth, deposit.getAllDeposits_admin);
route.get("/deposit/get-all-users", activatedUserAuth, deposit.getAllDeposits_users);
route.put("/deposit/resolve/:id", activatedUserAuth, adminAuth, deposit.resolve);


module.exports = route