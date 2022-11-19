const express = require("express")
const internalTransfer = require('../controls/internalTransfer')
const { adminAuth, activatedUserAuth } = require("../../auth/middlewares/auth")

const route = express.Router()

route.get("/get-all-transactions", adminAuth, internalTransfer.getAllTransactions);
route.get("/get-all-transactions-users", activatedUserAuth, internalTransfer.getAllTransactions_user);
route.get("/get-transaction/:id", activatedUserAuth, internalTransfer.getTransaction);
route.post("/check-user", activatedUserAuth, internalTransfer.checkUser);
route.post("/pay-user", activatedUserAuth, internalTransfer.payUser);


module.exports = route