const router = require("express").Router()
const {getcriteria} = require("../controllers/livestockcriteria")
const {protectsuperadmin, protectuser} = require("../middleware/middleware")

router

    //  #region SUPERADMIN

    //  #endregion


    //  #region USERS

    .get("/getcriteria", protectuser, getcriteria)

    //  #endregion

module.exports = router;