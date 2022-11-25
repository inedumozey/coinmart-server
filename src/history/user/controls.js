const mongoose = require('mongoose')
const InternalTransfer = mongoose.model("InternalTransfer");
const User = mongoose.model("User");
const Deposit = mongoose.model("Deposit");
const Withdrawal = mongoose.model("Withdrawal");
const Investment = mongoose.model("Investment");
const ReferralHistory = mongoose.model("ReferralHistory");

require("dotenv").config();
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window)


module.exports = {

    controls: async (req, res) => {
        try {
            const { id } = req.params;
            return res.status(200).json({ status: false, msg: "Sucessful for users", data: id })

        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message })
        }
    }
}