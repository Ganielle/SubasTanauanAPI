const mongoose = require("mongoose");

const WalletsSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            index: true // Automatically creates an index on 'amount'
        },
        type: {
            type: String
        },
        amount: {
            type: Number
        }
    },
    {
        timestamps: true
    }
)

const Wallets = mongoose.model("Wallets", WalletsSchema)
module.exports = Wallets