const mongoose = require('mongoose')
const axios = require('axios')
const Deposit = mongoose.model("Deposit");
const User = mongoose.model("User");
const Config = mongoose.model("Config");
require("dotenv").config();
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const { Client, resources, Webhook } = require('coinbase-commerce-node');

const CC_API_KEY = process.env.CC_API_KEY;
const CC_WEBHOOK_SECRET = process.env.CC_WEBHOOK_SECRET

Client.init(CC_API_KEY);
const { Charge } = resources;

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window)

module.exports = {

    deposit: async (req, res) => {
        try {

            const userId = req.user
            const user = await User.findOne({ _id: userId })

            // sanitize all elements from the client, incase of fodgery
            // amount is in dollars
            const data = {
                amount: Number(DOMPurify.sanitize(req.body.amount)),
            }

            // get all config
            const config = await Config.find({});
            const name = process.env.NAME
            const currency = config && config[0].currency;
            const bio = process.env.BIO;

            if (!data.amount) {
                return res.status(400).json({ status: false, msg: "Please enter amount" })
            }

            const chargeData = {
                name: name,
                description: bio,
                local_price: {
                    amount: data.amount,
                    currency: 'USD'
                },
                pricing_type: "fixed_price",
                metadata: {
                    customer_id: userId,
                    customer_name: user.username
                },

                redirect_url: `${process.env.FRONTEND_BASE_URL}/dashboard`,
                cancel_url: `${process.env.FRONTEND_BASE_URL}/dashboard`
            }

            const charge = await Charge.create(chargeData)
            const amountExpected = Number(charge.pricing.local.amount);

            // save info to the databse
            const newDepositData = new Deposit({
                userId: charge.metadata.customer_id,
                code: charge.code,
                amountExpected,
                amountReceived: 0,
                overPaidBy: 0,
                underPaidBy: 0,
                currency, // native currency of the app
                overPaymentThreshold: charge.payment_threshold.overpayment_relative_threshold,
                underPaymentThreshold: charge.payment_threshold.underpayment_relative_threshold,
                status: "charge-created",
                amountResolved: null,
                link: charge.hosted_url
            })

            await newDepositData.save()

            const data_ = {
                hostedUrl: newDepositData.link,
                redirecturl: chargeData.redirect_url,
                cancelUrl: chargeData.cancel_url,
            }

            // send the redirect to the client
            return res.status(200).json({ status: true, msg: 'Charge created, you will be redirected to pay shortly', data: data_ })

        }
        catch (err) {
            if (err.response) {
                return res.status(500).json({ status: false, msg: err.response.data })

            } else {
                if (err.message.includes('ENOTFOUND') || err.message.includes('ETIMEDOUT') || err.message.includes('ESOCKETTIMEDOUT')) {
                    return res.status(500).json({ status: false, msg: 'Poor network connection' })
                }
                else {
                    return res.status(500).json({ status: false, msg: err.message })
                }
            }
        }
    },

    depositWebhook: async (req, res) => {
        try {

            const rawBody = req.rawBody;
            const signature = req.headers['x-cc-webhook-signature'];
            const webhookSecret = CC_WEBHOOK_SECRET;
            const event = Webhook.verifyEventBody(rawBody, signature, webhookSecret);

            // get the deposit database
            const depositHx = await Deposit.findOne({ code: event.data.code })

            // charge canceled
            if (event.type === 'charge:failed' && !event.data.payments[0] && depositHx.status === 'charge-created') {
                await Deposit.findOneAndUpdate({ code: event.data.code }, {
                    $set: {
                        comment: 'canceled',
                        status: 'charge-failed',
                    }
                });
            }

            // charge pending
            else if (event.type === 'charge:pending' && depositHx.status === 'charge-created') {
                await Deposit.findOneAndUpdate({ code: event.data.code }, {
                    $set: {
                        comment: 'pending',
                        status: 'charge-pending',
                    }
                });
            }

            // charge conmfirmed
            else if (event.type === 'charge:confirmed' && (depositHx.status === 'charge-pending' || depositHx.status === 'charge-created')) {
                const amountReceived_ = event.data.payments[0].value.crypto.amount;
                const cryptocurrency = event.data.payments[0].value.crypto.currency;

                // convert amount received from whatever the currency paid with to USD
                const res = await axios.get(`https://api.coinbase.com/v2/exchange-rates?currency=${cryptocurrency}`);
                const amountReceived = Number(res.data.data.rates.USD) * Number(amountReceived_);

                const amountReceive = amountReceived.toFixed(8);

                await Deposit.findOneAndUpdate({ code: event.data.code }, {
                    $set: {
                        amountReceive,
                        comment: 'successful',
                        status: 'charge-confirmed',
                    }
                });

                const txn = await Deposit.findOne({ code: event.data.code, resolved: false });

                // update the user's account with the amount recieved (nativeAmountReceived); only get the users whose status is still pending
                const user = await User.findOne({ _id: txn.userId });
                await User.findByIdAndUpdate({ _id: txn.userId }, {
                    $set: {
                        amount: user.amount + amountReceive
                    }
                })

                await Transactions.findOneAndUpdate({ transactionId: txn._i }, {
                    $set: {
                        resolved: true
                    }
                });

            }

            // charge incorrect payment (overpayment/underpayment)
            else if ((event.type === 'charge:failed' && event.data.payments[0]) && (depositHx.status === 'charge-pending' || depositHx.status === 'charge-created')) {
                const amountExpected = Number(depositHx.tradeAmountExpected)
                const amountReceived_ = Number(event.data.payments[0].value.crypto.amount);
                const cryptocurrency = event.data.payments[0].value.crypto.currency;
                const overpayment_threshold = Number(event.data.payment_threshold.overpayment_relative_threshold);

                // convert amount received from whatever the currency paid with to USD
                const res = await axios.get(`https://api.coinbase.com/v2/exchange-rates?currency=${cryptocurrency}`);
                const amountReceived = Number(res.data.data.rates.USD) * Number(amountReceived_);

                // const isUnderpaid = (amountReceived < amountExpected) && (amountExpected - amountReceived < underpayment_threshold);

                const isOverpaid = (amountReceived > amountExpected) && (amountReceived - amountExpected > (overpayment_threshold - 0.004));


                const resolveComent = () => {

                    if (isOverpaid) {
                        return "overpayment"
                    }

                    else {
                        return "underpayment"
                    }
                }

                const resolveOverPayment = () => {
                    if (isOverpaid) {
                        const amountDiff = amountReceived - amountExpected
                        return amountDiff.toFixed(8)
                    }

                    else {
                        return 0
                    }
                }

                const resolveUnderPayment = () => {
                    if (!isOverpaid) {
                        const amountDiff = amountExpected - amountReceived
                        return amountDiff.toFixed(8)
                    }

                    else {
                        return 0
                    }
                }

                const amountReceive = amountReceived.toFixed(8);

                await Deposit.findOneAndUpdate({ code: event.data.code, resolved: false }, {
                    $set: {
                        amountReceive,
                        comment: resolveComent(),
                        status: 'charge-confirmed',
                        overPaidBy: resolveOverPayment(),
                        underPaidBy: resolveUnderPayment()
                    }
                })

                const txn = await Deposit.findOne({ code: event.data.code, resolved: false });

                // update the user's account with the amount recieved (nativeAmountReceived); only get the users whose status is still pending
                const user = await User.findOne({ _id: txn.userId });
                await User.findByIdAndUpdate({ _id: txn.userId }, {
                    $set: {
                        amount: user.amount + amountReceive
                    }
                })

                await Deposit.findOneAndUpdate({ code: event.data.code }, { $set: { resolved: true } })
            }

        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message })
        }
    },

    getAllDeposits_admin: async (req, res) => {
        try {
            // charge-failed
            // charge-created
            // charge-pending
            // charge-confirmed

            const data = await Deposit.find({})
                .populate({ path: 'userId', select: ['_id', 'email', 'username'] })
                .sort({ updatedAt: -1 });

            return res.status(200).json({ status: true, msg: 'successful', data })

        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.response.data })
        }
    },

    getAllDeposits_users: async (req, res) => {
        try {
            const userId = req.user

            const txns = await Deposit.find({ userId }).populate({ path: 'userId', select: ['_id', 'email', 'username'] }).sort({ updatedAt: -1 });
            return res.status(200).json({ status: true, msg: 'successful', data: txns })

        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.response.data })
        }
    },

    resolve: async (req, res) => {
        try {
            const { id } = req.params;

            const data = {
                amount: Number(DOMPurify.sanitize(req.body.amount)),
            }

            if (!data.amount) {
                return res.status(400).json({ status: false, msg: 'The field is required' })
            }
            else {

                // find the deposit hx
                const txn = await Deposit.findOne({ _id: id })

                if (txn.status === 'charge-confirmed') {
                    return res.status(400).json({ status: false, msg: 'This transaction is alread successful' })
                }
                else {
                    //find and update transaction in deposit and transaction hx
                    const newData = await Deposit.findOneAndUpdate({ _id: id }, {
                        $set: {
                            comment: 'Manual',
                            status: 'charge-confirmed',
                            amountReceived: data.amount.toFixed(8)
                        }
                    }, { new: true })

                    // find the user and update his/her acount balance
                    const user = await User.findOne({ _id: newData.userId })
                    await User.findOneAndUpdate({ _id: newData.userId }, {
                        $set: {
                            amount: (user.amount + data.amount).toFixed(8)
                        }
                    })

                    return res.status(200).json({ status: true, msg: 'successfu', data: newData })
                }
            }
        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message })
        }
    },

    latest: async (req, res) => {
        try {
            const data = await Deposit.find({ status: 'charge-confirmed' })
                .populate({ path: 'userId', select: ['_id', 'email', 'username'] })
                .sort({ updatedAt: -1 })
                .limit(10)

            return res.status(200).json({ status: true, msg: 'successful', data })

        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.response.data })
        }
    },

}
