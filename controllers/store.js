const { default: mongoose } = require("mongoose")
const Store = require("../models/Store")

//  #region USER

exports.getstorestatus = async (req, res) => {
    const {id, username} = req.user

    const storestatus = await Store.findOne({owner: new mongoose.Types.ObjectId(id)})
    .then(data => data)
    .catch(err => {

        console.log(`There's a problem searching store for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please try again." })
    })

    const data = {
        status: "none"
    }

    if (storestatus){
        data.status = storestatus.status
    }

    return res.json({message:" success", data: data})
}

exports.applystore = async (req, res) => {
    const {id, username} = req.user

    const {storename, address, contactnumber} = req.body

    if (!storename){
        return res.status(400).json({message: "failed", data: "Please enter a store name"})
    }
    else if (!address){
        return res.status(400).json({message: "failed", data: "Please enter a store address"})
    }
    else if (!contactnumber){
        return res.status(400).json({message: "failed", data: "Please enter a store contact number"})
    }

    const existingstore = await Store.findOne({storename: { $regex: new RegExp('^' + storename + '$', 'i') }})

    if (existingstore){
        return res.status(400).json({message: "failed", data: "There's an existing store name. Please use a different one"})
    }

    await Store.create({owner: new mongoose.Types.ObjectId(id), storename: storename, storeaddress: address, storecontactnumber: contactnumber, status: "Pending"})
    .catch(err => {

        console.log(`There's a problem saving store for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem with the server. Please try again." })
    })

    return res.json({message: "success"})
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
        matchStage["storename"] = { $regex: new RegExp('^' + storename + '$', 'i') }
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

    console.log(storelist)

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

//  #endregion