const router = require("express").Router()
const {saveannouncement, getannouncement} = require("../controllers/announcement")
const {protectsuperadmin, protectuser} = require("../middleware/middleware")

router

    //  #region SUPERADMIN

    .post("/saveannouncement", protectsuperadmin, saveannouncement)

    //  #endregion


    //  #region USERS

    .get("/getannouncement", protectuser, getannouncement)

    //  #endregion

module.exports = router;