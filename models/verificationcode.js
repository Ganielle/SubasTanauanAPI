const mongoose = require("mongoose");

const verificationCodeSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            index: true // Automatically creates an index on 'amount'
        },
        code: {
            type: String
        },
        used: {
            type: Boolean
        }
    },
    {
        timestamps: true
    }
)

const Verificationcode = mongoose.model("Verificationcode", verificationCodeSchema)
module.exports = Verificationcode