const mongoose = require("mongoose");

const InventorySchema = new mongoose.Schema(
    {
        storeowner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Store",
            index: true // Automatically creates an index on 'amount'
        },
        itemname: {
            type: String,
            index: true
        },
        itemqty: {
            type: Number
        },
        itemprice: {
            type: Number,
            index: true
        },
        itemtype: {
            type: String,
            index: true
        },
        itemdescription: {
            type: String
        },
        image: {
            type: String
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

const Inventory = mongoose.model("Inventory", InventorySchema)
module.exports = Inventory