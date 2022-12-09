const express = require("express")
const withdrawal = require('../controls/withdrawal')
const { adminAuth, activatedUserAuth } = require("../../auth/middlewares/auth")

const route = express.Router()

route.get("/get-all-transactions", activatedUserAuth, adminAuth, withdrawal.getAllTransactions_admin);
route.get("/get-all-transactions-users", activatedUserAuth, withdrawal.getAllTransactions_users);
route.get("/get-transaction/:id", activatedUserAuth, withdrawal.getTransaction);
route.post("/request", activatedUserAuth, withdrawal.request);
route.put("/reject/:id", activatedUserAuth, adminAuth, withdrawal.rejected);
route.put("/confirm/:id", activatedUserAuth, adminAuth, withdrawal.confirm);
route.get("/latest", withdrawal.latest);


module.exports = route