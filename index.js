const app = require("express")();
const http = require("http").Server(app);
const jsonfile = require("jsonfile");
const io = require("socket.io")(http);
const path = require("path");
const { Client } = require("pg");
const port = process.env.PORT || 3000;

require("dotenv").config();
const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: "required"
});

client.connect(err => {
  if (err) {
    console.error("connection error", err.stack);
  } else {
    console.log("connected to DB");
    client
      .query("SELECT * FROM chat.users")
      .then(res => console.log("--¯_(ツ)_/¯-----------res----------", res))
      .catch(e => console.error(e.stack));
  }
});

const DB_DIR = path.join(__dirname, "./DB.json");
function readDB() {
  return new Promise(function(resolve, reject) {
    jsonfile.readFile(DB_DIR, function(err, DB) {
      if (err) {
        console.log(err);
        reject(err);
      }
      resolve(DB);
    });
  });
}

function writeDb(content) {
  return new Promise(function(resolve) {
    jsonfile.writeFile(DB_DIR, content, function(err) {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function addUser(username) {
  return readDB().then(db => {
    db.users.push(username);
    return writeDb(db).then(() => db);
  });
}
function removeUser(username) {
  return readDB().then(db => {
    const index = db.users.indexOf(username);
    if (index > -1) {
      db.users.splice(index, 1);
      return writeDb(db).then(() => db);
    }
    return false;
  });
}
function addMessage(username, message) {
  return readDB().then(db => {
    const newMessage = username + ": " + message;
    db.messages.push(newMessage);
    return writeDb(db).then(() => newMessage);
  });
}

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", function(socket) {
  const username = socket.handshake.query.username;
  if (!username) {
    socket.disconnect();
    return;
  }

  addUser(username).then(db => {
    io.emit("all messages", db.messages);
    io.emit("users", db.users);
  });

  socket.on("disconnect", function() {
    removeUser(username).then(db => db && io.emit("users", db.users));
  });
  socket.on("chat message", function(message) {
    addMessage(username, message).then(newMessage => {
      io.emit("chat message", newMessage);
    });
  });
});

http.listen(port, function() {
  console.log("listening on localhost:" + port);
});
