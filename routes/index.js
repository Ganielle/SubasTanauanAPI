const routers = app => {
    console.log("Routers are all available");

    app.use("/auth", require("./auth"))
    app.use("/users", require("./users"))
    app.use("/wallets", require("./wallets"))
    app.use("/criteria", require("./criteria"))
    app.use("/store", require("./store"))
    app.use("/uploads", require('./picture'))
    app.use("/inventory", require('./inventory'))
    app.use("/livebidding", require("./livebidding"))
    app.use("/cashin", require("./cashin"))
    app.use("/loan", require("./loan"))
    app.use("/announcement", require("./announcement"))
}

module.exports = routers