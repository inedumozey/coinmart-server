const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types

const schema = new mongoose.Schema(
    {
        referrerId: {
            type: ObjectId,
            ref: 'User'
        },
        referreeId: {
            type: ObjectId,
            ref: 'User'
        },
        referreeUsername: {
            type: String,
            required: true
        },
        rewards: {
            type: Number,
            default: 0
        },
        currency: {
            type: String,
        },
        type: {
            type: String,
            default: 'referral'
        }
    },
    {
        timestamps: true
    }
)
mongoose.model("ReferralHistory", schema);