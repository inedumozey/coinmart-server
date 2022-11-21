const mongoose = require('mongoose')
const InvestmentPlan = mongoose.model("InvestmentPlan");
const Investment = mongoose.model("Investment");
const ReferralHistory = mongoose.model("ReferralHistory");
const ReferralContest = mongoose.model("ReferralContest");
const User = mongoose.model("User");
const Config = mongoose.model("Config");
require("dotenv").config();
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window)

module.exports = {

    getAllPlans: async (req, res) => {
        try {
            const data = await InvestmentPlan.find({}).sort({ amount: 1 });
            return res.status(200).json({ status: true, msg: "Plans fetched successfully", data })
        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message || "Server error, please contact customer support" })
        }
    },

    getPlan: async (req, res) => {
        try {
            const { id } = req.params;

            // check id if exist
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ status: false, msg: "Not found" })
            }

            // check if the Plan exist
            const data = await InvestmentPlan.findOne({ _id: id })
            if (!data) {
                return res.status(400).json({ status: false, msg: "Not found" })
            }

            return res.status(200).json({ status: false, msg: "Plan fetched successfully", data })

        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message || "Server error, please contact customer service" })
        }
    },

    setPlan: async (req, res) => {
        try {
            const data = {
                type: DOMPurify.sanitize(req.body.type),
                minAmount: Number(DOMPurify.sanitize(req.body.minAmount)),
                maxAmount: Number(DOMPurify.sanitize(req.body.maxAmount)),
                lifespan: Number(DOMPurify.sanitize(req.body.lifespan)),
                point: Number(DOMPurify.sanitize(req.body.point)),
                returnPercentage: Number(DOMPurify.sanitize(req.body.returnPercentage)),
            }

            // get all config.
            const config = await Config.find({});

            const currency = config && config[0].currency

            // validate form input
            if (!req.body.type || !req.body.maxAmount || !req.body.minAmount || !req.body.lifespan || !req.body.point || !req.body.returnPercentage) {
                return res.status(400).json({ status: false, msg: "All fields are required" });
            }

            if (data.maxAmount < 0 || data.minAmount < 0 || data.lifespan < 0 || data.point < 0 || data.returnPercentage < 0) {
                return res.status(400).json({ status: false, msg: "Negative value found!" });
            }

            // minAmount cannot be more than maxAmount except when the maxAmount = 0
            if (data.maxAmount > 0 && data.minAmount > data.maxAmount) {
                return res.status(400).json({ status: false, msg: "Minimun amount cannot be more than Maximun amount" });
            }

            // check to makesure plan type is not already in existance
            const investmentPlans = await InvestmentPlan.findOne({ type: data.type.toLowerCase() });

            if (investmentPlans) {
                return res.status(400).json({ status: false, msg: "Plan already exist" })
            }
            // save the data to the database
            const newInvestmentPlan = new InvestmentPlan({
                type: data.type.toLowerCase(),
                minAmount: data.minAmount.toFixed(8),
                maxAmount: data.maxAmount.toFixed(8),
                lifespan: data.lifespan,
                point: data.point,
                returnPercentage: data.returnPercentage,
                currency,
            })

            await newInvestmentPlan.save();

            return res.status(200).json({ status: true, msg: "successful" })

        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message })
        }
    },

    updatePlan: async (req, res) => {
        try {
            const { id } = req.params;
            const data = {
                type: DOMPurify.sanitize(req.body.type),
                minAmount: Number(DOMPurify.sanitize(req.body.minAmount)),
                maxAmount: Number(DOMPurify.sanitize(req.body.maxAmount)),
                lifespan: Number(DOMPurify.sanitize(req.body.lifespan)),
                point: Number(DOMPurify.sanitize(req.body.point)),
                returnPercentage: Number(DOMPurify.sanitize(req.body.returnPercentage)),
            }

            // get all config.
            const config = await Config.find({});

            const currency = config && config[0].currency

            // validate form input
            if (!req.body.type || !req.body.maxAmount || !req.body.minAmount || !req.body.lifespan || !req.body.point || !req.body.returnPercentage) {
                return res.status(400).json({ status: false, msg: "All fields are required" });
            }

            if (data.maxAmount < 0 || data.minAmount < 0 || data.lifespan < 0 || data.point < 0 || data.returnPercentage < 0) {
                return res.status(400).json({ status: false, msg: "Negative value found!" });
            }

            // minAmount cannot be more than maxAmount except when the maxAmount = 0
            if (data.maxAmount > 0 && data.minAmount > data.maxAmount) {
                return res.status(400).json({ status: false, msg: "Minimun amount cannot be more than Maximun amount" });
            }

            // chekc if the id does not exist
            const data_ = await InvestmentPlan.findOne({ _id: id })
            if (!data_) {
                return res.status(400).json({ status: false, msg: "Plan not found!" })
            }

            // check to makesure plan types is not already in existance when not thesame as the original plan
            const updatingPlan = await InvestmentPlan.findOne({ _id: id });

            if (updatingPlan.type.toLowerCase() !== data.type.toLowerCase()) {
                const oldDiffPlan = await InvestmentPlan.findOne({ type: data.type.toLowerCase() })

                if (oldDiffPlan) {
                    return res.status(400).json({ status: false, msg: "Plan already exist" })
                }
            }

            // update the data in the database
            const planData = {
                type: data.type.toLowerCase(),
                minAmount: data.minAmount.toFixed(8),
                maxAmount: data.maxAmount.toFixed(8),
                lifespan: data.lifespan,
                point: data.point,
                returnPercentage: data.returnPercentage,
                currency,
            }
            await InvestmentPlan.findByIdAndUpdate({ _id: id }, { $set: planData });

            return res.status(200).json({ status: true, msg: "plan updated" })
        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message || "Server error, please contact customer support" })
        }
    },

    deletePlan: async (req, res) => {
        try {
            const { id } = req.params;

            await InvestmentPlan.findByIdAndDelete({ _id: id });

            return res.status(200).json({ status: true, msg: "Plan deleted" })

        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message || "Server error, please contact customer support" })
        }
    },

    deleteAllPlans: async (req, res) => {
        try {

            await InvestmentPlan.deleteMany({});

            return res.status(200).json({ status: true, msg: "All plans deleted" })
        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message || "Server error, please contact customer support" })
        }
    },

    // investment
    invest: async (req, res) => {
        try {
            const { id } = req.params // planId past in params
            const userId = req.user;

            // get all config.
            const config = await Config.find({});
            const currency = config && config[0].currency
            const referralBonusPercentage = config && config[0].referralBonusPercentage
            const investmentLimits = config && config[0].investmentLimits
            const allowInvestment = config && config[0].allowInvestment;
            const allowReferralContest = config && config[0].allowReferralContest
            const referralContestStarts = config && config[0].referralContestStarts;
            const referralContestStops = config && config[0].referralContestStops

            if (!allowInvestment) {
                return res.status(400).json({ status: false, msg: "Not available at the moment, check back shortly" })
            }

            const data = {
                amount: Number(DOMPurify.sanitize(req.body.amount)),
            }

            // get the user from user database
            const user = await User.findOne({ _id: userId })

            // check if the plan exist
            const plan = await InvestmentPlan.findOne({ _id: id })

            if (!plan) {
                return res.status(400).json({ status: false, msg: "Plan not found" })
            }

            // check if amount is more or less than the plan amount
            if (data.amount < plan.minAmount) {
                return res.status(400).json({ status: false, msg: "Invalid amount" })
            }

            // all plans with maximun of 0 is regarded as unlimited plan 
            if (plan.maxAmount > 0 && data.amount > plan.maxAmount) {
                return res.status(400).json({ status: false, msg: "Invalid amount" })
            }

            // get all plans the user has
            const userPlans = await Investment.find({ userId }); // array

            let count = 0;
            let samePlan = 0;

            // loop through all the investment the logged user has
            for (let userPlan of userPlans) {

                // increament the count base on how many active investment he has running
                if (userPlan.isActive) {
                    ++count
                }

                // check for active investment plans, if same with the plan he is requesting for currently, increament samePlan
                if (userPlan.isActive && userPlan.type === plan.type) {
                    ++samePlan
                }
            }

            // referral contest
            const currentTime = Date.now()
            const startsAt = new Date(referralContestStarts).getTime()
            const stopsAt = new Date(referralContestStops).getTime()

            const allowContest = currentTime >= startsAt && currentTime <= stopsAt && allowReferralContest

            // if count is more than, refuse him of further investment
            if (count >= investmentLimits) {
                return res.status(400).json({ status: false, msg: `You cannot have more than ${investmentLimits} active investments` })
            }
            else {

                // no user should have same active plan for more than once
                if (samePlan >= 1) {
                    return res.status(400).json({ status: false, msg: "You have this plan running already" })
                }

                else {

                    // check to makesure he does not invest more than his total account balance
                    if (data.amount > user.amount) {
                        return res.status(400).json({ status: false, msg: "Insufficient balance" })
                    }

                    // save the data
                    // get the investment returnPercentage
                    const returnPercentage = Number(plan.returnPercentage)

                    // calculate the reward
                    const rewards = ((returnPercentage / 100) * data.amount) + data.amount;

                    const newData = {
                        type: plan.type,
                        lifespan: plan.lifespan,
                        returnPercentage,
                        rewards,
                        userId,
                        amount: data.amount.toFixed(8),
                        currency,
                    }

                    const newInvestment = new Investment(newData);
                    await newInvestment.save();


                    // Update the user database by removing this investment plan amount from their total account balance
                    await User.findByIdAndUpdate({ _id: userId }, {
                        $set: {
                            amount: (user.amount - data.amount).toFixed(8),
                        }
                    });

                    // Check ths user collection in User adatabse to see if this is his/her first investment (hasInvested: false). This will make sure referral bonus is returned to referrer only once (first investment) for those that are someone else's referree
                    if (!user.hasInvested) {

                        // check if user was referred by another user, then return their referral bonus to this referrer using their first investment (this is only for the first investment)
                        if (user.referrerId) {

                            // get the referrerUser
                            const referrerUser = await User.findOne({ _id: user.referrerId })

                            // calculate the referalBonus
                            const referralBonus = referralBonusPercentage / 100 * data.amount;

                            // update the referrer account balance with this referralBonus
                            await User.findByIdAndUpdate({ _id: user.referrerId }, {
                                $set: { amount: (referrerUser.amount + referralBonus).toFixed(8) }
                            })

                            // save new collection in the referral History database
                            const newReferralHistory = new ReferralHistory({
                                referrerId: user.referrerId,
                                referreeId: userId,
                                referreeUsername: userId.username,
                                rewards: referralBonus.toFixed(8),
                                currency
                            })

                            await newReferralHistory.save()

                            // update the referral ReferralContest collection if allowContest is true
                            if (allowContest) {
                                await ReferralContest.findOneAndUpdate({ userId: user.referrerId }, {
                                    $inc: {
                                        point: plan.point,
                                    }
                                }, {
                                    $set: {
                                        currency
                                    }
                                })
                            }
                        }


                        // update referree user and change hasInvested to true
                        await User.findByIdAndUpdate({ _id: userId }, {
                            $set: { hasInvested: true }
                        })
                    }

                    const investmentData = await Investment.findOne({ _id: newInvestment.id });

                    return res.status(200).json({ status: true, msg: `You have started investing for ${plan.type}` })
                }
            }
        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message })
        }
    },

    resolve: async (req, res) => {
        try {

            // // get all investments
            // const investments = await Investment.find({});

            // // check if there are investment
            // let maturedInvestments = []
            // let activeInvestment = []
            // if(!investments){
            //     return res.status(200).json({ status: true, msg: "No any investment made"})
            // }


            // // loop through investments
            // for(let investment of investments){
            //     const currentTime = new Date().getTime() / 1000 // seconds

            //     const createTime = new Date(investment.createdAt).getTime() / 1000 // seconds

            //     const investmentLifespan = Number(investment.lifespan)

            //     // check for all active investment that have matured
            //     if( currentTime - createTime >= investmentLifespan && investment.isActive){
            //         maturedInvestments.push(investment)

            //     }
            //     else{
            //         activeInvestment.push(investment)
            //     }
            // }

            // // fetch the users with these maturedInvestments and update their account balance
            // if(maturedInvestments.length > 0){
            //     for(let maturedInvestment of maturedInvestments){

            //         // get the users with these investments
            //         const userId = maturedInvestment.userId.toString();
            //         const users = await User.findOne({_id: userId})

            //         if(users.active == 1 || users.active ==2){
            //             // update the users account with the amount he invested with and the rewards
            //             await User.updateMany({_id: userId}, {$set: {
            //                 active: users.active - 1,
            //                 amount: (users.amount + maturedInvestment.rewards).toFixed(8)
            //             }}, {new: true})

            //             // update the investment database, 
            //             await Investment.updateMany({_id: maturedInvestment.id}, {$set: {
            //                 rewarded: true,
            //                 isActive: false,
            //                 currentBalance: (users.amount + maturedInvestment.rewards).toFixed(8)
            //             }}, {new: true})
            //         }

            //     }

            //     return res.status(200).json({ status: true, msg: "successful"})  

            // }else{
            //     return res.status(200).json({ status: true, msg: "successful"})  
            // }

            return res.status(200).json({ status: true, msg: "successful" });

        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message })
        }
    },

    resolve_In: async (req, res) => {
        try {

            // get all investments
            const investments = await Investment.find({});

            // check if there are investment
            let maturedInvestments = []
            let activeInvestment = []
            if (!investments) {
                return res.status(200).json({ status: true, msg: "No any investment made" })
            }


            // loop through investments
            for (let investment of investments) {
                const currentTime = new Date().getTime() / 1000 // seconds

                const createTime = new Date(investment.createdAt).getTime() / 1000 // seconds

                const investmentLifespan = Number(investment.lifespan)

                // check for all active investment that have matured
                if (currentTime - createTime >= investmentLifespan && investment.isActive) {
                    maturedInvestments.push(investment)

                }
                else {
                    activeInvestment.push(investment)
                }
            }

            // fetch the users with these maturedInvestments and update their account balance
            if (maturedInvestments.length > 0) {
                for (let maturedInvestment of maturedInvestments) {

                    // get the users with these investments
                    const userId = maturedInvestment.userId.toString();
                    const users = await User.findOne({ _id: userId })

                    await User.updateMany({ _id: userId }, {
                        $set: {
                            amount: users && (users.amount + maturedInvestment.rewards).toFixed(8)
                        }
                    }, { new: true })

                    // update the investment database, 
                    await Investment.updateMany({ _id: maturedInvestment.id }, {
                        $set: {
                            rewarded: true,
                            isActive: false,
                            currentBalance: users && (users.amount + maturedInvestment.rewards).toFixed(8)
                        }
                    }, { new: true })

                    if (users && (users.active == 1 || users.active == 2)) {
                        // update the users account with the amount he invested with and the rewards
                        await User.updateMany({ _id: userId }, {
                            $set: {
                                active: users && users.active - 1,
                            }
                        }, { new: true })
                    }

                }

                return res.status(200).json({ status: true, msg: "successful" })

            }
            else {
                return res.status(200).json({ status: true, msg: "successful" })
            }

        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message })
        }
    },

    resolveManually: async (req, res) => {
        try {
            const { id } = req.params;
            // update the investment database, 
            const investment = await Investment.findOne({ _id: id });
            // update the user
            const user = await User.findOne({ _id: investment.userId })

            if (investment.isActive) {
                await Investment.findOneAndUpdate({ _id: id }, {
                    $set: {
                        rewarded: true,
                        isActive: false,
                        // currentBalance: (user.amount + investment.rewards).toFixed(8)
                    }
                }, { new: true })

                await User.findOneAndUpdate({ _id: investment.userId }, {
                    $set: {
                        amount: (user.amount + investment.rewards).toFixed(8)
                    }
                }, { new: true })

                if (user.active == 1 || user.active == 2) {
                    // update the users account with the amount he invested with and the rewards
                    await User.findOneAndUpdate({ _id: investment.userId }, {
                        $set: {
                            active: user.active - 1,
                        }
                    }, { new: true })
                }
                const investments = await Investment.find({}).populate({ path: 'userId', select: ['_id', 'email', 'amount', 'username'] }).sort({ createdAt: -1 });
                return res.status(200).json({ status: true, msg: "successful", data: investments })
            }
            else {
                const investments = await Investment.find({}).populate({ path: 'userId', select: ['_id', 'email', 'amount', 'username'] }).sort({ createdAt: -1 });
                return res.status(200).json({ status: true, msg: "successful", data: investments })
            }
        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message })
        }
    },

    getAllInvestments: async (req, res) => {
        try {

            const userId = req.user;

            // get all investment hx of the logged in user
            const txns = await Investment.find({});

            let ids = []
            for (let txn of txns) {
                if (txn.userId.toString() === userId.toString()) {
                    ids.push(txn.id)
                }
            }

            const data = await Investment.find({ _id: ids }).populate({ path: 'userId', select: ['_id', 'email', 'amount', 'username'] }).sort({ updatedAt: -1 });

            return res.status(200).send({ status: true, msg: 'Successful', data })
        }
        catch (err) {
            return res.status(500).json({ status: false, msg: "Server error, please contact customer support" })
        }
    },

    getAllInvestments_admin: async (req, res) => {
        try {

            const userId = req.user;

            // get the loggeduser to check if he is the admin
            const loggeduser = await User.findOne({ _id: userId })

            if (loggeduser.isAdmin) {
                const data = await Investment.find({}).populate({ path: 'userId', select: ['_id', 'email', 'amount', 'username'] }).sort({ createdAt: -1 });

                return res.status(200).send({ status: true, msg: 'Successful', data })
            }
            return res.status(400).send({ status: false, msg: 'Access denied' })

        }
        catch (err) {
            return res.status(500).json({ status: false, msg: "Server error, please contact customer support" })
        }
    },

    getInvestment: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user;

            // check item if exist
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ status: false, msg: "Plan not found" })
            }

            // get the txn
            const txn = await Investment.findOne({ _id: id }).populate({ path: 'planId' });

            if (!txn) {
                return res.status(400).json({ status: false, msg: "Investment not found found" })

            }
            else {

                // check if the loggeduser was the one that owns the investment hx or the admin
                if (txn.userId.toString() === userId.toString() || loggeduser.isAdmin) {
                    const txnData = await Investment.findOne({ _id: id }).populate({ path: 'planId' }).populate({ path: 'userId', select: ['_id', 'email', 'username', 'isAdmin'] });
                    return res.status(200).send({ status: true, msg: 'Success', data: txnData })
                }
                else {
                    return res.status(400).send({ status: false, msg: 'Access denied!' })
                }
            }
        }
        catch (err) {
            return res.status(500).json({ status: false, msg: "Server error, please contact customer support" })
        }
    },
}