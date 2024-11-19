const router = require("express").Router()
const {createitem, inventorylist, getinventoryitemdata, edititem, getmarketplaceitem} = require("../controllers/inventory")
const {protectsuperadmin, protectuser} = require("../middleware/middleware")
const upload = require("../middleware/uploadspic")

const uploadimg = upload.single("file")

router

    //  #region SUPERADMIN

    //  #endregion


    //  #region USERS

    .get("/inventorylist", protectuser, inventorylist)
    .get("/getinventoryitemdata", protectuser, getinventoryitemdata)
    .get("/getmarketplaceitem", protectuser, getmarketplaceitem)
    .post("/createitem", protectuser, function (req, res, next){
        uploadimg(req, res, function(err) {
            if (err){
                return res.status(400).send({ message: "failed", data: err.message })
            }

            next()
        })
    }, createitem)
    .post("/edititem", protectuser, function (req, res, next){
        uploadimg(req, res, function(err) {
            if (err){
                return res.status(400).send({ message: "failed", data: err.message })
            }

            next()
        })
    }, edititem)

    //  #endregion

module.exports = router;