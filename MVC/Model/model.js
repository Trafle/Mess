const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  colNames: {
    type: Object,
    required: true,
    default: [{ messages: "messages" }]
  }
});

module.exports = mongoose.model("user", userSchema);
