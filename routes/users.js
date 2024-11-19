const router = require("express").Router()
const {createstaffs, liststaffs, deletestaff, editstaff, createuser, sendemailverification, verifyemail, verifyOTP, sendotpemail, listuserid} = require("../controllers/users")
const {protectsuperadmin, protectuser} = require("../middleware/middleware")
const upload = require("../middleware/uploadspic")

const uploadimg = upload.single("file")

router

    //  #region SUPERADMIN

    .get("/liststaffs", protectsuperadmin, liststaffs)
    .get("/listuserid", protectsuperadmin, listuserid)
    .post("/createstaffs", protectsuperadmin, createstaffs)
    .post("/editstaff", protectsuperadmin, editstaff)
    .post("/deletestaff", protectsuperadmin, deletestaff)

    //  #endregion


    //  #region USERS

    .get("/sendemailverification", protectuser, sendemailverification)
    .get("/sendotpemail", protectuser, sendotpemail)
    .post("/createuser", function (req, res, next){
        uploadimg(req, res, function(err) {
            if (err){
                return res.status(400).send({ message: "failed", data: err.message })
            }

            next()
        })
    }, createuser)
    .post("/verifyemail", protectuser, verifyemail)
    .post("/verifyOTP", protectuser, verifyOTP)

    //  #endregion

module.exports = router;