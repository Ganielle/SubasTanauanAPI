const { default: mongoose } = require("mongoose")
const Inventory = require("../models/Inventory")

//  #region USERS

exports.createitem = async (req, res) => {
    const {id, username} = req.user

    const {storeid, itemname, itemqty, itemprice, itemtype, itemdescription} = req.body

    if (!storeid){
        return res.status(400).json({message: "failed", data: "Please select a valid store"})
    }
    else if (!itemname){
        return res.status(400).json({message: "failed", data: "Enter an item name first!"})
    }
    else if (isNaN(itemqty)){
        return res.status(400).json({message: "failed", data: "Please enter a valid quantity"})
    }
    else if (isNaN(itemprice)){
        return res.status(400).json({message: "failed", data: "Please enter a valid price"})
    }
    else if (!itemtype){
        return res.status(400).json({message: "failed", data: "Please select a valid item type"})
    }
    else if (!itemdescription){
        return res.status(400).json({message: "failed", data: "Please enter a valid item description"})
    }

    let picture = ""

    if (req.file){
        picture = req.file.path
    }
    else{
        return res.status(400).json({message: "failed", data: "Please upload a picture for your item!"})
    }

    const existing = await Inventory.findOne({itemname: { $regex: new RegExp('^' + itemname + '$', 'i') }})

    if (existing){
        return res.status(400).json({message: "failed", data: "There's an existing item. Please create a different item"})
    }

    await Inventory.create({storeowner: new mongoose.Types.ObjectId(storeid), itemname: itemname, itemqty: itemqty, itemprice: itemprice, itemtype: itemtype, itemdescription: itemdescription, image: picture, status: "Pending"})
    .catch(err => {
        console.log(`There's a problem with creating this item ${itemname} for ${storeid}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem with the server! Please contact customer support for more details"})
    })

    return res.json({message: "success"})
}

exports.inventorylist = async (req, res) => {
    const {id, username} = req.user

    const {page, limit, storeid, statusfilter, itemnamefilter} = req.query

    if (!storeid){
        return res.status(400).json({message: "failed", data: "Please select a valid store!"})
    }
    else if (!statusfilter){
        return res.status(400).json({message: "failed", data: "Please select a valid status!"})
    }

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    }

    const matchStage = {
        storeowner: new mongoose.Types.ObjectId(storeid),
        status: statusfilter
    }
    if (itemnamefilter){
        matchStage["itemname"] = { $regex: new RegExp(itemnamefilter, 'i') }
    }

    const items = await Inventory.find(matchStage)
    .skip(pageOptions.page * pageOptions.limit)
    .limit(pageOptions.limit)
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the inventory items for ${id} store ${storeid}. Error ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem with the server! Please contact customer support for more details"})
    })

    const total = await Inventory.countDocuments(matchStage)

    const totalPages = Math.ceil((total || 0) / pageOptions.limit);

    const data = {
        list: items,
        totalpages: totalPages
    };

    return res.json({message: "success", data: data})
}

//  #endregion