const router = require("express").Router()
const {login, logout} = require("../controllers/auth")

router
    .get("/login", login)
    .get("/logout", logout)

module.exports = router;