const mongoose = require('mongoose');

const schema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        minAmount: {
            type: Number,
            default: 0,
            required: true,
            trim: true
        },
        maxAmount: {
            type: Number,
            default: 0,
            required: true,
            trim: true
        },
        currency: {
            type: String,
            trim: true
        },
        lifespan: {
            type: Number,
            required: true,
            trim: true
        },
        returnPercentage: {
            type: Number,
            required: true,
            trim: true
        },
        point: {
            type: Number,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true
    }
)
mongoose.model("InvestmentPlan", schema);


