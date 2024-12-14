const { default: mongoose } = require("mongoose")
const Loan = require("../models/loan")

const {getNextMonthPaymentDate} = require("../utils/datetime")
const Wallets = require("../models/Wallets")

//  #region SUPERADMIN

exports.loanrequesthistory = async (req, res) => {
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

    const result = await Loan.aggregate([
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
            $match: matchStage
        },
        {
            $project: {
                $_id: 0,
                loanid: "$_id",
                fullname: { $concat: ['$details.firstname', ' ', '$details.lastname']},
                amount: 1,
                datetopay: 1,
                status: 1
            }
        },
        { $skip: pageOptions.page * pageOptions.limit },
        { $limit: pageOptions.limit }
    ])

    const total = await Loan.aggregate([
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
            $match: matchStage
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

exports.approvedenyloan = async (req, res) => {
    const {id, username} = req.user

    const {loanid, status} = req.body

    if (!loanid){
        return res.status(400).json({message: "Please select a valid cashin request"})
    }
    else if (!status){
        return res.status(400).json({message: "Please select a valid status"})
    }
    else if (status != "Approved" && status != "Denied"){
        return res.status(400).json({message: "Please select between Approved and Denied only"})
    }

    const loanrequest = await Loan.findOneAndUpdate({owner: new mongoose.Types.ObjectId(id)}, {status: status})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting the ${status} request of ${loanid}, Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem with the server. Please try again later"})
    })

    if (status == "Approved"){
        await Wallets.findOneAndUpdate({owner: new mongoose.Types.ObjectId(id), type: "credits"}, {$inc: {amount: loanrequest.amount}})
        .catch(err => {
            console.log(`There's a problem adding to credits wallet of loanid: ${loanid}, Error: ${err}`)
    
            return res.status(400).json({message: "bad-request", data: "There's a problem with the server. Please try again later"})
        })
    }

    return res.json({message: "success"})
}

//  #endregion

//  #region USERS

exports.requestloan = async (req, res) => {
    const {id, username} = req.user

    const {amount} = req.body

    if (!amount){
        return res.status(400).json({message: "failed", data: "Please enter your desired amount!"})
    }
    else if (isNaN(amount)){
        return res.status(400).json({message: "failed", data: "Please enter a valid amount!"})
    }
    else if (amount <= 0){
        return res.status(400).json({message: "failed", data: "Please enter amount greater than 0"})
    }

    await Loan.create({owner: new mongoose.Types.ObjectId(id), amount: amount, datetopay: getNextMonthPaymentDate(), status: "Pending"})
    .catch(err => {
        console.log(`There's a problem creating loan for ${id}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem with the server. Please try again later"})
    })

    return res.json({message: "success"})
}

exports.loanhistory = async (req, res) => {
    const {id, username} = req.user

    const {page, limit} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    }

    const result = await Loan.aggregate([
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
                loanid: "$_id",
                fullname: { $concat: ['$details.firstname', ' ', '$details.lastname']},
                amount: 1,
                datetopay: 1,
                status: 1
            }
        },
        { $skip: pageOptions.page * pageOptions.limit },
        { $limit: pageOptions.limit }
    ])

    const total = await Loan.aggregate([
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