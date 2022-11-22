const mongoose = require('mongoose')
const User = mongoose.model("User");
const Config = mongoose.model("Config");
const Profile = mongoose.model("Profile")
const ReferralContest = mongoose.model("ReferralContest");
const ReferralHistory = mongoose.model('ReferralHistory');
const Investment = mongoose.model('Investment');
const PasswordReset = mongoose.model('PasswordReset');
require("dotenv").config();

const bcrypt = require("bcrypt");
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const jwt = require("jsonwebtoken");

const verificationLink = require('../utils/verificationLink');
const passResetLink = require('../utils/passResetLink');
const ran = require('../utils/randomString')
const { generateAccesstoken, generateRefreshtoken, generateAdminToken } = require('../utils/generateTokens')

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window)

module.exports = {

    getUsers: async (req, res) => {
        try {
            const data = await User.find({})
                .populate({ path: 'referrerId', select: ['_id', 'email', 'username'] })
                .populate({ path: 'referreeId', select: ['_id', 'email', 'username', 'hasInvested'] })
                .populate({ path: 'profile' })
                .select("-password");

            return res.status(200).json({ status: true, msg: "successfull", data })
        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message || "Server error, please contact customer support" })
        }
    },

    getUser: async (req, res) => {
        try {
            const { id } = req.params;

            //find user by id, or email or username
            const data = await User.findOne({ $or: [{ _id: id }, { username: id }] })
                .populate({ path: 'referrerId', select: ['_id', 'email', 'username'] })
                .populate({ path: 'referreeId', select: ['_id', 'email', 'username', 'hasInvested'] })
                .populate({ path: 'profile' })
                .select("-password");

            if (!data) res.status(404).json({ status: false, msg: `User not found!` });

            // send the user      
            return res.status(200).json({ status: true, msg: 'successfull', data });
        }

        catch (err) {
            res.status(500).send({ status: false, msg: "Server error, please contact customer support" })
        }
    },

    getProfile: async (req, res) => {
        try {
            const userId = req.user;

            //find user by id sent from the client
            const data = await User.findOne({ _id: userId })
                .populate({ path: 'referrerId', select: ['_id', 'email', 'username'] })
                .populate({ path: 'referreeId', select: ['_id', 'email', 'username', 'hasInvested'] })
                .populate({ path: 'profile' })
                .select("-password");

            if (!data) res.status(404).json({ status: false, msg: `User not found!` });

            // send the user      
            return res.status(200).json({ status: true, msg: 'Profile Fetched Successfully', data });
        }

        catch (err) {
            res.status(500).send({ status: false, msg: "Server error, please contact customer support" })
        }
    },

    signup: async (req, res) => {
        try {

            // sanitize all elements from the client, incase of fodgery
            const refcode = DOMPurify.sanitize(req.query.refcode);

            const data = {
                password: DOMPurify.sanitize(req.body.password),
                cpassword: DOMPurify.sanitize(req.body.cpassword),
                username: DOMPurify.sanitize(req.body.username),
                email: DOMPurify.sanitize(req.body.email),
                country: DOMPurify.sanitize(req.body.country),
                phone: DOMPurify.sanitize(req.body.phone),
                address: DOMPurify.sanitize(req.body.address),
            }

            const { email, username, password, cpassword, country, phone, address } = data;
            const addressLength = 250;

            function checkEmail(email) {

                var filter = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

                return filter.test(email) ? true : false
            }

            if (!email || !password || !username || !country || !phone || !address) {
                return res.status(400).json({ status: false, msg: "All fields are required!" });
            }

            else if (address.length > addressLength) {
                return res.status(400).json({ status: false, msg: `Address too long! must not be more than ${addressLength} characters` });
            }

            else if (username.length < 4) {
                return res.status(405).json({ status: false, msg: "Username too short, must not be less than 4 characters" });
            }

            else if (password.length < 6) {
                return res.status(405).json({ status: false, msg: "Password too short, must not be less than 6 characters" });
            }

            else if (password !== cpassword) {
                return res.status(405).json({ status: false, msg: "Passwords do not match!" });

            }

            else if (!checkEmail(email)) {
                return res.status(405).json({ status: false, msg: "Email is invalid!" });
            }

            //check for already existing email and username
            const oldUser = await User.findOne({ email });
            const oldUsername = await User.findOne({ username });

            if (oldUser) {
                return res.status(409).json({ status: false, msg: "Email already exist!" });
            }

            if (oldUsername) {
                return res.status(409).json({ status: false, msg: "Username already taken!" });
            }

            //hash the password
            const hashedPass = await bcrypt.hash(password, 10);

            // get currency and verifyEmail from config data if exist otherwise set to the one in env
            // get all config
            const config = await Config.find({});

            const currency = config && config[0].currency

            //save data to database
            const user = new User({
                email,
                username,
                verifyEmailToken: ran.token(),
                accountNumber: ran.acc(),
                referralCode: ran.referralCode(),
                password: hashedPass,
                currency,
            })

            //send account activation link to the user
            verificationLink(user, res, refcode, '', data);
        }
        catch (err) {
            console.log({ err })
            console.log(err.message)
            return res.status(500).json({ status: false, msg: err.message });
        }
    },

    resendVerificationLink: async (req, res) => {
        try {
            const email = req.body.email;

            if (!email) {
                return res.status(402).json({ status: false, msg: "User not found" })
            }

            // fetch user
            const user = await User.findOne({ $or: [{ email }, { username: email }] })

            if (!user) {
                return res.status(402).json({ status: false, msg: "User not found" })
            }

            if (user.isVerified) {
                return res.status(402).json({ status: false, msg: "Your account has already been verified" })
            }

            // send verification link
            verificationLink(user, res, "", 'resen-link', '')
        }
        catch (err) {
            return res.status(505).json({ status: false, msg: err.message || "Internal Server error, please contact customer service" });
        }
    },

    verifyAccount: async (req, res) => {
        try {
            const { token } = req.query

            if (!token) {
                return res.status(400).json({ status: false, msg: "Token is missing!" })
            } else {
                //search token in the database

                const user = await User.findOne({ verifyEmailToken: token });

                if (!user) {
                    return res.status(400).json({ status: false, msg: "Invalid token" })
                }

                else if (user.isVerified) {
                    return res.status(400).json({ status: false, msg: "Your account has already been verified" })
                }

                else {
                    user.isVerified = true;
                    user.verifyEmailToken = null;
                    setTimeout(async () => await user.save(), 1000);

                    // log the user in
                    const accesstoken = generateAccesstoken(user._id);
                    const refreshtoken = generateRefreshtoken(user._id);

                    return res.status(200).json({
                        status: true,
                        msg: "Your account is now activated.",
                        accesstoken,
                        refreshtoken,
                        data: user
                    })
                }
            }
        }
        catch (err) {
            console.log(err)
            res.status(500).json({ status: false, message: err.message || "Internal Server error, please contact customer support" })
        }
    },

    signin: async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ status: false, msg: "All fields are required!" });

            }
            else {
                // find user with username or email
                const user = await User.findOne({ $or: [{ email }, { username: email }] });

                if (!user) {
                    return res.status(400).json({ status: false, msg: "User not found" });
                }

                // match provided password with the one in database
                const match = await bcrypt.compare(password.toString(), user.password)

                if (!match) {
                    return res.status(400).json({ status: false, msg: "Invalid login credentials" });
                }

                if (!user.isVerified) {
                    return res.status(400).json({ status: false, msg: "Please verify your account to login in" });
                }

                // log the user in
                const accesstoken = generateAccesstoken(user._id);
                const refreshtoken = generateRefreshtoken(user._id);

                return res.status(200).json({
                    status: true,
                    msg: "Your are logged in",
                    accesstoken,
                    refreshtoken,
                    data: user
                })
            }
        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message });
        }
    },

    generateAccesstoken: async (req, res) => {
        try {
            //refresh token passed in req.body from client is used to refresh access token which will then be saved in client token
            const authToken = req.headers["authorization"];

            if (!authToken) {
                return res.status(400).json({ status: false, message: "You are not authorize, please login or register" })
            }

            // Verify token
            const token = authToken.split(" ")[1]

            if (!token) {
                return res.status(400).json({ status: false, msg: "User not authenticated! Please login or register" });
            }

            //validate token
            const data = await jwt.verify(token, process.env.JWT_REFRESH_SECRET);

            if (!data) {
                return res.status(400).json({ status: false, msg: "Invalid token! Please login or register" });
            }

            // find the user
            const user = await User.findOne({ _id: data.id });

            if (!user) {
                return res.status(404).json({ status: false, msg: "User not found" })
            }

            // generate new accesstoken and refreshtoken and send to the client cookie
            const accesstoken = generateAccesstoken(user._id);
            const refreshtoken = generateRefreshtoken(user._id);

            return res.status(200).json({
                status: true,
                msg: "Access token refreshed",
                accesstoken,
                refreshtoken,
                data: user
            })
        }
        catch (err) {
            if (err.message == 'invalid signature' || err.message == 'invalid token' || err.message === 'jwt malformed' || err.message === "jwt expired") {
                return res.status(402).json({ status: false, msg: "You are not authorized! Please login or register" })
            }
            return res.status(500).json({ status: false, msg: err.message });
        }
    },

    resetPassword: async (req, res) => {
        try {

            const userId = req.user;

            const data = {
                oldPassword: DOMPurify.sanitize(req.body.oldPassword),
                newPassword: DOMPurify.sanitize(req.body.newPassword),
                newCpassword: DOMPurify.sanitize(req.body.newCpassword)
            }

            if (!data.newPassword || !data.newCpassword || !data.oldPassword) {
                return res.status(400).json({ status: false, msg: "All fields are required" });
            }

            //use the id to find the user
            const user = await User.findOne({ _id: userId })

            if (!user) {
                return res.status(400).json({ status: false, msg: "User not found" });
            }

            else if (data.newPassword.length < 6) {
                return res.status(405).json({ status: false, msg: "Password too short, must not be less than 6 characters" });
            }

            if (data.newPassword != data.newCpassword) {
                return res.status(405).json({ status: false, msg: "Passwords do not match!" });
            }

            // match provided oldPassword with the one in database
            const match = await bcrypt.compare(data.oldPassword.toString(), user.password)

            if (!match) {
                return res.status(400).json({ status: false, msg: "The old password is invalid" });
            }

            // 2. hash and update user model with the new password
            const hashedPass = await bcrypt.hash(data.newPassword, 10);

            await User.findOneAndUpdate({ _id: userId }, {
                $set: {
                    password: hashedPass
                }
            });

            return res.status(200).json({ status: true, msg: "Password changed successfully" })
        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message });
        }
    },

    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({ status: false, msg: "The field is required!" });
            }

            // get the user
            const user = await User.findOne({ $or: [{ email }, { username: email }] });

            if (!user) {
                return res.status(400).json({ status: false, msg: "User not found! Please register" });
            }

            // check passwordReset collection if user already exist, then update the token
            const oldUser = await PasswordReset.findOne({ userId: user._id })

            if (oldUser) {
                const passwordReset = await PasswordReset.findOneAndUpdate({ userId: user._id }, { $set: { token: ran.resetToken() } }, { new: true });
                const data = { email: user.email, passwordReset }

                passResetLink(data, res);
            }

            else {
                // otherwise generate and save token and also save the user             
                const passwordReset = new PasswordReset({
                    token: ran.resetToken(),
                    userId: user._id
                })

                // await passwordReset.save()
                const data = { email: user.email, passwordReset }

                passResetLink(data, res);
            }

        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err });
        }
    },

    verifyForgotPassword: async (req, res) => {
        try {
            const { token } = req.query;

            const data = {
                password: DOMPurify.sanitize(req.body.password),
                cpassword: DOMPurify.sanitize(req.body.cpassword)
            }

            if (!data.password || !data.cpassword) {
                return res.status(400).json({ status: false, msg: "Fill all required fields!" });

            }
            if (data.password != data.cpassword) {
                return res.status(405).json({ status: false, msg: "Passwords do not match!" });

            }

            else if (data.password.length < 6) {
                return res.status(405).json({ status: false, msg: "Password too short, must not be less than 6 characters" });
            }

            if (!token) {
                return res.status(400).json({ status: false, msg: "Token is missing!" })
            }

            //search token in the database 
            const token_ = await PasswordReset.findOne({ token });

            if (!token_) {
                return res.status(400).json({ status: false, msg: "Invalid token" })
            }


            //use the token to find the user
            const user = await User.findOne({ _id: token_.userId })

            if (!user) {
                return res.status(400).json({ status: false, msg: "User not found" });
            }

            // 1. remove the token from PasswordReset model
            await PasswordReset.findOneAndUpdate({ token }, { $set: { token: null } })

            // 2. update user model with password
            const hashedPass = await bcrypt.hash(data.password, 10);

            await User.findOneAndUpdate({ _id: user.id }, { $set: { password: hashedPass } });

            // check if user verified his/her account
            if (!user.isVerified) {
                return res.status(200).json({ status: false, msg: "Password Changed. Please verify your account to login in" });
            }

            // login the user
            const accesstoken = generateAccesstoken(user._id);
            const refreshtoken = generateRefreshtoken(user._id);

            return res.status(200).json({
                status: true,
                msg: "Password Changed and you are logged in",
                accesstoken,
                refreshtoken,
                data: user
            })
        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message });
        }
    },

    toggleAdmin: async (req, res) => {
        try {
            const { id } = req.params;
            const loggedId = req.user

            const user = await User.findOne({ _id: id })
            const loggedUser = await User.findOne({ _id: loggedId })

            if (!user) {
                return res.status(401).json({ status: true, msg: "User not found" });
            }

            if (user.isBlocked) {
                return res.status(401).json({ status: true, msg: "User is blocked" });
            }

            if (!user.isVerified) {
                return res.status(401).json({ status: true, msg: "User's account is not verifeid" });
            }

            if (user.role?.toLowerCase() === "user") {
                // update the user with the phone number
                const data = await User.findByIdAndUpdate({ _id: id }, {
                    $set: {
                        role: "ADMIN"
                    }
                }, { new: true })

                return res.status(200).json({ status: true, msg: "User is now an Admin", data });
            }
            else {
                if (loggedUser.isSupperAdmin && id == loggedId) {
                    return res.status(401).json({ status: false, msg: "Supper admin cannot be removed from the role" });
                }
                // update the user with the phone number
                const data = await User.findByIdAndUpdate({ _id: id }, {
                    $set: {
                        role: "USER"
                    }
                }, { new: true })

                return res.status(200).json({ status: true, msg: "User is no more an Admin", data });
            }


        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message || "Server error, please contact customer support" })
        }
    },

    toggleBlockUser: async (req, res) => {
        try {
            let { id } = req.params
            // Find and block user, user most not be the admin
            const user_ = await User.findOne({ _id: id })
            if (!user_) {
                return res.status(404).json({ status: false, msg: "User not found" })
            }
            if (!user_.isBlocked) {
                if (user_.role?.toLowerCase() === 'admin') {
                    return res.status(400).json({ status: false, msg: "Admin's account cannot be blocked" })

                } else {
                    const data = await User.findOneAndUpdate({ _id: id }, { $set: { isBlocked: true } }, { new: true });

                    return res.status(200).json({ status: true, msg: "User's account has been blocked", data })
                }
            }

            else {
                const data = await User.findOneAndUpdate({ _id: id }, { $set: { isBlocked: false } }, { new: true });

                return res.status(200).json({ status: true, msg: "User's account has been unblocked", data });

            }

        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message || "Server error, please contact customer support" })
        }

    },

    deleteManyAccounts: async (req, res) => {
        try {
            // find these users that are not admin
            const users = await User.find({ $and: [{ _id: req.body.id }, { role: 'USER' }] }).select('_id')

            // loop through and get their ids
            let id = []
            let profileId = []
            for (let user of users) {
                id.push(user.id)
                profileId.push(user.profile)
            }


            // delete all users
            await User.deleteMany({ _id: id })

            // delete from profile collection
            await Profile.deleteMany({ _id: profileId })


            // delete from Contest Database
            await ReferralContest.deleteMany({ userId: id })

            // delete from referral history collection
            await ReferralHistory.deleteMany({ referrerId: id })

            // delete their withdrawal hx
            //...await User.findByIdAndDelete({userId_: id})

            // delete their deposit hx
            //...await User.findByIdAndDelete({userId_: id})

            // delete their investment hx
            //...await User.findByIdAndDelete({userId_: id})

            return res.status(200).json({ status: true, msg: `${id.length} account${id.length > 1 ? 's' : ''} deleted`, data: id });

        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message || "Server error, please contact customer service" })
        }

    },

    deleteAllAccounts: async (req, res) => {
        try {

            // find all users that are not admin
            const users = await User.find({ role: 'USER' }).select('_id')

            // loop through and get their ids
            let id = []
            let profileId = []
            for (let user of users) {
                id.push(user.id)
                profileId.push(user.profile)
            }


            // delete all users
            await User.deleteMany({ _id: id })

            // delete from profile collection
            await Profile.deleteMany({ _id: profileId })


            // delete from Contest Database
            await ReferralContest.deleteMany({ userId: id })

            // delete from referral history collection
            await ReferralHistory.deleteMany({ referrerId: id })

            // delete their withdrawal hx
            //...await User.findByIdAndDelete({userId_: id})

            // delete their deposit hx
            //...await User.findByIdAndDelete({userId_: id})

            // delete their investment hx
            //...await User.findByIdAndDelete({userId_: id})

            return res.status(200).json({ status: true, msg: `${id.length} account${id.length > 1 ? 's' : ''} deleted`, data: id });

        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message || "Server error, please contact customer service" })
        }
    },
}
