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

exports.requestcashinuserhistory = async (req, res) => {
    const {id, username} = req.user

    const {page, limit} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    }

    const result = await Cashin.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(id)
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
            $project: {
                $_id: 0,
                cashinid: "$_id",
                fullname: { $concat: ['$details.firstname', ' ', '$details.lastname']},
                amount: 1,
                paymentmethod: 1,
                accountnumber: 1,
                accountname: 1,
                receipt: 1,
                status: 1
            }
        },
        { $skip: pageOptions.page * pageOptions.limit },
        { $limit: pageOptions.limit }
    ])

    
    const total = await Cashin.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(id)
            }
        },
        { $count: 'total' }
    ]);

    const totalPages = Math.ceil((total[0]?.total || 0) / pageOptions.limit);

    const data = {
        list: result,
        totalpages: totalPages
    };

    return res.json({message: "success", data: data})
}

//  #endregion

//  #region SUPERADMIN


exports.cashinrequestlist = async (req, res) => {
    const {id, username} = req.user

    const {page, limit, searchname, status} = req.query

    if (!status){
        return res.status(400).json({message: "failed", data: "Please select a valid status first!"})
    }
    else if (status != "Approved" && status != "Denied" && status != "Pending"){
        return res.status(400).json({message: "failed", data: "Please select between approved, denied, and pending only"})
    }

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    }

    const matchStage = {}
    if (searchname){
        searchname.$or = [
            { 'details.firstname': { $regex: searchname, $options: 'i' } },
            { 'details.lastname': { $regex: searchname, $options: 'i' } },
            { $expr: { $regexMatch: { input: { $concat: ['$details.firstname', ' ', '$details.lastname'] }, regex: searchname, options: 'i' } } } // Search for first + last name
        ];
    }

    const result = await Cashin.aggregate([
        {
            $match: {
                status: status
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
            $match: matchStage // Apply the dynamic auth filter if provided
        },
        {
            $project: {
                $_id: 0,
                cashinid: "$_id",
                fullname: { $concat: ['$details.firstname', ' ', '$details.lastname']},
                amount: 1,
                paymentmethod: 1,
                accountnumber: 1,
                accountname: 1,
                receipt: 1,
                status: 1
            }
        },
        { $skip: pageOptions.page * pageOptions.limit },
        { $limit: pageOptions.limit }
    ])

    const total = await Cashin.aggregate([
        {
            $match: {
                status: status
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
            $match: matchStage // Apply the dynamic auth filter if provided
        },
        { $count: 'total' }
    ]);

    const totalPages = Math.ceil((total[0]?.total || 0) / pageOptions.limit);

    const data = {
        list: result,
        totalpages: totalPages
    };

    return res.json({message: "success", data: data})
}

exports.approvedeniecashinrequest = async (req, res) => {
    const {id, username} = req.user

    const {requestid, status} = req.body

    if (!requestid){
        return res.status(400).json({message: "Please select a valid cashin request"})
    }
    else if (!status){
        return res.status(400).json({message: "Please select a valid status"})
    }
    else if (status != "Approved" && status != "Denied"){
        return res.status(400).json({message: "Please select between Approved and Denied only"})
    }

    const cashinrequest = await Cashin.findOneAndUpdate({_id: new mongoose.Types.ObjectId(requestid)}, {status: status})
    .catch(err => {
        console.log(`There's a problem with ${status} cashin request for the id ${requestid}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem with the server! Please try again later"})
    })

    if (status == "Approved"){
        await Wallets.findOneAndUpdate({owner: new mongoose.Types.ObjectId(cashinrequest.owner), type: "credits"}, {$inc: {amount: cashinrequest.amount}})
        .catch(err => {
            console.log(`There's a problem adding credits when approve cashin request: ${requestid}. Error: ${err}`)

            return res.status(400).json({message: "bad-request", data: "There's a problem with the server. Please try again later"})
        })
    }

    return res.json({message: "success"})
}



//  #endregion