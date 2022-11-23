const mongoose = require('mongoose');

const schema = new mongoose.Schema(
    {
        unverifiedUserLifeSpan: {
            type: Number,
            default: 0 // in seconds, stays forever 
        },
        totalMembers: {
            type: Number,
            default: 0
        },
        totalInvestors: {
            type: Number,
            default: 0
        },
        totalWithdrawal: {
            type: Number,
            default: 0
        },
        membersCountry: {
            type: Number,
            default: 0
        },
        totalDeposit: {
            type: Number,
            default: 0
        },
        currency: {
            type: String,
            default: "USD"
        },
        adminPassword: {
            type: String,
        },
        allowTransfer: {
            type: Boolean,
            default: true
        },
        allowWithdrawal: {
            type: Boolean,
            default: true
        },
        allowInvestment: {
            type: Boolean,
            default: true
        },
        investmentLimits: {
            type: Number,
            default: 2
        },
        referralBonusPercentage: {
            type: Number,
            default: 10
        },
        referralBonusLimit: {
            type: Number,
            default: 1
        },
        referralContestPercentage: {
            type: Number,
            default: 0
        },
        allowReferralContest: {
            type: Boolean,
            default: false
        },
        startContestReg: {
            type: Boolean,
            default: false
        },
        referralContestStarts: {
            type: String,
            default: null
        },
        referralContestStops: {
            type: String,
            default: null
        },
        referralContestPrizes: [],
        minWithdrawableLimit: {
            type: Number,
            default: 0
        },
        maxWithdrawableLimit: {
            type: Number,
            default: 0
        },
        withdrawableCommonDiff: {
            type: Number,
            default: 0
        },
        withdrawableFactors: [],
        withdrawableCoins: [],

        minTransferableLimit: {
            type: Number,
            default: 0
        },
        maxTransferableLimit: {
            type: Number,
            default: 0
        },
        transferableCommonDiff: {
            type: Number,
            default: 0
        },
        transferableFactors: [],

        pendingWithdrawalDuration: {
            type: Number,
            default: 24
        }
    },
    {
        timestamps: true
    }
)
mongoose.model("Config", schema);