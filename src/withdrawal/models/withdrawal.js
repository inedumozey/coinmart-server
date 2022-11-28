const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types

const schema = new mongoose.Schema(
    {
        userId: {
            type: ObjectId,
            ref: 'User'
        },
        walletAddress: {
            type: String,
            required: true,
            trim: true
        },
        amount: {
            type: Number,
            trim: true
        },
        currency: {
            type: String,
            required: true
        },
        coin: {
            type: String
        },
        status: {
            type: String,
            default: 'pending'
        },
        transactionType: {
            type: String,
            default: 'withdrawal'
        }
    },
    {
        timestamps: true
    }
)
mongoose.model("Withdrawal", schema);