const mongoose = require("mongoose")

const { Schema } = mongoose

const schema = new Schema({
    profilePicUrl: {
        type: String,
        default: "https://api.multiavatar.com/popo.svg"
    },
    profilePicPublicId: {
        type: String,
        default: null
    },
    twofa: {
        type: Number,
        default: null
    },
    phone: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },

}, { timestamp: true })

mongoose.model("Profile", schema);