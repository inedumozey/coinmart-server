const mongoose = require('mongoose')
const Config = mongoose.model("Config");
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const bcrypt = require('bcrypt')

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window)

// populate factors for withdrawal and transfer
const resolve = (min, max, d) => {
    let factors = []

    for (let i = min; i <= max; i = i + d) {
        factors.push(i)
    }
    return factors
}


module.exports = {

    getConfig: async (req, res) => {
        try {
            // attach default password to admin
            const password = await bcrypt.hash("admin", 10);
            // get all config
            const config = await Config.find();

            // check if document is empty,
            if (config.length < 1) {

                // create the default
                const newConfig = await Config.create({});
                newConfig.adminPassword = password

                // resolve factors
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
                minWithdrawableLimit: Number(DOMPurify.sanitize(req.body.minWithdrawableLimit)),
                maxWithdrawableLimit: Number(DOMPurify.sanitize(req.body.maxWithdrawableLimit)),
                withdrawableCommonDiff: Number(DOMPurify.sanitize(req.body.withdrawableCommonDiff)),
                masterPlanAmountLimit: Number(DOMPurify.sanitize(req.body.masterPlanAmountLimit)),
                minTransferableLimit: Number(DOMPurify.sanitize(req.body.minTransferableLimit)),
                maxTransferableLimit: Number(DOMPurify.sanitize(req.body.maxTransferableLimit)),
                transferableCommonDiff: Number(DOMPurify.sanitize(req.body.transferableCommonDiff)),
                pendingWithdrawalDuration: Number(DOMPurify.sanitize(req.body.pendingWithdrawalDuration)),

                // array fields
                referralContestPrizes: req.body.referralContestPrizes,
                withdrawableFactors: req.body.withdrawalFactors,
                withdrawableCoins: req.body.withdrawalCoins,
                transferableFactors: req.body.transferFactors,

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
                // attach default password to admin
                const password = await bcrypt.hash("admin", 10);
                // create new one
                const newConfig = await Config.create({})
                newConfig.adminPassword = password


                const configs = await newConfig.save()
                return res.status(200).json({ status: true, msg: "successful", data: configs })
            }

            //get the first and only id
            const id = config[0].id;

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
                    minWithdrawableLimit: data.minWithdrawableLimit ? data.minWithdrawableLimit : config[0].minWithdrawableLimit,
                    maxWithdrawableLimit: data.maxWithdrawableLimit ? data.maxWithdrawableLimit : config[0].maxWithdrawableLimit,
                    withdrawableCommonDiff: data.withdrawableCommonDiff ? data.withdrawableCommonDiff : config[0].withdrawableCommonDiff,
                    masterPlanAmountLimit: data.masterPlanAmountLimit ? data.masterPlanAmountLimit : config[0].masterPlanAmountLimit,
                    minTransferableLimit: data.minTransferableLimit ? data.minTransferableLimit : config[0].minTransferableLimit,
                    maxTransferableLimit: data.maxTransferableLimit ? data.maxTransferableLimit : config[0].maxTransferableLimit,
                    transferableCommonDiff: data.transferableCommonDiff ? data.transferableCommonDiff : config[0].transferableCommonDiff,
                    pendingWithdrawalDuration: data.pendingWithdrawalDuration ? data.pendingWithdrawalDuration : config[0].pendingWithdrawalDuration,

                    // array fields

                    // this array comes from the client
                    withdrawableCoins: data.withdrawableCoins ? data.withdrawableCoins : config[0].withdrawableCoins,

                    // this array comes from the client
                    referralContestPrizes: data.referralContestPrizes ? data.referralContestPrizes : config[0].referralContestPrizes,

                    // this array is made from minWithdrawableLimit, maxWithdrawableLimit and withdrawableCommonDiff, hence all must be present for the update otherwise, use config data
                    // When the factor has only 1 value [1], users are granted the chance to withdraw any infinity amount
                    withdrawableFactors: (data.minWithdrawableLimit && data.maxWithdrawableLimit && data.withdrawableCommonDiff) ? resolve(data.minWithdrawableLimit, data.maxWithdrawableLimit, data.withdrawableCommonDiff) : config[0].withdrawableFactors,

                    // this array is made from minTransferableLimit, maxTransferableLimit and transferableCommonDiff, hence all must be present for the update otherwise, use config data
                    // When the factor has only 1 value [1], users are granted the chance to transfer any infinity amount
                    transferableFactors: (data.minTransferableLimit && data.maxTransferableLimit && data.transferableCommonDiff) ? resolve(data.minTransferableLimit, data.maxTransferableLimit, data.transferableCommonDiff) : config[0].transferableFactors,


                    // boolean fileds
                    allowTransfer: data.allowTransfer ? (data.allowTransfer === 'true' ? true : false) : config[0].allowTransfer,
                    allowWithdrawal: data.allowWithdrawal ? (data.allowWithdrawal === 'true' ? true : false) : config[0].allowWithdrawal,
                    allowInvestment: data.allowInvestment ? (data.allowInvestment === 'true' ? true : false) : config[0].allowInvestment,
                    allowReferralContest: data.allowReferralContest ? (data.allowReferralContest === 'true' ? true : false) : config[0].allowReferralContest,
                    startContestReg: data.startContestReg ? (data.startContestReg === 'true' ? true : false) : config[0].startContestReg,

                    // admin password
                    adminPassword: config[0].adminPassword
                }
            });

            config = await Config.find();

            return res.status(200).json({ status: true, msg: "successful", data: config[0] })
        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message })
        }
    },

    changeAdminPassword: async (req, res) => {
        try {
            //hash the password
            const password = await bcrypt.hash(DOMPurify.sanitize(req.body.password), 10);

            const config = await Config.find();

            // check if document is empty,
            if (config.length < 1) {
                // create new one
                const newConfig = await Config.create({})
                newConfig.adminPassword = password;

                const configs = await newConfig.save()
                return res.status(200).json({ status: true, msg: "successful", data: configs })
            }

            //get the first and only id
            const id = config[0].id
            await Config.findOneAndUpdate({ _id: id }, { $set: { password } });

            return res.status(200).json({ status: true, msg: "Admin password changed successfully" });

        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message })
        }
    }
}

