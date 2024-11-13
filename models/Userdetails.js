const mongoose = require("mongoose");

const UserdetailsSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            index: true // Automatically creates an index on 'amount'
        },
        email: {
            type: String
        },
        firstname: {
            type: String
        },
        lastname: {
            type: String
        },
        picture: {
            type: String
        },
    },
    {
        timestamps: true
    }
)

const Userdetails = mongoose.model("Userdetails", UserdetailsSchema)
module.exports = Userdetails