const Livebiddingitems = require("../models/Livebiddingitems")

let timerValue = 30; // Timer duration in seconds for each item
let isRunning = false;
let interval = null;

let itemsQueue = [];
let currentItem = null;

//  noitem, waiting, bidding
let currentState = "";

let highestBidder = null

async function initializeBidding(io){

    console.log("Starting initialize bidding")

    await RefreshLiveBiddingQueue(io)

    SetNextBiddingData(io)

    if (itemsQueue.length <= 0){
        SetBiddingStatus(io, "NO ITEMS TO BID YET! PLEASE WAIT FOR THE ITEMS TO BE QUEUED", "noitem")
        return;
    }

    console.log(`Have bid item \nbid items: ${itemsQueue}`)

    currentItem = itemsQueue[0]

    io.emit("queue-item", currentItem)

    TimerCountdown(io)
}

async function RefreshLiveBiddingQueue(io){
    console.log("Refreshing Live bidding QUEUE")
    itemsQueue = await Livebiddingitems.find()
    .populate({
        path: "inventoryitem"
    })
    .sort({createdAt: -1})

    if (currentState == "noitem"){
        currentItem = itemsQueue[0]
        io.emit("queue-item", currentItem)
        TimerCountdown(io)
    }
}

function TimerCountdown(io){
    if (interval) {
        clearInterval(interval);
        interval = null;
    }
    timerValue = 60
    interval = setInterval(() => {
        if (timerValue > 0) {
            isRunning = true;
            timerValue--;
            SetBiddingStatus(io, "START BIDDING NOW!\nBIDDING COUNTDOWN", "bidding")
            io.emit("timer-update", { timerValue, isRunning });
        } else {
            WaitForNextItems(io)
        }
    }, 1000);
}

function WaitForNextItems(io){
    if (interval) {
        clearInterval(interval);
        interval = null;
    }

    currentItem = null
    io.emit("queue-item", currentItem)

    timerValue = 60
    interval = setInterval(() => {
        if (timerValue > 0) {
            isRunning = true;
            timerValue--;
            SetBiddingStatus(io, "WAITING FOR THE NEXT BID SESSION", "waiting")
            io.emit("timer-update", { timerValue, isRunning });
        } else {
            SetNextBiddingData(io)
        }
    }, 1000);
}

function SetNextBiddingData(io, socketid){
    if (interval) {
        clearInterval(interval);
        interval = null;
    }

    if (itemsQueue.length <= 0){
        isRunning = false
        SetBiddingStatus(io, "NO ITEMS TO BID YET! PLEASE WAIT FOR THE ITEMS TO BE QUEUED", "noitem")
        return;
    }
    
    currentItem = itemsQueue[0]
    io.emit("queue-item", currentItem)

    TimerCountdown(io)
}

function SetBiddingStatus(io, message, state) {
    currentState = state
    io.emit("bidding-status", {status: message})
}

function GetBidStateOnStart(io, socketid){
    if (currentState == "noitem"){
        io.to(socketid).emit("bidding-status", {status: "NO ITEMS TO BID YET! PLEASE WAIT FOR THE ITEMS TO BE QUEUED"})
        io.to(socketid).emit("queue-item", currentItem)
    }
    else if (currentState == "waiting"){
        io.to(socketid).emit("bidding-status", {status: "WAITING FOR THE NEXT BID SESSION"})
        io.to(socketid).emit("queue-item", currentItem)
    }
    else if (currentState == "bidding"){
        io.to(socketid).emit("bidding-status", {status: "START BIDDING NOW!\nBIDDING COUNTDOWN"})
        io.to(socketid).emit("queue-item", currentItem)
    }
}

function Bid(){
    
}

module.exports = {
    initializeBidding,
    GetBidStateOnStart,
    RefreshLiveBiddingQueue
};