const mongoose = require("mongoose")

const { Schema } = mongoose

const schema = new Schema({
    profilePicUrl: {
        type: String,
        default: null
    },
    profilePicPublicId: {
        type: String,
        default: null
    },
    docUrl: {
        type: String,
        default: null
    },
    docPublicId: {
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