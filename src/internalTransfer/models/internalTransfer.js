const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types

const schema = new mongoose.Schema(
    {
        sender: {
            type: ObjectId,
            ref: 'User',
            required: true
        },
        senderUsername: {
            type: String,
            required: true
        },
        receiver: {
            type: ObjectId,
            ref: 'User',
            required: true
        },
        receiverUsername: {
            type: String,
            required: true
        },
        status: {
            type: String,
            default: 'Successful'
        },
        accountNumber: {
            type: Number,
            required: true
        },
        amount: {
            type: Number,
            default: 0
        },
        currency: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
)
mongoose.model("InternalTransfer", schema);