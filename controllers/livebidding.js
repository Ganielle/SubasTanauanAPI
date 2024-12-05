const { default: mongoose } = require("mongoose")
const Livebiddingitems = require("../models/Livebiddingitems")
const Inventory = require("../models/Inventory")


//  #region USERS

exports.additemtolivebidding = async (req, res) => {
    const {id, username} = req.user

    const {itemid} = req.body

    if (!itemid){
        return res.status(400).json({message: "failed", data: "Please select a valid inventory item"})
    }

    const biddingitem = await Livebiddingitems.find({inventoryitem: new mongoose.Types.ObjectId(itemid)})

    if (biddingitem.length > 0){
        return res.status(400).json({message: "failed", data: "You already added this item to the live bidding"})
    }

    await Inventory.findOneAndUpdate({_id: new mongoose.Types.ObjectId(itemid)}, {$inc: {itemqty: -1}})
    await Livebiddingitems.create({inventoryitem: new mongoose.Types.ObjectId(itemid)})

    return res.json({message: "success"});
}
//  #endregion