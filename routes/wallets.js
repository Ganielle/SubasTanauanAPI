const router = require("express").Router()
const {getwallets} = require("../controllers/wallets")
const {protectsuperadmin, protectuser} = require("../middleware/middleware")

router

    //  #region SUPERADMIN

    //  #endregion


    //  #region USERS

    .get("/getwallets", protectuser, getwallets)

    //  #endregion

module.exports = router;