const express = require("express")
const investment = require('../controls/investment')
const { adminAuth, supperAdminAuth, activatedUserAuth } = require("../../auth/middlewares/auth")

const route = express.Router()

route.get("/plans/", investment.getAllPlans);
route.get("/plans/:id", activatedUserAuth, investment.getPlan);
route.post("/plans/", activatedUserAuth, adminAuth, investment.setPlan);
route.put("/plans/:id", activatedUserAuth, adminAuth, investment.updatePlan);
route.delete("/plans/:id", activatedUserAuth, supperAdminAuth, investment.deletePlan);
route.delete("/plans/", activatedUserAuth, supperAdminAuth, investment.deleteAllPlans);

route.get("/get-all-investments", activatedUserAuth, investment.getAllInvestments);
route.get("/get-all-investments-admin", activatedUserAuth, adminAuth, investment.getAllInvestments_admin);
route.get("/get-investment/:id", activatedUserAuth, investment.getInvestment);
route.post("/invest/:id", activatedUserAuth, investment.invest);
route.get("/resolve", investment.resolve);
route.put("/resolve-manual/:id", activatedUserAuth, adminAuth, investment.resolveManually);

module.exports = route