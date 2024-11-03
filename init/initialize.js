const Users = require("../models/Users")
const Userdetails = require("../models/Userdetails")
const { default: mongoose } = require("mongoose")

exports.initserver = async () => {
    
    console.log("STARTING INITIALIZE SERVER DATA")

    const superadmin = await Users.find({auth: "superadmin"})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the superadmin datas. Error ${err}`)

        return
    })

    if (superadmin.length <= 0){
        const sadata = await Users.create({username: "subastanuansa", password: "2b6aBdUo1SY7", token: "", bandate: "", banreason: "", status: "active", auth: "superadmin"})
        .catch(err => {
            console.log(`There's a problem saving the admin login datas. Error ${err}`)
    
            return
        })

        await Userdetails.create({owner: new mongoose.Types.ObjectId(sadata._id), firstname:"super", lastname: "admin"})
        .catch(err => {
            console.log(`There's a problem saving the admin user details. Error ${err}`)
    
            return
        })
    }

    console.log("DONE INITIALIZING SERVER DATA")
}