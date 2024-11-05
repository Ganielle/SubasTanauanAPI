const { default: mongoose } = require("mongoose")
const Livestockcriteria = require("../models/Livestockcriteria")


//  #region USERS

exports.getcriteria = async (req, res) => {
    const {id, username} = req.user

    const criterias = await Livestockcriteria.findOne({owner: new mongoose.Types.ObjectId(id)})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting livestock criteria data for ${username}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There' a problem with the server. Please contact customer support"})
    })

    const data = {
        criterias: {
            pricerange: criterias.pricerange,
            livestock: criterias.livestock
        }
    }

    return res.json({message: "success", data: data})
}

//  #endregion