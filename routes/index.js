const routers = app => {
    console.log("Routers are all available");

    app.use("/auth", require("./auth"))
    app.use("/users", require("./users"))
    app.use("/wallets", require("./wallets"))
    app.use("/criteria", require("./criteria"))
    app.use("/store", require("./store"))
    app.use("/uploads", require('./picture'))
}

module.exports = routers