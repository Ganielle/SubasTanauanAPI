const { default: mongoose } = require("mongoose")
const Store = require("../models/Store")
const Users = require("../models/Users")

//  #region USER

exports.getstorestatus = async (req, res) => {
    const {id, username} = req.user

    const idstats = await Users.findOne({_id: new mongoose.Types.ObjectId(id)})
    .then(data => data)
    .catch(err => {

        console.log(`There's a problem gettng user data for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please try again." })
    })

    const storestatus = await Store.findOne({owner: new mongoose.Types.ObjectId(id)})
    .populate({
        path: "owner",
        select: "verified"
    })
    .then(data => data)
    .catch(err => {

        console.log(`There's a problem searching store for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please try again." })
    })

    console.log(storestatus)

    const data = {
        storeid: "",
        idstatus: idstats.verified,
        status: "none"
    }

    if (storestatus){
        data.storeid = storestatus._id
        data.status = storestatus.status
    }

    return res.json({message:" success", data: data})
}

exports.applystore = async (req, res) => {
    const {id, username} = req.user

    const {storename, address, lang, lat, contactnumber} = req.body

    if (!storename){
        return res.status(400).json({message: "failed", data: "Please enter a store name"})
    }
    else if (!address){
        return res.status(400).json({message: "failed", data: "Please enter a store address"})
    }
    else if (!lang || !lat){
        return res.status(400).json({message: "failed", data: "Store address not valid!"})
    }
    else if (!contactnumber){
        return res.status(400).json({message: "failed", data: "Please enter a store contact number"})
    }

    const existingstore = await Store.findOne({storename: { $regex: new RegExp('^' + storename + '$', 'i') }})

    if (existingstore){
        return res.status(400).json({message: "failed", data: "There's an existing store name. Please use a different one"})
    }

    await Store.create({owner: new mongoose.Types.ObjectId(id), storename: storename, storeaddress: address, storecontactnumber: contactnumber, lat: lat, lang: lang, status: "Pending"})
    .catch(err => {

        console.log(`There's a problem saving store for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please try again." })
    })

    return res.json({message: "success"})
}

exports.getownedstoredetails = async (req, res) => {
    const {id, username} = req.user

    const {storeid} = req.query

    if (!storeid){
        return res.status(400).json({message: "failed", data: "Please select a valid store id"})
    }

    const store = await Store.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(storeid)
            }
        },
        {
            $lookup: {
                from: 'userdetails', // Collection name for the 'userDetails' schema
                localField: 'owner',
                foreignField: 'owner',
                as: 'details'
            }
        },
        {
            $unwind: '$details' // Deconstruct the 'details' array to a single object
        },
        {
            $lookup: {
                from: 'users', // Collection name for the 'userDetails' schema
                localField: 'owner',
                foreignField: '_id',
                as: 'userlogindetails'
            }
        },
        {
            $unwind: '$userlogindetails' // Deconstruct the 'details' array to a single object
        },
        {
            $project: {
                _id: 1,
                storename: '$storename',
                storeaddress: '$storeaddress',
                storecontactnumber: '$storecontactnumber',
                ownername: { $concat: ['$details.firstname', ' ', '$details.lastname']},
                owneremail: '$details.email',
                verifiedemail: '$userlogindetails.emailverified',
                verifiedbyid: '$userlogindetails.verified',
                lang: '$lang',
                lat: '$lat'
            }
        }
    ])
    .catch(err => {
        console.log(`There's a problem getting the store for ${storeid}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem with the server. Please contact customer support for more details."})
    })
    

    return res.json({message: "success", data: store})
}

//  #endregion

//  #region SUPERADMIN

exports.storelist = async (req, res) => {
    const {id, username} = req.user

    const {page, limit, storenamefilter, statusfilter} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    }

    const matchStage = {
        status: statusfilter
    }

    if (storenamefilter){
        matchStage["storename"] = { $regex: storenamefilter, $options: 'i' } 
    }

    const storelist = await Store.aggregate([
        {
            $match: matchStage
        },
        {
            $lookup: {
                from: 'userdetails', // Collection name for the 'userDetails' schema
                localField: 'owner',
                foreignField: 'owner',
                as: 'details'
            }
        },
        {
            $unwind: '$details' // Deconstruct the 'details' array to a single object
        },
        {
            $project: {
                _id: 1,
                storename: 1,
                storeaddress: 1,
                storecontactnumber: 1,
                status: 1,
                fullname: { $concat: ['$details.firstname', ' ', '$details.lastname']},
                createdAt: 1
            }
        },
        { $skip: pageOptions.page * pageOptions.limit },
        { $limit: pageOptions.limit }
    ])

    const total = await Store.aggregate([
        {
            $match: matchStage
        },
        { $lookup: {
            from: 'userdetails',
            localField: '_id',
            foreignField: 'owner',
            as: 'details'
        }},
        { $unwind: '$details' },
        { $count: 'total' }
    ]);

    const totalPages = Math.ceil((total[0]?.total || 0) / pageOptions.limit);

    const data = {
        list: [],
        totalpages: totalPages
    };

    storelist.forEach(tempdata => {
        const {_id, storename, fullname, storeaddress, storecontactnumber, status, createdAt} = tempdata

        data.list.push({
            storeid: _id,
            storename: storename,
            fullname: fullname,
            storeaddress: storeaddress,
            storecontactnumber: storecontactnumber,
            status: status,
            createdAt: createdAt
        })
    })

    return res.json({message: "success", data: data})
}

exports.approvedeclinestore = async (req, res) => {
    const {id, email} = req.user

    const {storeid, status} = req.body

    if (!status){
        return res.status(400).json({message: "failed", data: "Please select a valid status!"})
    }
    else if (status != "Approved" && status != "Denied"){
        return res.status(400).json({message: "failed", data: "Please select a from Approved or Denied!"})
    }
    else if (!storeid){
        return res.status(400).json({message: "failed", data: "Please select a valid store!"})
    }

    await Store.findOneAndUpdate({_id: new mongoose.Types.ObjectId(storeid)}, {status: status})
    .catch(err => {
        console.log(`There's a problem approving or denying the store ${storeid}. ERROR: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem with the server! Please contact customer support for more details"})
    })

    return res.json({message: "success"})
}

exports.getstoredetails = async (req, res) => {
    const {id, username} = req.user

    const {storeid} = req.query

    if (!storeid){
        return res.status(400).json({message: "failed", data: "Please select a valid store id"})
    }

    const store = await Store.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(storeid)
            }
        },
        {
            $lookup: {
                from: 'userdetails', // Collection name for the 'userDetails' schema
                localField: 'owner',
                foreignField: 'owner',
                as: 'details'
            }
        },
        {
            $unwind: '$details' // Deconstruct the 'details' array to a single object
        },
        {
            $lookup: {
                from: 'users', // Collection name for the 'userDetails' schema
                localField: 'owner',
                foreignField: '_id',
                as: 'userlogindetails'
            }
        },
        {
            $unwind: '$userlogindetails' // Deconstruct the 'details' array to a single object
        },
        {
            $project: {
                _id: 1,
                storename: '$storename',
                storeaddress: '$storeaddress',
                storecontactnumber: '$storecontactnumber',
                ownername: { $concat: ['$details.firstname', ' ', '$details.lastname']},
                owneremail: '$details.email',
                verifiedemail: '$userlogindetails.emailverified',
                verifiedbyid: '$userlogindetails.verified',
                lang: '$lang',
                lat: '$lat'
            }
        }
    ])
    .catch(err => {
        console.log(`There's a problem getting the store for ${storeid}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem with the server. Please contact customer support for more details."})
    })
    

    return res.json({message: "success", data: store})
}

//  #endregion