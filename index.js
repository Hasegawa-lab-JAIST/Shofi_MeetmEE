/*
Server side code need for the application
*/

const app = require("express")(); // the express to get the app
const server = require("http").createServer(app); //create server and pass to the application
const cors = require("cors"); // to allow or restrict requested resources on a web server (will be usefull in deployment)

// the signalling server 
const io = require("socket.io")(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());

const PORT = process.env.PORT || 5000;
// const PORT = 5000;

// first message when localhost:5000 is accessed
app.get("/", (req, res) => {
    res.send('Server is running.');
});

io.on('connection', (socket) => { //socket is used for real-time data connection ether audio, data, video
    socket.emit('me', socket.id);

    socket.on('disconnect', () => {
        socket.broadcast.emit("callended");
    });

    socket.on("calluser",({ userToCall, signalData, from, name}) => {
        io.to(userToCall).emit("calluser", {signal: signalData, from, name});
    });

    socket.on("answercall", (data) => {
        io.to(data.to).emit("callaccepted", data.signal);
    });
});

server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
// server.listen(PORT, () => console.log('Server listening on port ${PORT}'));
