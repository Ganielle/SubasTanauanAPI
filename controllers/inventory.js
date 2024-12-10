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

exports.getinventoryitemdata = async (req, res) => {
    const {id, username} = req.user

    const {itemid} = req.query

    if (!itemid) {
        return res.status(400).json({message: "failed", data: "Select a valid inventory item"})
    }

    const item = await Inventory.findOne({_id: new mongoose.Types.ObjectId(itemid)})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the item data for ${itemid}. Error ${err}`)

        return res.status(400).json({message: "failed", data: "There's a problem with the server! Please contact customer support for more details."})
    })


    const data = {
        edititemlist: {
            _id: item._id,
            storeowner: item.storeowner,
            itemname: item.itemname,
            itemqty: item.itemqty,
            itemprice: item.itemprice,
            itemtype: item.itemtype,
            itemdescription: item.itemdescription,
            image: item.image,
        }
    }

    return res.json({message: "success", data: data})
}

exports.edititem = async (req, res) => {
    const {id, username} = req.user

    const {itemid, itemname, itemqty, itemprice, itemtype, itemdescription, image} = req.body

    if (!itemid){
        return res.status(400).json({message: "failed", data: "Please select a valid item"})
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

    if (image){
        if (req.file){
            picture = req.file.path
        }
        else{
            picture = image
        }
    }
    else{
        if (req.file){
            picture = req.file.path
        }
        else{
            return res.status(400).json({message: "failed", data: "Please upload a picture for your item!"})
        }
    }

    const existing = await Inventory.findOne({itemname: { $regex: new RegExp('^' + itemname + '$', 'i') }})

    if (existing){
        if (existing._id != itemid){
            return res.status(400).json({message: "failed", data: "There's an existing item. Please create a different item"})
        }
    }

    await Inventory.findOneAndUpdate({_id: new mongoose.Types.ObjectId(itemid)}, {itemname: itemname, itemqty: itemqty, itemprice: itemprice, itemtype: itemtype, itemdescription: itemdescription, image: picture})
    .catch(err => {
        console.log(`There's a problem with creating this item ${itemname} for ${storeid}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem with the server! Please contact customer support for more details"})
    })

    return res.json({message: "success"})
}

exports.getmarketplaceitem = async (req ,res) => {
    const {id, username} = req.user

    const {price, livestock, page, limit} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    }

    const matchStage = {
        itemqty: {$gt: 0},
        status: "Approved"
    }

    if (price){
        matchStage["$or"] = [
            {'itemprice': {$lte: parseInt(price)}}
        ]
    }

    if (livestock){
        if (matchStage['$or'] == null){
            matchStage["$or"] = [
                {'itemtype': livestock}
            ]
        }
        else{
            matchStage["$or"].push({
                'itemtype': livestock
            })
        }
    }

    const result = await Inventory.aggregate([
        {
            $match: matchStage
        },
        { 
            $lookup: {
                from: 'stores',
                localField: 'storeowner',
                foreignField: '_id',
                as: 'storeDetails'
            }
        },
        { $unwind: '$storeDetails' },
        { 
            $lookup: {
                from: 'users',
                localField: 'storeDetails.owner',
                foreignField: '_id',
                as: 'userLoginDetails'
            }
        },
        { $unwind: '$userLoginDetails' },
        { 
            $lookup: {
                from: 'userdetails',
                localField: 'storeDetails.owner',
                foreignField: 'owner',
                as: 'userDetails'
            }
        },
        { $unwind: '$userDetails' },
        {
            $project: {
                _id: 1,
                itemname: '$itemname',
                itemqty: '$itemqty',
                itemprice: '$itemprice',
                itemtype: '$itemtype',
                itemdescription: '$itemdescription',
                image: '$image',
                status: '$status',
                store: {
                    name: '$storeDetails.storename',
                    address: '$storeDetails.storeaddress',
                    contactnumber: '$storeDetails.storecontactnumber',
                    status: '$storeDetails.status'
                },
                owner: {
                    name: { $concat: ['$userDetails.firstname', ' ', '$userDetails.lastname']},
                    verifiedid: '$userLoginDetails.verified',
                    emailverified: '$userLoginDetails.emailverified' 
                }
            }
        },
        { $skip: pageOptions.page * pageOptions.limit},
        { $limit: pageOptions.limit}
    ])

    const total = await Inventory.countDocuments(matchStage)

    const totalPages = Math.ceil((total || 0) / pageOptions.limit);

    const data = {
        list: result,
        totalpages: totalPages
    };

    return res.json({message: "success", data: data})
}

//  #endregion

//  #region SUPERADMIN

exports.listrequestitems = async (req, res) => {
    const {id, username} = req.user

    const {page, limit, itemname, status} = req.query

    const matchStage = {}
    if (itemname){
        matchStage["itemname"] = { $regex: new RegExp(itemname, 'i') }
    }

    if (status){
        matchStage["status"] = status
    }

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    }

    const items = await Inventory.aggregate([
        {
            $match: matchStage
        },
        {
            $lookup: {
                from: 'stores', // Collection name for the 'userDetails' schema
                localField: 'storeowner',
                foreignField: '_id',
                as: 'storedetails'
            }
        },
        {
            $unwind: '$storedetails' // Deconstruct the 'details' array to a single object
        },
        {
            $lookup: {
                from: 'userdetails', // Collection name for the 'userDetails' schema
                localField: 'storedetails.owner',
                foreignField: 'owner',
                as: 'details'
            }
        },
        {
            $unwind: '$details' // Deconstruct the 'details' array to a single object
        },
        {
            $project: {
                _id: 0,
                itemid: '$_id',
                itemname: '$itemname',
                itemowner: { $concat: ['$details.firstname', ' ', '$details.lastname']},
                storename: '$storedetails.storename'
            }
        },
        { $skip: pageOptions.page * pageOptions.limit },
        { $limit: pageOptions.limit }
    ])

    console.log(items)

    const total = await Inventory.aggregate([
        {
            $match: matchStage
        },
        { $count: 'total' }
    ]);

    const totalPages = Math.ceil((total[0]?.total || 0) / pageOptions.limit);

    const data = {
        list: items,
        totalpages: totalPages
    };

    return res.json({message: "success", data: data})
}

exports.approverequestitems = async (req, res) => {
    const {id, username} = req.user

    const {itemid, approvestatus} = req.body

    if (!itemid){
        return res.status(400).json({message: "failed", data: "Please select a valid item"})
    }
    else if (!approvestatus){
        return res.status(400).json({message: "failed", data: "Please select a valid status"})
    }
    else if (approvestatus != "Approved" && approvestatus != "Denied"){
        return res.status(400).json({message: "failed", data: "Please select between approved and denied status"})
    }

    await Inventory.findOneAndUpdate({_id: new mongoose.Types.ObjectId(itemid)}, {status: approvestatus})
    .catch(err => {
        console.log(`There's a problem updating status of item ${itemid}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem with the server. Please contact customer support for more details"})
    })

    return res.json({message: "success"})
}

//  #endregion