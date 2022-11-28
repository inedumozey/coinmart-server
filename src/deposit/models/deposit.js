const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types

const schema = new mongoose.Schema(
    {
        userId: {
            type: ObjectId,
            ref: 'User'
        },
        code: {
            type: String
        },
        amountExpected: {
            type: Number
        },
        amountReceived: {
            type: Number
        },
        currency: {
            type: String,
            required: true
        },
        link: {
            type: String
        },
        overPaymentThreshold: {
            type: Number
        },
        underPaymentThreshold: {
            type: Number
        },
        status: {
            type: String,
            default: 'charge created'
        },
        overPaidBy: {
            type: Number,
            default: 0
        },
        underPaidBy: {
            type: Number,
            default: 0
        },
        comment: {
            type: String,
            default: 'created'
        },
        transactionType: {
            type: String,
            default: 'deposit'
        }
    },
    {
        timestamps: true
    }
)
mongoose.model("Deposit", schema);