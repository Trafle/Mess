const express = require("express");
const path = require("path");
const PORT = process.env.PORT || 5000;
const http = require("http");
const ws = require("ws");
const bodyParser = require("body-parser");

global.appRoot = path.resolve(__dirname);
const app = express();

app
  .use(express.static(__dirname))
  .use(express.json())
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .set("views", __dirname + "/views")
  .set("view engine", "ejs");

app
  .use(express.static(__dirname + "/public.1/Login"))
  .use(express.static(__dirname + "/public.1/Messenger"))
  .use(express.static(__dirname + "/public.1/dbPage"));

const server = http.createServer(app);

const wss = new ws.Server({ server });

const wsRoute = require("./MVC/Router/ws.js");
wsRoute(wss);

const router = require("./MVC/Router/router.js");
router(app);

server.listen(PORT, () => {
  console.log("listening on the port " + PORT);
});
