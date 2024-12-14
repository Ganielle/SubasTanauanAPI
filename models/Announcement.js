const mongoose = require("mongoose");

const AnnouncementSchema = new mongoose.Schema(
    {
        title: {
            type: String
        },
        content: {
            type: String
        }
    },
    {
        timestamps: true
    }
)

const Announcement = mongoose.model("Announcement", AnnouncementSchema)
module.exports = Announcement