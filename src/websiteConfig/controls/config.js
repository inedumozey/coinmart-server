const mongoose = require('mongoose')
const Config = mongoose.model("Config");
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window)


module.exports = {

    getConfig: async (req, res) => {
        try {

            // get all config
            const config = await Config.find();

            // check if document is empty,
            if (config.length < 1) {

                // create the default
                const newConfig = await Config.create({})

                const configs = await newConfig.save()
                return res.status(200).json({ status: true, msg: "successful", data: configs })
            }

            // otherwise, get the existing ones
            const data = await Config.find();
            return res.status(200).json({ status: true, msg: "successful", data: data[0] })
        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message || "Server error, please contact customer support" })
        }

    },

    updateConfig: async (req, res) => {
        try {
            const data = {
                unverifiedUserLifeSpan: Number(DOMPurify.sanitize(req.body.unverifiedUserLifeSpan)),
                totalMembers: Number(DOMPurify.sanitize(req.body.totalMembers)),
                totalInvestors: Number(DOMPurify.sanitize(req.body.totalInvestors)),
                currency: DOMPurify.sanitize(req.body.currency),
                investmentLimits: Number(DOMPurify.sanitize(req.body.investmentLimits)),
                referralBonusPercentage: Number(DOMPurify.sanitize(req.body.referralBonusPercentage)),
                referralContestPercentage: Number(DOMPurify.sanitize(req.body.referralContestPercentage)),
                referralBonusPercentageForMasterPlan: Number(DOMPurify.sanitize(req.body.referralBonusPercentageForMasterPlan)),
                referralBonusMaxCountForMasterPlan: Number(DOMPurify.sanitize(req.body.referralBonusMaxCountForMasterPlan)),
                referralContestStarts: DOMPurify.sanitize(req.body.referralContestStarts),
                referralContestStops: DOMPurify.sanitize(req.body.referralContestStops),
                minWithdrawalLimit: Number(DOMPurify.sanitize(req.body.minWithdrawalLimit)),
                maxWithdrawalLimit: Number(DOMPurify.sanitize(req.body.maxWithdrawalLimit)),
                withdrawalCommonDiff: Number(DOMPurify.sanitize(req.body.withdrawalCommonDiff)),
                masterPlanAmountLimit: Number(DOMPurify.sanitize(req.body.masterPlanAmountLimit)),
                minTransferLimit: Number(DOMPurify.sanitize(req.body.minTransferLimit)),
                maxTransferLimit: Number(DOMPurify.sanitize(req.body.maxTransferLimit)),
                transferCommonDiff: Number(DOMPurify.sanitize(req.body.transferCommonDiff)),
                pendingWithdrawalDuration: Number(DOMPurify.sanitize(req.body.pendingWithdrawalDuration)),

                // array fields
                referralContestPrizes: req.body.referralContestPrizes,
                withdrawalFactors: req.body.withdrawalFactors,
                withdrawalCoins: req.body.withdrawalCoins,
                transferFactors: req.body.transferFactors,

                // boolean fields
                allowTransfer: DOMPurify.sanitize(req.body.allowTransfer),
                allowWithdrawal: DOMPurify.sanitize(req.body.allowWithdrawal),
                allowInvestment: DOMPurify.sanitize(req.body.allowInvestment),
                allowReferralContest: DOMPurify.sanitize(req.body.allowReferralContest),
                startContestReg: DOMPurify.sanitize(req.body.startContestReg),
            }

            // get all config
            let config = await Config.find();

            // check if document is empty,
            if (config.length < 1) {
                // create new one
                const newConfig = await Config.create({})

                const configs = await newConfig.save()
                return res.status(200).json({ status: true, msg: "successful", data: configs })
            }

            //get the first and only id
            const id = config[0].id

            //update config
            await Config.findOneAndUpdate({ _id: id }, {
                $set:
                {
                    unverifiedUserLifeSpan: data.unverifiedUserLifeSpan ? data.unverifiedUserLifeSpan : config[0].unverifiedUserLifeSpan,
                    totalMembers: data.totalMembers ? data.totalMembers : config[0].totalMembers,
                    totalInvestors: data.totalInvestors ? data.totalInvestors : config[0].totalInvestors,
                    currency: data.currency ? data.currency : config[0].currency,
                    investmentLimits: data.investmentLimits ? data.investmentLimits : config[0].investmentLimits,
                    referralBonusPercentage: data.referralBonusPercentage ? data.referralBonusPercentage : config[0].referralBonusPercentage,
                    referralContestPercentage: data.referralContestPercentage ? data.referralContestPercentage : config[0].referralContestPercentage,
                    referralBonusPercentageForMasterPlan: data.referralBonusPercentageForMasterPlan ? data.referralBonusPercentageForMasterPlan : config[0].referralBonusPercentageForMasterPlan,
                    referralBonusMaxCountForMasterPlan: data.referralBonusMaxCountForMasterPlan ? data.referralBonusMaxCountForMasterPlan : config[0].referralBonusMaxCountForMasterPlan,
                    referralContestStarts: data.referralContestStarts ? data.referralContestStarts : config[0].referralContestStarts,
                    referralContestStops: data.referralContestStops ? data.referralContestStops : config[0].referralContestStops,
                    minWithdrawalLimit: data.minWithdrawalLimit ? data.minWithdrawalLimit : config[0].minWithdrawalLimit,
                    maxWithdrawalLimit: data.maxWithdrawalLimit ? data.maxWithdrawalLimit : config[0].maxWithdrawalLimit,
                    withdrawalCommonDiff: data.withdrawalCommonDiff ? data.withdrawalCommonDiff : config[0].withdrawalCommonDiff,
                    masterPlanAmountLimit: data.masterPlanAmountLimit ? data.masterPlanAmountLimit : config[0].masterPlanAmountLimit,
                    minTransferLimit: data.minTransferLimit ? data.minTransferLimit : config[0].minTransferLimit,
                    maxTransferLimit: data.maxTransferLimit ? data.maxTransferLimit : config[0].maxTransferLimit,
                    transferCommonDiff: data.transferCommonDiff ? data.transferCommonDiff : config[0].transferCommonDiff,
                    pendingWithdrawalDuration: data.pendingWithdrawalDuration ? data.pendingWithdrawalDuration : config[0].pendingWithdrawalDuration,

                    // array fields
                    referralContestPrizes: data.referralContestPrizes ? data.referralContestPrizes : config[0].referralContestPrizes,
                    withdrawalFactors: data.withdrawalFactors ? data.withdrawalFactors : config[0].withdrawalFactors,
                    withdrawalCoins: data.withdrawalCoins ? data.withdrawalCoins : config[0].withdrawalCoins,
                    transferFactors: data.transferFactors ? data.transferFactors : config[0].transferFactors,


                    // boolean fileds
                    allowTransfer: data.allowTransfer ? (data.allowTransfer === 'true' ? true : false) : config[0].allowTransfer,
                    allowWithdrawal: data.allowWithdrawal ? (data.allowWithdrawal === 'true' ? true : false) : config[0].allowWithdrawal,
                    allowInvestment: data.allowInvestment ? (data.allowInvestment === 'true' ? true : false) : config[0].allowInvestment,
                    allowReferralContest: data.allowReferralContest ? (data.allowReferralContest === 'true' ? true : false) : config[0].allowReferralContest,
                    startContestReg: data.startContestReg ? (data.startContestReg === 'true' ? true : false) : config[0].startContestReg,
                }
            });

            config = await Config.find();

            return res.status(200).json({ status: true, msg: "successful", data: config[0] })
        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message })
        }
    }
}