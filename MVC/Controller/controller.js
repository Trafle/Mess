"use strict";

const MongoClient = require("mongodb").MongoClient,
  ObjectID = require("mongodb").ObjectID,
  fs = require("fs"),
  crypto = require("crypto"),
  User = require("../Model/model.js"),
  mongoose = require("mongoose"),
  NodeCache = require("node-cache"),
  Cookies = require("cookies");

const cache = new NodeCache();

const uri =
  "mongodb+srv://Ihor:Babyboomer12@mess-bwmyk.mongodb.net/mess?retryWrites=true";

const SupaClient = new MongoClient(uri, { useNewUrlParser: true });

const dbName = "mess";

const pageLogin = fs.readFileSync("./public.1/Login/login.html"),
  pageSignIn = fs.readFileSync("./public.1/Login/signIn.html");

mongoose.connect(uri, { useNewUrlParser: true });

SupaClient.connect((err, client) => {
  console.log("connecting to Mongo");
  if (err) throw err;
  const db = client.db(dbName);
  global.db = db;
});

function bhash(secret) {
  const key = crypto
    .createHmac("sha256", secret)
    .update("I love cupcakes")
    .digest("hex");
  return key;
}

//main page load

exports.loadPage = (req, res) => {
  console.log("loadPage function invoked");
  const cookies = new Cookies(req, res);
  const accessCookie = cookies.get("sesID");
  if (accessCookie !== undefined) {
    User.findById(accessCookie, (err, result) => {
      if (!err) {
        console.log("a user reached the chat (with the key of course)");
        res.sendFile(appRoot + "/public.1/Messenger/main.html");
      } else {
        throw err;
      }
    });
  } else {
    console.log("there is no sesID cookie, redirected to the Sign In page");
    res.write(pageSignIn);
    res.end();
  }
};

// exports.msgSent = (req, res) => {
//   MongoClient.connect(url, { useNewUrlParser: true }, (err, client) => {
//     if (err) throw err;

//     const db = client.db(dbName);

//     db.collection("messages").insertOne(req.body, (err, res) => {
//       if (err) throw err;
//       console.log("Inserted: \x1b[32m");
//       console.log(req.body);
//       console.log("Inserted: \x1b[37m");
//       res.status(200).send("Inserted one");
//       client.close();
//     });
//     res.end();
//   });
// };

exports.loginPageLoad = (req, res) => {
  res.status(200).write(pageLogin);
  res.end();
};

exports.loginSubmit = (req, res) => {
  const hash = bhash(req.body.password);

  req.body.password = hash;

  let valUser = new User(req.body);

  valUser.save((err, result) => {
    if (err) {
      console.log("this email has been taken");
      res.send("this user already exists");
    } else {
      console.log("Saved the document: \x1b[32m");
      console.log(result);
      console.log("\x1b[37m");
      res.status(200).send("OK");
    }
  });
};

exports.showUsers = (req, res) => {
  User.find({}, (err, result) => {
    if (err) throw err;
    res.status(200).send(result);
    res.end();
  });
};

exports.signInPageLoad = (req, res) => {
  res.write(pageSignIn);
  res.status(200).end();
};

exports.signIn = (req, res) => {
  const secret = bhash(req.body.password);
  const cookies = new Cookies(req, res);

  User.find({ name: req.body.name, password: secret }, (err, result) => {
    let now = new Date();
    now = now.getFullYear();
    let then = new Date(
      "July 20, " +
        (() => {
          now + 1;
        })() +
        " 00:20:18"
    );
    if (result[0]) {
      console.log("there is such a user");

      cookies.set("name", result[0].name, {
        httpOnly: false,
        expires: then
      });
      cookies.set("sesID", result[0]._id, {
        httpOnly: false,
        expires: then
      });
      res.send("yep");
      res.end();
    } else {
      console.log("Wrong name or password");
      res.send("no such user");
      res.end();
    }
  });
};

const CLIENTS = [];
let counter = 0;

exports.sendmsg = (ws, req) => {
  const inter = setInterval(
    () => sendAllNotInsert(JSON.stringify({ ping: "ping" })),
    20000
  );
  // console.log(cache.get("lorem"));
  ws.on("message", msg => {
    if (msg === "pong") {
      // console.log("\x1b[32mpong is ok\x1b[37m");
    } else if (msg === "connected") {
      console.log("connected");
      CLIENTS.push([ws, counter]);
      ws.send(JSON.stringify({ counter: counter }));
      list(counter);
      counter++;
    } else if (JSON.parse(msg).msg && JSON.parse(msg).ID) {
      console.log("here the shit");
      CLIENTS.forEach(box => {
        if (box[1] === msg.ID) {
          console.log(`user ${box[1]} is closed`);
          box.push("closed");
          box[0].close();
        } else {
          return;
        }
      });
    } else if (JSON.parse(msg).change) {
      console.log("we eventually got here!!!!");
      updateDoc(JSON.parse(msg));
      sendAllNotInsert(msg);
    } else {
      console.log("about to send:");
      console.log(msg);
      sendAll(msg);
    }
    ws.on("close", () => {
      console.log("disconnected");
      ws.close();
    });
  });
};

function sendAll(message) {
  db.collection("messages").insertOne(JSON.parse(message), (err, res) => {
    if (err) throw err;

    message = JSON.parse(message);
    message["_id"] = res.insertedId;
    message = JSON.stringify(message);

    for (let i = 0; i < CLIENTS.length; i++) {
      if (CLIENTS[i][0].readyState === 1) {
        CLIENTS[i][0].send(message);
      }
    }
  });
}

function sendAllNotInsert(message) {
  for (let i = 0; i < CLIENTS.length; i++) {
    if (CLIENTS[i][0].readyState === 1) {
      CLIENTS[i][0].send(message);
    }
  }
}

function list(conID) {
  console.log("conID: " + conID);
  db.collection("messages")
    .find({})
    .forEach(msg => {
      CLIENTS[conID][0].send(JSON.stringify(msg));
    });
}

function updateDoc(msg) {
  const ad = msg.id;
  const va = msg.change;
  db.collection("messages").updateOne(
    { _id: ObjectID(ad) },
    { $set: { val: va } },
    (err, res) => {
      if (err) {
        console.log(
          "Error updating a document. Maybe the id didn' match any one"
        );
      }
      console.log("One document updated!");
      console.log(ad);
      console.log("new value: " + va);
    }
  );
}
