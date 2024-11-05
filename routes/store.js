const router = require("express").Router()
const {getstorestatus, applystore, storelist} = require("../controllers/store")
const {protectsuperadmin, protectuser} = require("../middleware/middleware")

router

    //  #region SUPERADMIN

    .get("/storelist", protectsuperadmin, storelist)
    
    //  #endregion


    //  #region USERS

    .get("/getstorestatus", protectuser, getstorestatus)
    .post("/applystore", protectuser, applystore)

    //  #endregion

module.exports = router;