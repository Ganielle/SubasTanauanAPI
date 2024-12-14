const router = require("express").Router()
const {loanrequesthistory, approvedenyloan, requestloan, loanhistory} = require("../controllers/Loans")
const {protectsuperadmin, protectuser} = require("../middleware/middleware")

router

    //  #region SUPERADMIN

    .get("/loanrequesthistory", protectsuperadmin, loanrequesthistory)
    .post("/approvedenyloan", protectsuperadmin, approvedenyloan)

    //  #endregion


    //  #region USERS

    .get("/loanhistory", protectuser, loanhistory)
    .post("/requestloan", protectuser, requestloan)

    //  #endregion

module.exports = router;