const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types

const schema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            trim: true,
        },
        returnPercentage: {
            type: Number,
            required: true,
            trim: true
        },
        lifespan: {
            type: Number,
            required: true,
            trim: true // in seconds
        },
        userId: {
            type: ObjectId,
            ref: 'User',
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        rewarded: {
            type: Boolean,
            default: false
        },
        rewards: {
            type: Number,
            default: 0
        },
        currency: {
            type: String,
        },
        status: {
            type: String,
            default: 'Active'
        },
        isActive: {
            type: Boolean,
            default: true
        },
        transactionType: {
            type: String,
            default: 'investment'
        }
    },
    {
        timestamps: true
    }
)
mongoose.model("Investment", schema);