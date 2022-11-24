const express = require("express")
const internalTransfer = require('../controls/internalTransfer')
const { adminAuth, activatedUserAuth } = require("../../auth/middlewares/auth")

const route = express.Router()

route.get("/get-transactions-admin", activatedUserAuth, adminAuth, internalTransfer.getAllTransactions_admin);
route.get("/get-transactions", activatedUserAuth, internalTransfer.getAllTransactions);
route.get("/get-transaction-admin/:id", activatedUserAuth, adminAuth, internalTransfer.getTransaction_admin);
route.get("/get-transaction/:id", activatedUserAuth, internalTransfer.getTransaction);
route.post("/verify-acccount-no", activatedUserAuth, internalTransfer.verifyAccountNo);
route.post("/pay-user", activatedUserAuth, internalTransfer.payUser);


module.exports = route