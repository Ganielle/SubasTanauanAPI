const Users = require("../models/Users")
const Userdetails = require("../models/Userdetails")
const Wallets = require("../models/Wallets")
const Livestockcriteria = require("../models/Livestockcriteria")
const Verificationcode = require("../models/verificationcode")
const fetch = require('node-fetch');

const bcrypt = require('bcrypt');
const { default: mongoose, mongo } = require("mongoose");
const picture = require("../routes/picture")

const encrypt = async password => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
}

//  #region SUPER ADMIN

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

exports.listuserid = async (req, res) => {
    const {id, username} = req.user

    const {page, limit, namesearch} = req.query

    const pageOptions = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10
    }

    const matchStage = {}
    if (namesearch){
        matchStage["$or"] = [
            {'firstname': { $regex: namesearch, $options: 'i' }},
            {'lastname': { $regex: namesearch, $options: 'i' }},
            { $expr: { $regexMatch: { input: { $concat: ['$firstname', ' ', 'lastname'] }, regex: namesearch, options: 'i' } } } // Search for first + last name
        ]
    }

    const result = await Userdetails.aggregate([
        {
            $match: matchStage
        },
        {
            $lookup: {
                from: 'users', // Collection name for the 'userDetails' schema
                localField: 'owner',
                foreignField: '_id',
                as: 'details'
            }
        },
        {
            $unwind: '$details' // Deconstruct the 'details' array to a single object
        },
        {
            $match: {
                'details.auth': 'user',
                'details.verified': 'Pending'
            }
        },
        {
            $project: {
                _id: 1,
                userid: '$details._id',
                username: '$details.username',
                fullname: { $concat: ['$firstname', ' ', '$lastname']},
                picture: 1,
                createdAt: 1
            }
        },
        { $skip: pageOptions.page * pageOptions.limit },
        { $limit: pageOptions.limit }
    ])

    const total = await Userdetails.countDocuments(matchStage)

    const totalPages = Math.ceil((total?.total || 0) / pageOptions.limit);

    const data = {
        list: result,
        totalpages: totalPages
    };

    return res.json({message: "success", data: data})
}

exports.approvedenieuserid = async (req, res) => {
    const {id, username} = req.user

    const {userid, status, deniedidreason} = req.body

    if (!userid){
        return res.status(400).json({message: "failed", data: "Please select a valid user"})
    }

    await Users.findOneAndUpdate({_id: new mongoose.Types.ObjectId(userid)}, {verified: status, deniedidreason: deniedidreason})
    .catch(err => {

        console.log(`There's a problem approving or denying user id ${userid}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem with the server. Please contact customer support for more details"})
    })

    return res.json({message: "success"})
}

//  #endregion

//  #region USERS

exports.createuser = async (req, res) => {
    const {username, password, email, firstname, lastname, pricerange, livestock} = req.body

    if (!username){
        return res.status(400).json({message: "failed", data: "Please input username"})
    }
    else if (!password){
        return res.status(400).json({message: "failed", data: "Please input password"})
    }
    else if (!email){
        return res.status(400).json({message: "failed", data: "Please input email"})
    }
    else if (!firstname){
        return res.status(400).json({message: "failed", data: "Please input firstname"})
    }
    else if (!lastname){
        return res.status(400).json({message: "failed", data: "Please input lastname"})
    }
    else if (!pricerange){
        return res.status(400).json({message: "failed", data: "Please select a price range"})
    }
    else if (!livestock){
        return res.status(400).json({message: "failed", data: "Please select a preferred livestock"})
    }

    let picture = ""

    if (req.file){
        picture = req.file.path
    }
    else{
        return res.status(400).json({message: "failed", data: "Please select a valid id first!"})
    }

    const existinglogin = await Users.findOne({username: { $regex: new RegExp('^' + username + '$', 'i') }})
    .then(data => data)

    if (existinglogin){
        return res.status(400).json({message: "failed", data: "There's an existing username. Please use a different one"})
    }

    const userdetails = await Userdetails.findOne({$or: [
        {email: { $regex: new RegExp('^' + email + '$', 'i') }},
        {$and: [
            {firstname: { $regex: new RegExp('^' + firstname + '$', 'i') }},
            {lastname: { $regex: new RegExp('^' + lastname + '$', 'i') }}
        ]}
    ]})
    .then(data => data)

    if (userdetails){
        return res.status(400).json({message: "failed", data: "Email or firstname and lastname already existed"})
    }

    const user = await Users.create({username: username, password: password, token: "", bandate: "", banreason: "", status: "active", auth: "user", picture: picture, verified: "Pending", emailverified: false, deniedidreason: ""})
    .catch(err => {
        console.log(`There's a problem creating user login details. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There' a problem with the server. Please contact customer support"})
    })

    await Userdetails.create({owner: new mongoose.Types.ObjectId(user._id), email: email, firstname: firstname, lastname: lastname, picture: picture})
    .catch(err => {
        console.log(`There's a problem creating user details. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There' a problem with the server. Please contact customer support"})
    })

    const wallets = [
        {owner: new mongoose.Types.ObjectId(user._id), type: "credits", amount: 0},
        {owner: new mongoose.Types.ObjectId(user._id), type: "loan", amount: 0}
    ]

    await Wallets.insertMany(wallets)
    .catch(err => {
        console.log(`There's a problem creating wallet details. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There' a problem with the server. Please contact customer support"})
    })

    await Livestockcriteria.create({owner: new mongoose.Types.ObjectId(user._id), pricerange: pricerange, livestock: livestock})
    .catch(err => {
        console.log(`There's a problem creating livestock criteria. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There' a problem with the server. Please contact customer support"})
    })

    return res.json({message: "success"})
}

exports.sendemailverification = async (req, res) => {
    const {id, email} = req.user

    const code = Math.floor(10 ** (6 - 1) + Math.random() * 9 * (10 ** (6 - 1))).toString();

    const payload = {
        service_id: "service_x0h9mvo",
        template_id: "template_ggvcgu6",
        user_id: "YcxBYw1N1wNtGDjgw",
        accessToken: "fiAQPpPp9Celfy5wpQFqE",
        template_params: {
            message: `${code}`,
            to_email: email
        }
    };

    await Verificationcode.create({owner: new mongoose.Types.ObjectId(id), code: code, used: false})
    .catch(err => {
        console.log(`There's a problem creating verification code for ${id}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem with the server! Please contact customer support"})
    })

    const emailresponse = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    })

    const result = await emailresponse.text();

    if (result !== 'OK'){
        return res.status(400).json({message: "failed", data: "Failed to send verification code. Please contact customer support"})
    }

    return res.json({message: "success"})
}

exports.verifyemail = async (req, res) => {
    const {id, email} = req.user

    const {code} = req.body

    if (!code){
        return res.status(400).json({message: "failed", data: "Please enter your code first!"})
    }

    const verification = await Verificationcode.findOne({owner: new mongoose.Types.ObjectId(id), code: code})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting verification code for ${id}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem with the server! Please contact customer support"})
    })

    if (!verification){
        return res.status(400).json({message: "failed", data: "Your code entered does not match! Please enter the code provided in the email"})
    }

    else if (verification.used){
        return res.status(400).json({message: "failed", data: "This code is already used! Please enter the latest code that is emailed to your email."})
    }

    await Verificationcode.findOneAndUpdate({owner: new mongoose.Types.ObjectId(id), code: code}, {used: true})
    .catch(err => {
        console.log(`There's a problem updating verification code for ${id}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem with the server! Please contact customer support"})
    })

    await Users.findOneAndUpdate({_id: new mongoose.Types.ObjectId(id)}, {emailverified: true})
    .catch(err => {
        console.log(`There's a problem updating user email verification for ${id}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem with the server! Please contact customer support"})
    })

    return res.json({message: "success"})
}

