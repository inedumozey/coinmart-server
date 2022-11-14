const mongoose = require('mongoose')
const User = mongoose.model("User");
const Config = mongoose.model("Config");
const ReferralContest = mongoose.model("ReferralContest");
const ReferralHistory = mongoose.model("ReferralHistory");
require("dotenv").config();
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window)

module.exports = {

    getReferralHistories: async (req, res) => {
        try {
            const userId = req.user;

            // get all referralBonus hx
            const data = await ReferralHistory.find({ referrerId: userId }).populate({ path: 'referreeId', select: ['_id', 'email', 'username'] }).sort({ createdAt: -1 });

            return res.status(200).send({ status: true, msg: 'Successful', data })
        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message || "Server error, please contact customer support" })
        }
    },

    getReferralHistoriesById: async (req, res) => {
        try {
            const { id } = req.params;

            // get all the referral histories for this uses id
            const data = await ReferralHistory.find({ referrerId: id }).populate({ path: 'referreeId', select: ['_id', 'email', 'username'] }).sort({ createdAt: -1 });

            return res.status(200).send({ status: true, msg: 'Successful', data })
        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message || "Server error, please contact customer support" })
        }
    },

    addReferral: async (req, res) => {
        try {
            const userId = req.user

            // sanitize all elements from the client, incase of fodgery
            const data = {
                refcode: DOMPurify.sanitize(req.body.refcode),
            }

            // get currency and verifyEmail from config data if exist otherwise set to the one in env
            // get all config
            const config = await Config.find({});
            const currency = config && config[0].currency
            const startContestReg = config && config[0].startContestReg;

            // get the logged user (referree user)
            const loggedUser = await User.findOne({ _id: userId });

            // get the referrer user using the refcode
            const referrerUser = await User.findOne({ referralCode: data.refcode });

            // check to be sure user has not already been refferred by someone
            if (loggedUser.referrerId) {
                // get the user that referred him prior
                const priorReferrerUser = await User.findOne({ _id: loggedUser.referrerId });

                return res.status(400).json({ status: false, msg: `You have already been referred by ${priorReferrerUser.username}` })
            }

            else if (!referrerUser) {
                return res.status(404).json({ status: false, msg: "User not found" })
            }

            else if (loggedUser.referralCode === data.refcode.trim()) {
                return res.status(400).json({ status: false, msg: `Owner's referral code` })
            }

            else {
                // push the loggedUser to the referrerUser's referree list
                await User.findOneAndUpdate({ referralCode: data.refcode }, {
                    $push: {
                        referreeId: userId
                    }
                })

                // add the referrerUser to the referrerId of the loggedUser
                const updatedData = await User.findOneAndUpdate({ _id: userId }, {
                    $set: {
                        referrerId: referrerUser._id,
                        referrerUsername: referrerUser.username,
                    }
                }, { new: true }).populate({ path: 'referrerId', select: ['_id', 'email', 'username'] }).populate({ path: 'referreeId', select: ['_id', 'email', 'username', 'hasInvested'] });

                // create referral history collection
                const referralHistory = new ReferralHistory({
                    referrerId: referrerUser._id,
                    referreeId: userId,
                    referreeUsername: loggedUser.username,
                    rewards: 0,
                    currency
                })
                await referralHistory.save()

                // instantiate Referral Contest collection with the referrer user (he is qualified to be one of the contestant)
                // Only save user to contest if not in before and startContestReg is open
                const contestant = await ReferralContest.findOne({ userId: referrerUser.id })
                if (!contestant && startContestReg) {
                    const newContest = new ReferralContest({
                        userId: referrerUser.id,
                        currency
                    })
                    await newContest.save()
                }

                return res.status(200).json({ status: true, msg: `You have been successfully added to the referree list of ${referrerUser.username}`, data: updatedData })
            }
        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message })
        }
    },

    getAllReferralContest: async (req, res) => {
        try {

            const data = await Contest.find({}).populate({ path: 'userId', select: ['_id', 'email', 'username', 'referreeId'] }).sort({ point: -1, updatedAt: 1 });

            return res.status(200).json({ status: true, msg: "successful", data })
        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message })
        }
    },

    resetContest: async (req, res) => {
        try {
            const config = await Config.find({});

            const allowReferralContest = config && config[0].allowReferralContest

            const referralContestStarts = config && config[0].referralContestStarts

            const referralContestStops = config && config[0].referralContestStops

            const currentTime = Date.now()
            const startsAt = new Date(referralContestStarts).getTime()
            const stopsAt = new Date(referralContestStops).getTime()

            const contestIsOn = currentTime >= startsAt && currentTime <= stopsAt;

            //check if contest is still on, send error
            if (allowReferralContest) {
                return res.status(400).json({ status: false, msg: "Contest is still active, deactivate it before reseting" })
            }

            else if (contestIsOn) {
                return res.status(400).json({ status: false, msg: "Data cannot be reseted when contest is till on going, try again later" })
            }
            else {
                await Contest.updateMany({}, {
                    $set: {
                        point: 0,
                        rewards: 0,
                        paid: false,
                        position: null,
                        resolved: false
                    }
                }, { new: true });

                const data = await Contest.find({}).populate({ path: 'userId', select: ['_id', 'email', 'username', 'referreeId'] }).sort({ point: -1, updatedAt: 1 });
                return res.status(200).json({ status: true, msg: "Reseted Successfully", data })
            }
        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message })
        }
    },

    resolveContest: async (req, res) => {
        try {
            const config = await Config.find({});

            const allowReferralContest = config && config.length >= 1 && config[0].allowReferralContest ? config[0].allowReferralContest : process.env.ALLOW_REFERRAL_CONTEST;

            const referralContestStarts = config && config.length >= 1 && config[0].referralContestStarts

            const referralContestStops = config && config.length >= 1 && config[0].referralContestStops

            const referralContestPrize = config && config.length >= 1 && config[0].referralContestPrize

            const currentTime = Date.now()
            const startsAt = new Date(referralContestStarts).getTime()
            const stopsAt = new Date(referralContestStops).getTime()

            const contestIsOn = currentTime >= startsAt && currentTime <= stopsAt;
            const data = await Contest.find({}).sort({ point: -1, updatedAt: 1 });

            // get the users of the length of referralContestPrize - 1
            const qualifiedUsers = data.slice(0, referralContestPrize.length);

            //check if contest is still on, send error
            if (!allowReferralContest) {
                return res.status(400).json({ status: false, msg: "Contest is not active" })
            }

            else if (contestIsOn) {
                return res.status(400).json({ status: false, msg: "Contest is still on going, try again later" })
            }

            else {
                // otherwise pay users

                //loop through referralContestPrize and get each price together with the users of the length of the referralContestPrize
                for (let i = 0; i < referralContestPrize.length; i++) {
                    if (qualifiedUsers[i] && !qualifiedUsers[i].paid && qualifiedUsers[i].point > 0) {
                        await Contest.findOneAndUpdate({ userId: qualifiedUsers[i].userId }, {
                            $set: {
                                rewards: referralContestPrize[i],
                                paid: true,
                                position: Number(i) + 1
                            }
                        })
                    }
                }

                // find those that were paid (those that were qualified) in the User database and update their account balance
                const contestants = await Contest.find({ paid: true });

                for (let contestant of contestants) {
                    if (!contestant.resolved) {
                        await User.findOneAndUpdate({ _id: contestant.userId }, {
                            $inc: {
                                amount: contestant.rewards
                            }
                        });

                        await Contest.findOneAndUpdate({ _id: contestant.id }, {
                            $set: {
                                resolved: true
                            }
                        })
                    }
                }

                // send the updated contest data to the frontend
                const data = await Contest.find({}).populate({ path: 'userId', select: ['_id', 'email', 'username', 'referreeId'] }).sort({ point: -1, updatedAt: 1 });
                return res.status(200).json({ status: true, msg: "Rewarded Successfully", data })
            }

        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message })
        }
    },

    removeUserFromContest: async (req, res) => {
        try {
            const { id } = req.params;

            // remove the collection with this id

            await Contest.findOneAndDelete({ _id: id });

            const data = await Contest.find({}).populate({ path: 'userId', select: ['_id', 'email', 'username', 'referree'] }).sort({ point: -1, updatedAt: 1 });

            return res.status(200).json({ status: true, msg: "Removed Successfully", data })
        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message })
        }
    },
}
