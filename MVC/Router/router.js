"use strict";
module.exports = function(app) {
  const database = require("../Controller/controller.js");
  console.log("in router");

  // database Routes
  app.route("/").get(database.loadPage);

  // app.route("/msg").post(database.msgSent);

  app.route("/login").get(database.loginPageLoad);

  app
    .route("/signIn")
    .get(database.signInPageLoad)
    .post(database.signIn);

  app
    .route("/submitLogin")
    .post(database.loginSubmit)
    .get(database.showUsers);
};
