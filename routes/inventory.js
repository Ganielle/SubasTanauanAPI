const router = require("express").Router()
const {createitem, inventorylist} = require("../controllers/inventory")
const {protectsuperadmin, protectuser} = require("../middleware/middleware")
const upload = require("../middleware/uploadspic")

const uploadimg = upload.single("file")

router

    //  #region SUPERADMIN

    //  #endregion


    //  #region USERS

    .get("/inventorylist", protectuser, inventorylist)
    .post("/createitem", protectuser, function (req, res, next){
        uploadimg(req, res, function(err) {
            if (err){
                return res.status(400).send({ message: "failed", data: err.message })
            }

            next()
        })
    }, createitem)

    //  #endregion

module.exports = router;