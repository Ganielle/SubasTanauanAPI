const Announcement = require("../models/Announcement")

//  #region SUPERADMIN

exports.saveannouncement = async (req, res) => {
    const {id, username} = req.user

    const {title, content} = req.body

    if (!title){
        return res.status(400).json({message: "failed", data: "Please enter your title first."})
    }
    else if (!content){
        return res.status(400).json({message: "bad-request", data: "Please enter your content first."})
    }

    await Announcement.create({title: title, content: content})
    .catch(err => {
        console.log(`There's a problem saving the announcement. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem with the server. Please try again later."})
    })

    return res.json({message: "success"})
}

//  #endregion


//  #region USERS

exports.getannouncement = async (req, res) => {
    const {id, username} = req.user

    const announcementdata = await Announcement.find()
    .sort({createdAt: -1})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the announcement data. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem with the server. Please try again later"})
    })

    const data = {
        title: announcementdata.length > 0 ? announcementdata.title : "",
        content: announcementdata.length > 0 ? announcementdata.content : ""
    }

    return res.json({message: "success", data: data})
}

//  #endregion