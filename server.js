const express = require('express');
const path = require('path')
const http = require('http');
const socketio = require('socket.io')
const mongoose = require('mongoose');
const bodyParser = require("body-parser");

const formatMessage = require('./utils/messages');
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users');
const { error } = require('console');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const botName = "Admin";

//MongoDB connecion
mongoose.connect('mongodb+srv://admin-zacharia:kebojantan21@cluster0.41ndsjl.mongodb.net/chatRoomDB').catch(err => console.log(err));

const roomSchema = new mongoose.Schema({
    roomName: String
  });
  
const Room = mongoose.model('Room', roomSchema);

//Serve static files
app.use(express.static(path.join(__dirname, 'public')))
//Body parsers
app.use(bodyParser.urlencoded({extended: true}));
//Ejs engine
app.set('view engine', 'ejs');


app.get("/", (req, res) => {
    Room.find((err, docs) => {
        if (err) {
          console.log(err);
        } else {
          res.render("home", {rooms: docs});
        }
      })
})

app.get("/chat", (req, res) => {
    res.render("chat");
})

app.get("/admin", (req, res) => {
    Room.find((err, docs) => {
        if (err) {
          console.log(err);
        } else {
          res.render("admin", {rooms: docs});
        }
      })
})

app.post("/addRoom", (req, res) => {
    const room = new Room ({
        roomName : req.body.newRoom
    })
    
    room.save(err => {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/")
        }
        });
})

app.post("/delete", (req, res) => {

    const checkedRoomId = req.body.checkbox;

    Room.deleteOne({_id : checkedRoomId}, err => {
        if (err) {
            console.log(err);
        }
        else{
            console.log("Successfully deleted checked room.");
            res.redirect("/admin");
        }
    });

});

app.post("/deleteAll", (req, res) => {

    const checkedRoomId = req.body.checkbox;

    Room.remove({}, err => {
        if (err) {
            console.log(err);
        }
        else{
            console.log("Successfully deleted all rooms.");
            res.redirect("/admin");
        }
    });

});

//Run when user connects
io.on('connection', socket => {
    
    socket.on('joinRoom', ({username, room}) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        //Welcome current user thats connecting
        socket.emit('message', formatMessage(botName, 'Welcome to HackChat'));

        //Notify other users of a user connecting
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`));

        //Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })
    })

    //Catching the chatMessage
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    })

    //Notify every user if a user disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));
        
        //Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })
    })
})





const PORT = 3000 || process.env.PORT;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));