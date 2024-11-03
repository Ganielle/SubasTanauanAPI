const router = require("express").Router()
const {createstaffs, liststaffs, deletestaff, editstaff} = require("../controllers/users")
const {protectsuperadmin} = require("../middleware/middleware")

router

    //  #region SUPERADMIN

    .get("/liststaffs", protectsuperadmin, liststaffs)
    .post("/createstaffs", protectsuperadmin, createstaffs)
    .post("/editstaff", protectsuperadmin, editstaff)
    .post("/deletestaff", protectsuperadmin, deletestaff)

    //  #endregion

module.exports = router;