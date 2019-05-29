"use strict";

const MongoClient = require("mongodb").MongoClient,
  ObjectID = require("mongodb").ObjectID,
  fs = require("fs"),
  crypto = require("crypto"),
  User = require("../Model/model.js"),
  mongoose = require("mongoose"),
  NodeCache = require("node-cache"),
  { promisify } = require("util"),
  Cookies = require("cookies");

const cache = new NodeCache();

const uri =
  "mongodb+srv://Ihor:Babyboomer12@mess-bwmyk.mongodb.net/mess?retryWrites=true";

const SupaClient = new MongoClient(uri, { useNewUrlParser: true });

const dbName = "mess";

const pageLogin = fs.readFileSync("./public.1/Login/login.html"),
  pageSignIn = fs.readFileSync("./public.1/Login/signIn.html");
// messengerPage = fs.readFileSync("./public.1/Messenger/")

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

const inter = setInterval(() => {
  sendAllNotInsert(JSON.stringify({ ping: "ping" }));
}, 20000);

exports.sendmsg = (ws, req) => {
  // console.log(cache.get("lorem"));
  ws.on("message", msg => {
    if (msg === "pong") {
      // PING-PONG
      // console.log("\x1b[32mpong is ok\x1b[37m");
    } else if (JSON.parse(msg).connect) {
      // CONNECTED

      console.log("connected");
      db.collection("users").updateOne(
        { name: JSON.parse(msg).name },
        { $set: { status: "online" } },
        (err, res) => {
          for (let i = 0; i < CLIENTS.length; i++) {
            if (CLIENTS[i][0].readyState === 1) {
              CLIENTS[i][0].send(
                JSON.stringify({
                  statusChange: true,
                  name: JSON.parse(msg).name,
                  status: "online"
                })
              );
              console.log(
                "SENT THAT " +
                  JSON.parse(msg).name +
                  " IS ONLINE TO " +
                  CLIENTS[i][1]
              );
            }
          }
        }
      );

      User.find({ name: JSON.parse(msg).name }, (err, docs) => {
        if (err) throw err;

        ws.send(
          JSON.stringify({ counter: counter, colNames: docs[0].colNames })
        );

        ws.counter = counter;

        CLIENTS.push([ws, JSON.parse(msg).name]);
        counter++;
      });
      list(counter);
    } else if (JSON.parse(msg).change !== undefined) {
      // CHANGE
      updateDoc(JSON.parse(msg));
      sendAllNotInsert(msg);
    } else if (JSON.parse(msg).search !== undefined) {
      // SEARCH
      let msag = JSON.parse(msg);

      let usrName = msag.search;
      let ID = msag.conID;

      let reg = new RegExp(usrName, "gi");

      User.find({ name: reg }, function(err, docs) {
        if (err) throw err;
        CLIENTS[ID][0].send(JSON.stringify({ search: docs }));
      });
    } else if (JSON.parse(msg).addChat) {
      // CHAT

      let msag = JSON.parse(msg);
      chat(msag.name1, msag.name2, JSON.parse(msg).conID);
    } else if (JSON.parse(msg).getMessages) {
      // GETTING MESSAGES
    } else if (JSON.parse(msg).writing) {
      //WRITING...
      msg = JSON.parse(msg);
      for (let i = 0; i < CLIENTS.length; i++) {
        if (CLIENTS[i][1] === msg.nameTo && CLIENTS[i][0].readyState === 1) {
          CLIENTS[i][0].send(JSON.stringify(msg));
        }
      }
    } else if (JSON.parse(msg).checkOnline) {
      // CHECK ONLINE
      msg = JSON.parse(msg);

      for (let i = 0; i < msg.chats.length; i++) {
        // ANY GROUP VARIABLE
        if (Object.keys(msg.chats[i])[0] === "messages") {
          continue;
        }

        User.findOne({ name: Object.keys(msg.chats[i])[0] }, (err, doc) => {
          if (CLIENTS[msg.conID][0].readyState === 1) {
            CLIENTS[msg.conID][0].send(
              JSON.stringify({
                checkOnline: true,
                usr: Object.keys(msg.chats[i])[0],
                status: doc["_doc"]["status"]
              })
            );
          }
        });
      }
    } else {
      // DEFAULT
      console.log("about to send:");
      console.log(msg);
      sendToUser(msg);
    }
  });
  ws.on("close", msg => {
    // CLOSING THE CONNECTION

    console.log(ws.counter + "'s left us");
    let name = CLIENTS[ws.counter][1];

    db.collection("users").updateOne(
      { name },
      { $set: { status: "offline" } },
      (err, res) => {
        if (err) {
          console.log(
            "Error updating a document. Maybe the id didn't match any one"
          );
        }
      }
    );

    User.findOne({ name }, (err, doc) => {
      console.log("doc.colNames");
      console.log(doc.colNames);
      doc.colNames.forEach(chat => {
        let usr = Object.keys(chat)[0];
        console.log("\x1b[32mUSR: " + usr + "\x1b[37m");
        CLIENTS.forEach(e => {
          console.log("e[1]: " + e[1]);
          if (e[1] === usr) {
            if (e[0].readyState === 1) {
              e[0].send(
                JSON.stringify({
                  statusChange: true,
                  name,
                  status: "offline",
                  lol: "kek"
                })
              );
            }
          }
        });
      });
    });
    ws.close();
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
  if (CLIENTS.length > 0) {
    for (let i = 0; i < CLIENTS.length; i++) {
      if (CLIENTS[i][0].readyState === 1) {
        CLIENTS[i][0].send(message);
      }
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

function chat(name1, name2, conID) {
  let colName = getColName(name1, name2);
  console.log({ name1, name2, conID });
  db.listCollections().toArray((err, items) => {
    if (err) throw err;

    let flag = false;

    items.forEach(e => {
      // IF THERE IS SUCH A CHAT
      if (e.name === colName) {
        console.log("THERE IS SUCH A CHAT");
        flag = true;

        db.collection(colName)
          .find({})
          .forEach(msg => {
            if (CLIENTS[conID][0].readyState === 1) {
              console.log("\x1b[32mSending");
              console.log(msg);
              CLIENTS[conID][0].send(JSON.stringify(msg));
            }
          });
      } else {
      }
    });
    if (!flag) {
      console.log("if (!flag) WORKED");
      // IF THERE WAS NO SUCH CHAT
      db.createCollection(
        getColName(name1, name2),
        { strict: true },
        (error, collection) => {
          if (error) throw error;
          // IF THERE EXISTS SUCH A CHAT / ELSE
          collection.insertOne(
            {
              _id: new ObjectID(),
              name: name1,
              val: "start",
              time: "0"
            },
            (err, res) => {
              if (err) throw err;
            }
          );
        }
      ); // HEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEERRRRRRRRRRRRRREEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
      let b = {};
      b[name1] = name1;
      let k = {};
      k[name2] = name2;
      db.collection("users").updateOne(
        { name: name1 },
        { $push: { colNames: k } },
        (err, res) => {
          if (err) throw err;
          console.log("updated1");
        }
      );
      db.collection("users").updateOne(
        { name: name2 },
        { $push: { colNames: b } },
        (err, res) => {
          if (err) throw err;
          console.log("updated2");
        }
      );
    }
  });
}

function sendToUser(message) {
  message = JSON.parse(message);
  if (message.sentTo) {
    db.collection(getColName(message.sentTo, message.name)).insertOne(
      message,
      (err, res) => {
        if (err) throw err;
        message["_id"] = res.insertedId;

        CLIENTS.forEach(usr => {
          if (usr[1] === message.sentTo && usr[0].readyState === 1) {
            usr[0].send(JSON.stringify(message));
            console.log(message.name + " SENT TO " + message.sentTo + " THIS:");
            console.log(message);
          }
        });

        CLIENTS.forEach(usr => {
          if (usr[1] === message.name && usr[0].readyState === 1) {
            console.log(
              "Sent back to the sender: " + message.name + " " + usr[1]
            );
            usr[0].send(JSON.stringify(message));
          }
        });
      }
    );
  } else {
    console.log("nobody to send to...");
  }
}

function getColName(s1, s2) {
  if (s1 === s2) {
    return s1 + "__" + s2;
  } else {
    for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
      if (s1.charCodeAt(i) > s2.charCodeAt(i)) {
        return s1 + "__" + s2;
      } else if (s1.charCodeAt(i) === s2.charCodeAt(i)) {
        continue;
      } else {
        return s2 + "__" + s1;
      }
    }
  }
}
