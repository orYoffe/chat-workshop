var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var port = process.env.PORT || 3000;

const users = [];
const messages = [];

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", function(socket) {
  const username = socket.handshake.query.username;
  users.push(username);
  console.log(
    "-------------socket.handshake.query.username----------",
    socket.handshake.query.username
  );
  socket.on("chat message", function(msg) {
    const newMessage = username + ": " + msg;
    messages.push(newMessage);
    io.emit("chat message", newMessage);
  });
});

http.listen(port, function() {
  console.log("listening on localhost:" + port);
});
