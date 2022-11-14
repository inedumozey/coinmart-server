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
        currency: {
            type: String,
            default: "USD"
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
        referralContestPercentage: {
            type: Number,
            default: 0
        },
        referralBonusPercentageForMasterPlan: {
            type: Number,
            default: 0.3
        },
        referralBonusMaxCountForMasterPlan: {
            type: Number,
            default: 30
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
            default: '2022-12-00T00:00'
        },
        referralContestStops: {
            type: String,
            default: '2022-12-00T00:00'
        },
        referralContestPrizes: [],
        minWithdrawalLimit: {
            type: Number,
            default: 5000
        },
        maxWithdrawalLimit: {
            type: Number,
            default: 100000
        },
        withdrawalCommonDiff: {
            type: Number,
            default: 5000
        },
        masterPlanAmountLimit: { // masterPlanMinAmount
            type: Number,
            default: 200000
        },
        withdrawalFactors: [],
        withdrawalCoins: [],
        minTransferLimit: {
            type: Number,
            default: 5000
        },
        maxTransferLimit: {
            type: Number,
            default: 100000
        },
        transferCommonDiff: {
            type: Number,
            default: 1000
        },
        transferFactors: [],
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