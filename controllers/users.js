const Users = require("../models/Users")
const Userdetails = require("../models/Userdetails")

const bcrypt = require('bcrypt');
const { default: mongoose, mongo } = require("mongoose");

const encrypt = async password => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
}

//  #region STAFF USERS

exports.createstaffs = async (req, res) => {
    const {username, id} = req.user

    const {staffusername, password, firstname, lastname, auth} = req.body

    if (staffusername.length < 5 || username.length > 40){
        return res.status(400).json({message: "failed", data: "Minimum of 5 and maximum of 20 characters only for username! Please try again."})
    }

    const usernameRegex = /^[a-zA-Z0-9]+$/;
    
    if (!usernameRegex.test(staffusername)){
        return res.status(400).json({message: "failed", data: "Please don't use special characters for username! Please try again."})
    }

    if (password.length < 5 || password.length > 20){
        return res.status(400).json({message: "failed", data: "Minimum of 5 and maximum of 20 characters only for password! Please try again."})
    }

    const passwordRegex = /^[a-zA-Z0-9\[\]!@#*]+$/;

    if (!passwordRegex.test(password)){
        return res.status(400).json({message: "failed", data: "Only []!@#* are supported special characters for password! Please try again."})
    }

    if (!firstname){
        return res.status(400).json({message: "failed", data: "Please enter user first name."})
    }

    if (!lastname){
        return res.status(400).json({message: "failed", data: "Please enter user last name."})
    }

    const user = await Users.findOne({username: { $regex: new RegExp('^' + staffusername + '$', 'i') }})
    .then(data => data)
    .catch(err => {

        console.log(`There's a problem searching user for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem registering the account. Please try again." })
    })

    if (user){
        return res.status(400).json({message: "failed", data: "You already registered this username!"})
    }

    const userdetails = await Userdetails.findOne({
        $and: [
            {firstname: { $regex: new RegExp('^' + firstname + '$', 'i') }},
            {lastname: { $regex: new RegExp('^' + lastname + '$', 'i') }}
        ]
    })
    .then(data => data)
    .catch(err => {

        console.log(`There's a problem searching user details for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem registering the account. Please try again." })
    })

    if (userdetails){
        return res.status(400).json({message: "failed", data: "You already registered this user using the first name and last name!"})
    }

    const finaluser = await Users.create({username: staffusername, password: password, token: "", auth: auth, bandate: "", banreason: "", status: "active"})
    .then(data => data)
    .catch(err => {

        console.log(`There's a problem creating user login for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem registering the account. Please try again." })
    })

    await Userdetails.create({owner: new mongoose.Types.ObjectId(finaluser._id), firstname: firstname, lastname: lastname})
    .catch(async (err) => {
        console.log(`There's a problem creating user details for ${username} Error: ${err}`)

        await Users.findOneAndDelete({username: staffusername})

        return res.status(400).json({ message: "bad-request", data: "There's a problem registering the account. Please try again." })
    })

    return res.json({message: "success"})
}

exports.liststaffs = async (req, res) => {
    const {username, id} = req.user
    
    const {page, limit, authfilter, fullnamefilter} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    }

    const fullnameMatchStage = {}
    // Add search filter for first name, last name, or combined
    if (fullnamefilter) {
        fullnameMatchStage.$or = [
            { 'details.firstname': { $regex: fullnamefilter, $options: 'i' } },
            { 'details.lastname': { $regex: fullnamefilter, $options: 'i' } },
            { $expr: { $regexMatch: { input: { $concat: ['$details.firstname', ' ', '$details.lastname'] }, regex: fullnamefilter, options: 'i' } } } // Search for first + last name
        ];
    }

    const staffsdata = await Users.aggregate([
        {
            $match: {
                auth: authfilter
            }
        },
        {
            $lookup: {
                from: 'userdetails', // Collection name for the 'userDetails' schema
                localField: '_id',
                foreignField: 'owner',
                as: 'details'
            }
        },
        {
            $unwind: '$details' // Deconstruct the 'details' array to a single object
        },
        {
            $match: fullnameMatchStage // Apply the dynamic auth filter if provided
        },
        {
            $project: {
                _id: 1,
                username: 1,
                firstname: '$details.firstname',
                lastname: '$details.lastname',
                fullname: { $concat: ['$details.firstname', ' ', '$details.lastname']},
                createdAt: 1
            }
        },
        { $skip: pageOptions.page * pageOptions.limit },
        { $limit: pageOptions.limit }
    ])

    console.log

    const total = await Users.aggregate([
        {
            $match: {
                auth: authfilter
            }
        },
        { $lookup: {
            from: 'userdetails',
            localField: '_id',
            foreignField: 'owner',
            as: 'details'
        }},
        { $unwind: '$details' },
        { $match: fullnameMatchStage },
        { $count: 'total' }
    ]);

    const totalPages = Math.ceil((total[0]?.total || 0) / pageOptions.limit);

    const data = {
        list: [],
        totalpages: totalPages
    };

    staffsdata.forEach(tempdata => {
        const {_id, username, firstname, lastname, fullname, createdAt} = tempdata

        data.list.push({
            userid: _id,
            username: username,
            firstname: firstname,
            lastname: lastname,
            fullname: fullname,
            createdAt: createdAt
        })
    })

    return res.json({message: "success", data: data})
}

exports.deletestaff = async (req, res) => {
    const {username, id} = req.user

    const {userid} = req.body

    if (!userid){
        return res.status(400).json({message: "failed", data: "Please select a valid user to delete"})
    }

    await Users.findOneAndDelete({_id: new mongoose.Types.ObjectId(userid)})
    .catch(err => {
        console.log(`There's a problem deleting user id: ${userid}. Error: ${err}`)

        return res.status(400).json({message: "There's a problem with the server please contact customer support"})
    })

    await Userdetails.findOneAndDelete({owner: new mongoose.Types.ObjectId(userid)})
    .catch(err => {
        console.log(`There's a problem deleting user details. id: ${userid}. Error: ${err}`)

        return res.status(400).json({message: "There's a problem with the server please contact customer support"})
    })

    return res.json({message: "success"})
}

exports.editstaff = async (req, res) => {
    const {username, id} = req.user

    const {userid, staffusername, password, firstname, lastname} = req.body

    if (!userid){
        return res.status(400).json({message: "failed", data: "Please select a valid user to edit"})
    }

    if (staffusername.length < 5 || username.length > 40){
        return res.status(400).json({message: "failed", data: "Minimum of 5 and maximum of 20 characters only for username! Please try again."})
    }

    const usernameRegex = /^[a-zA-Z0-9]+$/;
    
    if (!usernameRegex.test(staffusername)){
        return res.status(400).json({message: "failed", data: "Please don't use special characters for username! Please try again."})
    }

    if (password){
        if (password.length < 5 || password.length > 20){
            return res.status(400).json({message: "failed", data: "Minimum of 5 and maximum of 20 characters only for password! Please try again."})
        }
    
        const passwordRegex = /^[a-zA-Z0-9\[\]!@#*]+$/;
    
        if (!passwordRegex.test(password)){
            return res.status(400).json({message: "failed", data: "Only []!@#* are supported special characters for password! Please try again."})
        }
    }

    if (!firstname){
        return res.status(400).json({message: "failed", data: "Please enter user first name."})
    }

    if (!lastname){
        return res.status(400).json({message: "failed", data: "Please enter user last name."})
    }

    const user = await Users.findOne({username: { $regex: new RegExp('^' + staffusername + '$', 'i') }})
    .then(data => data)
    .catch(err => {

        console.log(`There's a problem searching user for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem registering the account. Please try again." })
    })

    if (user._id != userid){
        if (user){
            return res.status(400).json({message: "failed", data: "You already registered this username!"})
        }
    }
    

    const userdetails = await Userdetails.findOne({
        $and: [
            {firstname: { $regex: new RegExp('^' + firstname + '$', 'i') }},
            {lastname: { $regex: new RegExp('^' + lastname + '$', 'i') }}
        ]
    })
    .then(data => data)
    .catch(err => {

        console.log(`There's a problem searching user details for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem registering the account. Please try again." })
    })

    if (userdetails.owner != userid){
        if (userdetails){
            return res.status(400).json({message: "failed", data: "You already registered this user using the first name and last name!"})
        }
    }
    

    const editlogin = {
        username: staffusername
    }

    if (password){
        editlogin["password"] = await encrypt(password)
    }

    await Users.findOneAndUpdate({_id: new mongoose.Types.ObjectId(userid)}, editlogin)
    .catch(err => {

        console.log(`There's a problem creating user login for ${username} Error: ${err}`)

        return res.status(400).json({ message: "bad-request", data: "There's a problem registering the account. Please try again." })
    })

    await Userdetails.findOneAndUpdate({owner: new mongoose.Types.ObjectId(userid)}, {firstname: firstname, lastname: lastname})
    .catch(async (err) => {
        console.log(`There's a problem creating user details for ${username} Error: ${err}`)

        await Users.findOneAndDelete({username: staffusername})

        return res.status(400).json({ message: "bad-request", data: "There's a problem registering the account. Please try again." })
    })

    return res.json({message: "success"})
}

//  #endregion