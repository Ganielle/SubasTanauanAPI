const { default: mongoose } = require("mongoose")
const Cashin = require("../models/Cashin")
const Wallets = require("../models/Wallets")

//  #region USERS

exports.requestcashin = async (req, res) => {
    const {id, username} = req.user

    const {amount, paymentmethod, accountname, accountnumber} = req.body

    if (isNaN(amount)){
        return res.status(400).json({message: "failed", data: "Please enter a valid number"})
    }
    else if (amount <= 0){
        return res.status(400).json({message: "failed", data: "Please enter number greater than 0"})
    }
    else if (amount < 200){
        return res.status(400).json({message: "failed", data: "Minimum cashin is 200 pesos"})
    }
    else if (!paymentmethod){
        return res.status(400).json({message: "failed", data: "Please enter your payment method"})
    }
    else if (!accountname){
        return res.status(400).json({message: "failed", data: "Please enter your account name"})
    }
    else if (!accountnumber){
        return res.status(400).json({message: "failed", data: "Please enter your account number"})
    }

    let picture = ""

    if (req.file){
        picture = req.file.path
    }
    else{
        return res.status(400).json({message: "failed", data: "Please upload a picture for your cashin receipt!"})
    }

    await Cashin.create({owner: new mongoose.Types.ObjectId(id), amount: amount, paymentmethod: paymentmethod, accountnumber: accountnumber, accountname: accountname, receipt: picture, status: "Pending"})
    .catch(err => {
        console.log(`There's a problem with creating cashin data for ${username}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem with the server! Please contact customer support for more details"})
    })

    return res.json({message: "success"})
}

exports.cashinrequestlist = async (req, res) => {

}

//  #endregion