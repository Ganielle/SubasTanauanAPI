const mongoose = require("mongoose");

const LivestockcriteriaSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            index: true // Automatically creates an index on 'amount'
        },
        pricerange: {
            type: Number,
            index: true
        },
        livestock: {
            type: String,
            index: true
        }
    },
    {
        timestamps: true
    }
)

const Livestockcriteria = mongoose.model("Livestockcriteria", LivestockcriteriaSchema)
module.exports = Livestockcriteria