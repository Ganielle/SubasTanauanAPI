const mongoose = require("mongoose");

const StoreSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            index: true // Automatically creates an index on 'amount'
        },
        storename: {
            type: String,
            index: true
        },
        storeaddress: {
            type: String,
            index: true
        },
        storecontactnumber: {
            type: String,
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

const Store = mongoose.model("Store", StoreSchema)
module.exports = Store