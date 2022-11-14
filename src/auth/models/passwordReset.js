const mongoose = require('mongoose');
const authSchema = new mongoose.Schema(
    {
        token: {
            type: String
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            expires: '1d', //will be removed after this time (1 day)
            default: Date.now()
        }
    }
)

mongoose.model("PasswordReset", authSchema);