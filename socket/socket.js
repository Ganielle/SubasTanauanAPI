const {initializeBidding, GetBidStateOnStart, RefreshLiveBiddingQueue} = require("../livebidding/livebidding")

const socket = io => {

    initializeBidding(io)

    io.on("connection", function(socketio){
        socketio.on("join_room", (data) => {
            socketio.join(data.roomId)
            GetBidStateOnStart(io, socketio.id)
        })

        socketio.on("send-message", async (data) => {
            console.log("Received message:", JSON.stringify(data, null, 2));
            socketio.broadcast.emit("receive-message", {
                message: "success", data: data
            })
        })

        socketio.on("add-to-live-bid", () => {
            RefreshLiveBiddingQueue(io)
        })
    })
}

module.exports = socket;