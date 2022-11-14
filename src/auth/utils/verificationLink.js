const mongoose = require('mongoose')
require('dotenv').config();
const Config = mongoose.model("Config");
const ReferralContest = mongoose.model("ReferralContest");
const Profile = mongoose.model("Profile")
const ReferralHistory = mongoose.model('ReferralHistory');
const User = mongoose.model("User");
const mailgunSetup = require('../../config/mailgun');

const createdYear = new Date().getFullYear();
const copyrightYear = createdYear > 2022 ? `2022 - ${new Date().getFullYear()}` : '2022'

module.exports = async (user, res, refcode, type, data) => {

    // get config data if exist otherwise set the env
    const config = await Config.find({});
    const startContestReg = config && config[0].startContestReg;
    const currency = config && config[0].currency;

    const configData = {
        name: config[0].appName,
        bio: process.env.BIO,
        brandColorA: process.env.BRAND_COLOR,
    }

    const URL = `${process.env.FRONTEND_BASE_URL}${process.env.VERIFY_EMAIL_URL}/?token=${user.verifyEmailToken}`

    if (process.env.ENV !== 'development') {
        //send email
        const text = `
            <div style="border: 2px solid #aaa; box-sizing: border-box; margin: 0; background: #fff; height: 70vh; padding: 10px">

                <div style="text-align:center; height: 70px; background: ${configData.brandColorA}">
                    <h2 style="font-weight: bold; font-size: 1.5rem; color: #fff; padding:3px 3px 0 3px; margin:0">
                        ${configData.name}
                    </h2>
                    <small style="color: #aaa; width: 100%; font-size: 0.8rem; font-style: italic; font-weight: 600;">
                        ${configData.bio}
                    </small>
                </div>

                <div style="height: calc(100% - 70px - 40px - 20px - 10px - 10px); width:100%">
                    <div style="font-size: 1rem; text-align: center; color:#000; padding: 50px 10px 20px 10px">
                        Thanks <span style="font-weight: bold">${user.username}</span> for registering with ${configData.name}
                    </div>
                    <div>
                        <a style="display:inline-block; background: ${configData.brandColorA}; text-align:center; padding: 15px; color: #fff; font-weight: 600" href="${URL}">Click to Verify Your Account</a>
                    </div>
                    <div style="text-align: center; margin: 5px 0; padding:10px">${URL}</div>
                </div>

                <div style="text-align:center; height: 40px; padding: 10px; background: #000">
                    <div style="color: #fff; padding: 0; margin:0">
                        &copy; ${copyrightYear} ${configData.name}
                    <div>
                </div>

            </div>
        `

        const email_data = {
            from: `${configData.name} <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Verify Your Email',
            html: text
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