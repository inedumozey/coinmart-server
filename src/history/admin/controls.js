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

            // 1. get the profile
            const profile = await User.findOne({ _id: id })
                .populate({ path: 'referrerId', select: ['_id', 'email', 'username'] })
                .populate({ path: 'referreeId', select: ['_id', 'email', 'username', 'hasInvested'] })
                .populate({ path: 'profile' })
                .select("-password");

            // 2. get the deposit
            const deposit = await Deposit.find({ userId: id }).populate({ path: 'userId', select: ['_id', 'email', 'username'] }).sort({ updatedAt: -1 });

            // 3. get the referral history
            // get all referralBonus hx
            const referral = await ReferralHistory.find({ referrerId: id }).populate({ path: 'referreeId', select: ['_id', 'email', 'username'] }).sort({ createdAt: -1 });

            // 4. get the withdrawal history
            // get all withdrawal hx from the database
            const withdrawal = await Withdrawal.find({ userId: id }).populate({ path: 'userId', select: ['_id', 'email', 'username', 'isAdmin'] }).sort({ updatedAt: -1 });

            // 5. get the transfer history
            const transfer = await InternalTransfer.find({ $or: [{ senderId: id }, { receiverId: id }] }).populate({ path: 'senderId', select: ['_id', 'username', 'accountNumber', 'email'] }).populate({ path: 'receiverId', select: ['_id', 'username', 'accountNumber', 'email'] }).sort({ createdAt: -1 });

            // 6. get the investment history
            const investment = await Investment.find({ userId: id }).populate({ path: 'userId', select: ['_id', 'email', 'amount', 'username'] }).sort({ updatedAt: -1 });

            const data = { profile, deposit, referral, withdrawal, investment, transfer }

            return res.status(200).json({ status: false, msg: "Sucessful", data });

        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message })
        }
    }
}