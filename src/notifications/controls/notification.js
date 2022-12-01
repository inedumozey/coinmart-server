const mongoose = require('mongoose')
const Notification = mongoose.model("Notification");
const User = mongoose.model("User");
require("dotenv").config();
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');


const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window)


module.exports = {

    push: async (req, res) => {
        try {
            const data = {
                subject: DOMPurify.sanitize(req.body.subject),
                text: DOMPurify.sanitize(req.body.text)
            }

            if (!data.text || !data.subject) {
                return res.status(400).json({ status: false, msg: "All fields are required!" });
            }

            const newNotification = new Notification({
                subject: data.subject,
                text: data.text,
            })

            await newNotification.save();

            await User.updateMany({}, {
                $push: { newNotifications: newNotification._id }
            })

            return res.status(200).json({ status: true, msg: "Notification pushed successfully" });
        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message })
        }
    },

    getAll_Admin: async (req, res) => {

        try {

            const data = await Notification.find({}).sort({ createdAt: -1 });
            return res.status(200).json({ status: true, msg: "Successful", data });
        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message })
        }
    },

    getOne_Admin: async (req, res) => {
        try {
            const data = await Notification.findOne({ _id: req.params.id });
            return res.status(200).json({ status: true, msg: "Successful", data });
        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message })
        }
    },

    // user read
    read: async (req, res) => {
        try {
            const userId = req.user;
            const { id } = req.params

            // update the the user

            await User.findOneAndUpdate({ _id: userId }, {
                $pull: {
                    newNotifications: id
                }
            })

            await User.findOneAndUpdate({ _id: userId }, {
                $push: {
                    readNotifications: id
                }
            })

            return res.status(200).json({ status: true, msg: "Message updated", data: id });
        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message })
        }
    },

    // user delete notification
    deleteNotification: async (req, res) => {
        try {
            const userId = req.user;
            const { id } = req.params

            // update the the user

            await User.findOneAndUpdate({ _id: userId }, {
                $pull: {
                    newNotifications: id
                }
            })

            await User.findOneAndUpdate({ _id: userId }, {
                $pull: {
                    readNotifications: id
                }
            })

            return res.status(200).json({ status: true, msg: "Deleted", data: id });
        }
        catch (err) {
            return res.status(500).json({ status: false, msg: err.message })
        }
    },
}