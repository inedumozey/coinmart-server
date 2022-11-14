const e = require('express');
const mongoose = require('mongoose')
require('dotenv').config();
const Config = mongoose.model("Config");
const mailgunSetup = require('../../config/mailgun');

const createdYear = new Date().getFullYear();
const copyrightYear = createdYear > 2022 ? `2022 - ${new Date().getFullYear()}` : '2022'

module.exports = async (data, res) => {

    // get config data if exist otherwise set the env
    const config = await Config.find({});

    const configData = {
        name: config[0].appName,
        bio: process.env.BIO,
        brandColorA: process.env.BRAND_COLOR,
    }

    const URL = `${process.env.FRONTEND_BASE_URL}${process.env.RESET_PASSWORD_URL}/?token=${data.passwordReset.token}`

    if (process.env.ENV !== 'development') {
        // email text
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
                        Please ignore if this was not sent by you!.
                    </div>
                    <div>
                        <a style="display:inline-block; background: ${configData.brandColorA}; text-align:center; padding: 15px; color: #fff; font-weight: 600" href="${URL}">Click to Reset your Password</a>
                    </div>
                    <div style="text-align: center; margin: 5px 0; padding:10px">${URL}</div>
                </div>

                <div style="text-align:center; height: 40px; padding: 10px; background: #000">
                    <div style="color: #fff; padding: 0; margin:0">
                        Copyright @ ${copyrightYear} ${configData.name}
                    <div>
                </div>

            </div>
        `
        const email_data = {
            from: `${configData.name} <${process.env.EMAIL_USER}>`,
            to: data.email,
            subject: 'Reset Your Password',
            html: text,
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