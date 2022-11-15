const mongoose = require('mongoose')
require('dotenv').config();
const Config = mongoose.model("Config");
const ReferralContest = mongoose.model("ReferralContest");
const Profile = mongoose.model("Profile")
const ReferralHistory = mongoose.model('ReferralHistory');
const User = mongoose.model("User");
const mailgunSetup = require('../../config/mailgun');
const text = require('./text')

module.exports = async (user, res, refcode, type, data) => {

    // get config data if exist otherwise set the env
    const config = await Config.find({});
    const startContestReg = config && config[0].startContestReg;
    const currency = config && config[0].currency;

    const configData = {
        name: process.env.NAME,
        bio: process.env.BIO,
        bg: process.env.BRAND_COLOR,
    }

    const URL = `${process.env.FRONTEND_BASE_URL}/${process.env.VERIFY_EMAIL_URL}/${user.verifyEmailToken}`

    if (process.env.ENV !== 'development') {

        const email_data = {
            from: `${configData.name} <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Verify Your Email',
            html: text.linkText(configData.name, configData.bio, configData.bg, URL, user, 'verify-email', "Click to Activate your Account")
        }

        mailgunSetup.messages().send(email_data, async (err, resp) => {
            if (err) {
                if (err.message.includes("ENOTFOUND") || err.message.includes("EREFUSED") || err.message.includes("EHOSTUNREACH")) {
                    return res.status(408).json({ status: false, msg: "No network connectivity" })
                }
                else if (err.message.includes("ETIMEDOUT")) {
                    return res.status(408).json({ status: false, msg: "Request Time-out! Check your network connections" })
                }
                else {
                    return res.status(500).json({ status: false, msg: err.message })
                }
            }
            else {

                if (type !== 'resen-link') {

                    // create user profile collection
                    const profile = await Profile.create({
                        phone: data.phone,
                        country: data.country,
                        address: data.address
                    })
                    // save user
                    user.profile = profile._id;
                    await user.save();

                    // add referral user
                    if (refcode) {
                        const referringUser = await User.findOne({ referralCode: refcode })
                        if (referringUser) {

                            // add user as referree to the referring user
                            await User.findByIdAndUpdate({ _id: referringUser._id }, {
                                $push: {
                                    referree: newUser._id
                                }
                            })

                            // add the referring user as referrer to this current user
                            await User.findByIdAndUpdate({ _id: newUser.id }, {
                                $set: {
                                    referrerId: referringUser.id,
                                    referrerUsername: referringUser.username,

                                }
                            })

                            // instantiate Contest Database with the referrer user
                            // Only save user to contest if not in before
                            const contest = await ReferralContest.findOne({ userId: referringUser.id })
                            if (!contest && startContestReg) {
                                const newContest = new ReferralContest({
                                    userId: referringUser.id,
                                })

                                await newContest.save()
                            }

                            // create referral history collection
                            const newReferralHx = new ReferralHistory({
                                referreeId: newUser._id,
                                referreeUsername: newUser.username,
                                referrerId: referringUser.id,
                                currency
                            });

                            await newReferralHx.save()
                        }
                    }

                    return res.status(200).json({
                        status: true,
                        msg: `Registration successful, check your email ${(user.email)} to verify your account`,
                        token: ''
                    })
                }
                else {
                    return res.status(200).json({
                        status: true,
                        msg: `Link sent successfully, check your email ${(user.email)} to verify your account`,
                        token: ''
                    })
                }
            }
        })

    } else {

        if (type !== 'resen-link') {
            // create user profile collection
            const profile = await Profile.create({
                phone: data.phone,
                country: data.country,
                address: data.address
            })
            // save user
            user.profile = profile._id;
            const newUser = await user.save();

            // referral
            if (refcode) {
                const referringUser = await User.findOne({ referralCode: refcode })

                if (referringUser) {

                    // add user as referree to the referring user
                    await User.findByIdAndUpdate({ _id: referringUser._id }, {
                        $push: {
                            referreeId: newUser._id,
                        }
                    })

                    // add the referring user as referrer to this current user
                    await User.findByIdAndUpdate({ _id: newUser.id }, {
                        $set: {
                            referrerId: referringUser.id,
                            referrerUsername: referringUser.username,
                        }
                    })

                    // instantiate Contest Database with the referrer user
                    // Only save user to contest if not in before
                    const contest = await ReferralContest.findOne({ userId: referringUser.id })
                    if (!contest && startContestReg) {
                        const newContest = new ReferralContest({
                            userId: referringUser.id,
                        })

                        await newContest.save()
                    }

                    // create referral history collection
                    const newReferralHx = new ReferralHistory({
                        referreeId: newUser._id,
                        referreeUsername: newUser.username,
                        referrerId: referringUser.id,
                        currency
                    });

                    await newReferralHx.save()
                }
            }

            return res.status(200).json({ status: true, msg: "On development mode! Please check below to verify your account", token: user.verifyEmailToken })
        }

        else {
            return res.status(200).json({
                status: true,
                msg: `Link sent successfully on development mode, Please check below to verify your account`,
                token: user.verifyEmailToken,

            })
        }

    }
}