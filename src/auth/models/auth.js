const mongoose = require('mongoose');
const { Schema } = mongoose
const { ObjectId } = Schema.Types

const schema = new mongoose.Schema(
    {
        username: {
            type: String,
            require: true,
            unique: true,
            unique: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },
        password: {
            type: String,
            require: true,
            trim: true
        },
        profile: { type: ObjectId, ref: 'Profile' },
        amount: {
            type: Number,
            default: 0
        },
        currency: {
            type: String,
        },
        accountNumber: {
            type: String,
            unique: true,
            require: true,
        },
        role: {
            type: String,
            default: "USER"
        },
        isSupperAdmin: {
            type: Boolean,
            default: false
        },
        verifyEmailToken: {
            type: String,
            default: null
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        isBlocked: {
            type: Boolean,
            default: false
        },
        hasInvested: {
            type: Boolean,
            default: false
        },
        investmentCount: {
            type: Number,
            default: 0
        },
        referralContestRewards: {
            type: Number,
            default: 0
        },
        referralCode: {
            type: String,
            require: true,
            unique: true,
        },
        referreeId: [{
            type: ObjectId,
            ref: 'User'
        }],
        referrerId: {
            type: ObjectId,
            ref: 'User',
            default: null
        },
        referrerUsername: {
            type: String,
            default: null
        },
        newNotifications: [
            {
                type: ObjectId,
                ref: 'Notification',
            }
        ],
        readNotifications: [
            {
                type: ObjectId,
                ref: 'Notification',
            }
        ]
    },
    {
        timestamps: true
    }
)
mongoose.model("User", schema);