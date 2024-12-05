const mongoose = require("mongoose");

const LivebiddingItemSchema = new mongoose.Schema(
    {
        inventoryitem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Inventory",
            index: true // Automatically creates an index on 'amount'
        }
    },
    {
        timestamps: true
    }
)

const Livebiddingitems = mongoose.model("Livebiddingitems", LivebiddingItemSchema)
module.exports = Livebiddingitems