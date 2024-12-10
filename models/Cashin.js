const mongoose = require("mongoose");

const CashinSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            index: true // Automatically creates an index on 'amount'
        },
        amount: {
            type: Number,
            index: true
        },
        paymentmethod: {
            type: String,
            index: true
        },
        accountnumber: {
            type: String,
            index: true
        },
        accountname: {
            type: String,
            index: true
        },
        receipt: {
            type: String
        },
        status: {
            type: String,
            index: true
        },
    },
    {
        timestamps: true
    }
)

const Cashin = mongoose.model("Cashin", CashinSchema)
module.exports = Cashin