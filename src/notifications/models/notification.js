const mongoose = require('mongoose');

const schema = new mongoose.Schema(
    {
        subject: {
            type: String,
        },
        text: {
            type: String,
        }
    },
    {
        timestamps: true
    }
)
const Notification = mongoose.model("Notification", schema);

module.exports = Notification;


