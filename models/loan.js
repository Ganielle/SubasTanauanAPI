const mongoose = require("mongoose");

const LoanSchema = new mongoose.Schema(
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
        datetopay: {
            type: Date,
            index: true
        },
        status: {
            type: String,
            index: true
        }
    },
    {
        timestamps: true
    }
)

const Loan = mongoose.model("Loan", LoanSchema)
module.exports = Loan