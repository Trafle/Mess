"use strict";
module.exports = function(wss) {
  const controller = require("../Controller/controller.js");
  console.log("in wss router");

  wss.on("connection", controller.sendmsg);
};
