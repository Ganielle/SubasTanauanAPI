const router = require("express").Router()
const {additemtolivebidding} = require("../controllers/livebidding")
const {protectsuperadmin, protectuser} = require("../middleware/middleware")

router

    //  #region SUPERADMIN

    //  #endregion


    //  #region USERS

    .post("/additemtolivebidding", protectuser, additemtolivebidding)

    //  #endregion

module.exports = router;