exports.sendotpemail = async (req, res) => {
    const {id, email} = req.user

    const code = Math.floor(10 ** (6 - 1) + Math.random() * 9 * (10 ** (6 - 1))).toString();

    const payload = {
        service_id: "service_x0h9mvo",
        template_id: "template_h9evjj4",
        user_id: "YcxBYw1N1wNtGDjgw",
        accessToken: "fiAQPpPp9Celfy5wpQFqE",
        template_params: {
            message: `${code}`,
            to_email: email
        }
    };

    await Verificationcode.create({owner: new mongoose.Types.ObjectId(id), code: code, used: false})
    .catch(err => {
        console.log(`There's a problem creating verification code for ${id}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem with the server! Please contact customer support"})
    })

    const emailresponse = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    })

    const result = await emailresponse.text();

    if (result !== 'OK'){
        return res.status(400).json({message: "failed", data: "Failed to send verification code. Please contact customer support"})
    }

    return res.json({message: "success"})
}

exports.verifyOTP = async (req, res) => {
    const {id, email} = req.user

    const {code} = req.body

    if (!code){
        return res.status(400).json({message: "failed", data: "Please enter your code first!"})
    }

    const verification = await Verificationcode.findOne({owner: new mongoose.Types.ObjectId(id), code: code})
    .then(data => data)
    .catch(err => {
        console.log(`There's a problem getting OTP code for ${id}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem with the server! Please contact customer support"})
    })

    if (!verification){
        return res.status(400).json({message: "failed", data: "Your code entered does not match! Please enter the code provided in the email"})
    }

    else if (verification.used){
        return res.status(400).json({message: "failed", data: "This code is already used! Please enter the latest code that is emailed to your email."})
    }

    await Verificationcode.findOneAndUpdate({owner: new mongoose.Types.ObjectId(id), code: code}, {used: true})
    .catch(err => {
        console.log(`There's a problem updating verification code for ${id}. Error: ${err}`)

        return res.status(400).json({message: "bad-request", data: "There's a problem with the server! Please contact customer support"})
    })

    return res.json({message: "success"})
}

exports.getuserdetails = async (req, res) => {
    const {id, username} = req.user

    const details = await Userdetails.findOne({owner: new mongoose.Types.ObjectId(id)})
    .populate({
        path: "owner",
        select: "username"
    })
    
    if (!details){
        return res.status(400).json({message: "failed", data: "User not exist"})
    }

    return res.json({message: "success", data: details})
}

//  #endregion