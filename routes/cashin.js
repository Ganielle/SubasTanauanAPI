const router = require("express").Router()
const {requestcashin, requestcashinuserhistory, cashinrequestlist, approvedeniecashinrequest} = require("../controllers/cashin")
const {protectsuperadmin, protectuser} = require("../middleware/middleware")

router

    //  #region SUPERADMIN

    .get("/cashinrequestlist", protectsuperadmin, cashinrequestlist)
    .post("/approvedeniecashinrequest", protectsuperadmin, approvedeniecashinrequest)

    //  #endregion


    //  #region USERS

    .get("/requestcashinuserhistory", protectuser, requestcashinuserhistory)
    .post("/requestcashin", protectuser, requestcashin)

    //  #endregion

module.exports = router;