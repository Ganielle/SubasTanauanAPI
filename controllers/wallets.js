const { default: mongoose } = require("mongoose")
const Wallets = require("../models/Wallets")


//  #region USERS

exports.getwallets = async (req, res) => {
    const {id, username} = req.user

    const wallets = await Wallets.find({owner: new mongoose.Types.ObjectId(id)})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting wallet data for ${username}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There' a problem with the server. Please contact customer support"})
    })

    const data = {
        wallets: {
            credits: 0,
            loan: 0
        }
    }

    wallets.forEach(tempdata => {
        const {type, amount} = tempdata

        data.wallets[type] = {
            amount: amount
        }
    })

    return res.json({message: "success", data: data})
}

//  #endregion