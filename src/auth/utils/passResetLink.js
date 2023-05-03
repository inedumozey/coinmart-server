const e = require('express');
const mongoose = require('mongoose')
require('dotenv').config();
const Config = mongoose.model("Config");
const mailgunSetup = require('../../config/mailgun');
const text = require('./text')

module.exports = async (data, res) => {

    // get config data if exist otherwise set the env
    const config = await Config.find({});

    const configData = {
        name: process.env.NAME,
        bio: process.env.BIO,
        bg: process.env.BRAND_COLOR,
    }

    const URL = `${process.env.FRONTEND_BASE_URL}/${process.env.RESET_PASSWORD_URL}/${data.passwordReset.token}`

    if (process.env.ENV !== 'development') {

        const email_data = {
            from: `${configData.name}. <${process.env.EMAIL_USER2}>`,
            to: data.email,
            subject: 'Reset Your Password',
            html: text.linkText(configData.name, configData.bio, configData.bg, URL, data, 'password', "Click to Reset your Password")
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
                    return res.status(500).json({ status: false, msg: err.message || "Internal Server error, please contact customer supportu" })
                }
            }
            else {
                // save the data inthe collection
                await data.passwordReset.save()
                return res.status(200).json({ status: true, msg: `Check your email (${data.email}) to reset your password` });
            }
        })

    } else {
        // save the data inthe collection
        await data.passwordReset.save()
        return res.status(200).json({ status: true, msg: "On development mode! Please check below to reset your password", token: data.passwordReset.token });
    }
}