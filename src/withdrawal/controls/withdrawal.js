const mongoose = require('mongoose')
const Withdrawal = mongoose.model("Withdrawal");
const User = mongoose.model("User");
const Config = mongoose.model("Config");
require("dotenv").config();
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const mailgunSetup = require('../../config/mailgun');

const URL_ADMIN = `${process.env.FRONTEND_BASE_URL}/${process.env.WITHDRAWAL_REQUEST_ADMIN}`
const URL_USER = `${process.env.FRONTEND_BASE_URL}/${process.env.WITHDRAWAL_REQUEST_USER}`

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window)

module.exports = {

    request: async (req, res) => {
        try {
            const userId = req.user;
            const data = {
                amount: Number(DOMPurify.sanitize(req.body.amount)),
                coin: DOMPurify.sanitize(req.body.coin),
                walletAddress: DOMPurify.sanitize(req.body.walletAddress)
            };

            // get currency, withdrawalCoins, maxWithdrawalLimit, minWithdrawalLimit and withdrawalCommomDifference from config data if exist otherwise set to the one in env

            // get all config
            const config = await Config.find({});
            const currency = config && config[0].currency
            const withdrawableCoins = config && config[0].withdrawableCoins
            const withdrawableFactors = config && config[0].withdrawableFactors
            const pendingWithdrawalDuration = config && config[0].pendingWithdrawalDuration

            if (!data.amount || !data.walletAddress) {
                return res.status(400).json({ status: false, msg: "All fields are required" });
            }

            // validate
            if (!data.coin) {
                return res.status(400).json({ status: false, msg: "Please select a coin" });
            }

            // check for withdrawable factors
            // if withdrawableFactors is 1, users can withdraw any amount otherwise, users can only withdraw amount in the withdrawableFactors array
            if (withdrawableFactors.length !== 1 && withdrawableFactors[0] !== 1) {
                if (!withdrawableFactors.includes(data.amount)) {
                    return res.status(400).json({ status: false, msg: "Invalid amount" });
                }
            }

            // check if coin selected is valid
            if (!withdrawableCoins.includes(data.coin)) {
                return res.status(400).json({ status: false, msg: "Unsupported coin" });
            }

            // amount requested for should not be more than their account total balance
            const user = await User.findOne({ _id: userId });

            if (data.amount > user.amount) {
                return res.status(400).json({ status: false, msg: "Insulficient balance" });
            }


            // get all Withdrawal hx, and check if the user has a pending transaction
            const pending = await Withdrawal.find({ $and: [{ userId }, { status: "pending" }] })

            if (pending.length) {
                return res.status(400).json({ status: false, msg: "You have a pending transaction" });
            }

            // save this data in Withdrawal database
            const newData_ = new Withdrawal({
                userId,
                amount: (data.amount).toFixed(8),
                walletAddress: data.walletAddress,
                coin: data.coin,
                currency,
            })

            // remove the amount from the user's account balance
            await User.findByIdAndUpdate({ _id: userId }, {
                $set: {
                    amount: (user.amount - data.amount).toFixed(8)
                }
            });

            const newData = await newData_.save();

            const withdrawalData = await Withdrawal.findOne({ _id: newData.id }).populate({ path: 'userId', select: ['_id', 'username', 'email'] })

            // send email to admin
            const text = `
                    <div> <span style="font-weight: bold">${user.username}</span> just placed a Withdrawal Request </div>
                    <br />
                    <br />
                    <div> Amount: ${data.amount.toFixed(4)} ${currency} </div>
                    <br />
                    <div> Wallet: ${data.walletAddress} <div/ >
                    <br />
                    <div> Coin: ${data.coin} <div/ >
                    <br />
                    <div> Transaction Id: ${newData._id} </div>
                    <br />
                    <div> Date: ${new Date(newData.createdAt).toLocaleString()} </div>
                    <br />
                    <div>
                        <a style="text-align:center; font-weight: 600" href="${URL_ADMIN}">Click to Resolve</a>
                    </div>
                    <br />
                    <div>${URL_ADMIN}</div>
                `
            const email_data = {
                from: `${process.env.NAME} <${process.env.EMAIL_USER}>`,
                to: [process.env.EMAIL_USER, process.env.EMAIL_USER2],
                subject: 'New Withdrawal Request',
                html: text
            }

            mailgunSetup.messages().send(email_data, (err, body) => {
                if (err) {
                    return res.status(400).json({ status: true, msg: err.message })
                }
            })

            return res.status(200).json({ status: true, msg: `Your transaction is pending, It will be confirmed within ${pendingWithdrawalDuration} hours`, data: withdrawalData })
        }

        catch (err) {
            return res.status(500).json({ status: false, msg: err.message })
        }
    },

    rejected: async (req, res) => {
        try {
            const { id } = req.params

            // get all config
            const config = await Config.find({});
            const currency = config && config[0].currency

            // get this withdrawal hx from the database
            const withdrawalHx = await Withdrawal.findOne({ _id: id })

            if (!withdrawalHx) {
                return res.status(400).json({ status: false, msg: "Transaction not found" })
            }

            if (withdrawalHx.status === 'rejected') {
                return res.status(400).json({ status: false, msg: "Transaction already rejected" });
            }

            if (withdrawalHx.status === 'confirmed') {
                return res.status(400).json({ status: false, msg: "Transaction already confirmed" });
            }

            // save this data in Withdrawal database and change the status to rejected and refund the money to user

            // find the user
            const user = await User.findOne({ _id: withdrawalHx.userId })

            // add the removed amount to the user's account balance
            await User.findByIdAndUpdate({ _id: withdrawalHx.userId }, { $set: { amount: user.amount + withdrawalHx.amount } })

            // update the Withdrawal database and change the status to rejected
            await Withdrawal.findByIdAndUpdate({ _id: id }, {
                $set: {
                    status: 'rejected',
                }
            })

            const withdrawalData = await Withdrawal.findOne({ _id: withdrawalHx.id }).populate({ path: 'userId', select: ['_id', 'username', 'email'] })

            // send email to admin
            const text = `
                    <div> Your Withdrawal Request was rejected </div>
                    <br />
                    <div> Amount: ${withdrawalData.amount} ${currency} </div>
                    <br />
                    <div> Wallet: ${withdrawalData.walletAddress} <div/ >
                    <br />
                    <div> Wallet: ${withdrawalData.coin} <div/ >
                    <br />
                    <div> Transaction Id: ${withdrawalData.id} </div>
                    <br />
                    <div> Date: ${new Date(withdrawalData.updatedAt).toLocaleString()} </div>
                    <br />
                    <div>
                        <a style="text-align:center; font-weight: 600" href="${URL_USER}">Click to Resolve</a>
                    </div>
                    <br />
                    <div>${URL_USER}</div>
                `

            const email_data = {
                from: `${process.env.NAME} <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: 'Withdrawal Transaction',
                html: text
            }

            await mailgunSetup.messages().send(email_data)

            return res.status(200).json({ status: true, msg: `withdrawal to this wallet ${withdrawalData.walletAddress} was rejected`, data: withdrawalData })
        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.mrssage })
        }
    },

    confirm: async (req, res) => {
        try {

            const { id } = req.params

            // get all config
            const config = await Config.find({});

            const currency = config && config[0].currency

            // get this withdrawal hx from the database
            const withdrawalHx = await Withdrawal.findOne({ _id: id })

            // find the user
            const user = await User.findOne({ _id: withdrawalHx.userId })

            if (!withdrawalHx) {
                return res.status(400).json({ status: false, msg: "Transaction not found" })
            }

            if (withdrawalHx.status === 'rejected') {
                return res.status(400).json({ status: false, msg: "Transaction was rejected, contact the client to resend request" });
            }

            if (withdrawalHx.status === 'confirmed') {
                return res.status(400).json({ status: false, msg: "Transaction already confirmed" });
            }

            // update the Withdrawal database and change the status to confirmed
            await Withdrawal.findByIdAndUpdate({ _id: id }, {
                $set: {
                    status: 'confirmed',
                }
            })

            const withdrawalData = await Withdrawal.findOne({ _id: withdrawalHx.id }).populate({ path: 'userId', select: ['_id', 'username', 'email'] })

            // senf email to admin
            const text = `
                <div> Your Withdrawal Request was Confirmed </div>
                <br />
                <div> Amount: ${withdrawalData.amount} ${currency} </div>
                <br />
                <div> Wallet: ${withdrawalData.walletAddress} <div/ >
                <br />
                <div> Wallet: ${withdrawalData.coin} <div/ >
                <br />
                <div> Transaction Id: ${withdrawalData.id} </div>
                <br />
                <div> Date: ${new Date(withdrawalData.updatedAt).toLocaleString()} </div>
                <br />
                <div>
                    <a style="text-align:center; font-weight: 600" href="${URL_USER}">Click to Resolve</a>
                </div>
                <br />
                <div>${URL_USER}</div>
            `
            const email_data = {
                from: `${process.env.NAME} <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: 'Withdrawal Transaction',
                html: text
            }

            await mailgunSetup.messages().send(email_data)

            return res.status(200).json({ status: true, msg: `Transaction confirmed`, data: withdrawalData })
        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message })
        }
    },

    getAllTransactions_admin: async (req, res) => {
        try {
            const { status } = req.query

            if (status.toLowerCase() === 'pending') {
                // get only pending withdrawal hx from the database
                const data = await Withdrawal.find({ status: 'pending' }).populate({ path: 'userId', select: ['_id', 'email', 'username', 'isAdmin'] }).sort({ updatedAt: -1 });

                return res.status(200).json({ status: true, msg: "Successful", data })
            }

            if (status.toLowerCase() === 'rejected') {
                // get only rejected withdrawal hx from the database
                const data = await Withdrawal.find({ status: 'rejected' }).populate({ path: 'userId', select: ['_id', 'email', 'username', 'isAdmin'] }).sort({ updatedAt: -1 });

                return res.status(200).json({ status: true, msg: "Successful", data })
            }

            if (status.toLowerCase() === 'confirmed') {
                // get only confirmed withdrawal hx from the database
                const data = await Withdrawal.find({ status: 'confirmed' }).populate({ path: 'userId', select: ['_id', 'email', 'username', 'isAdmin'] }).sort({ updatedAt: -1 });

                return res.status(200).json({ status: true, msg: "Successful", data })
            }

            // get all withdrawal hx from the database if query string is not specified
            const data = await Withdrawal.find({}).populate({ path: 'userId', select: ['_id', 'email', 'username', 'isAdmin'] }).sort({ updatedAt: -1 });

            return res.status(200).json({ status: true, msg: "Successful", data })

        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message })
        }
    },

    getAllTransactions_users: async (req, res) => {
        try {
            const userId = req.user
            // get all withdrawal hx from the database
            const withdrawalHxs = await Withdrawal.find({ userId }).populate({ path: 'userId', select: ['_id', 'email', 'username', 'isAdmin'] }).sort({ updatedAt: -1 });

            return res.status(200).json({ status: true, msg: "Successful", data: withdrawalHxs })
        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message });
        }
    },

    getTransaction: async (req, res) => {
        try {

            const { id } = req.params
            const userId = req.user

            // validate
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ status: false, msg: "Transaction not found" })
            }

            // get this withdrawal hx from the database
            const withdrawalHx = await Withdrawal.findOne({ $and: [{ _id: id }, { userId }] }).populate({ path: 'userId', select: ['_id', 'email', 'username'] }).sort({ updatedAt: -1 });

            if (!withdrawalHx) {
                return res.status(400).json({ status: false, msg: "Transaction not found" })
            }

            return res.status(200).json({ status: true, msg: "success", data: withdrawalHx })

        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message })
        }
    }
}