"use strict";

const namey = $.cookie("name");

let edit = 0;
let address = 0;

$(document).ready(() => {
  // cache.set("lorem", "ipsum", 60000);
  // console.log(cache.get("lorem"));

  $(".attach_btn").click(() => {});

  let conID = 0;
  const name = $.cookie("name");
  $("#msgText")
    .val("")
    .focus();

  const ws = new WebSocket("wss://cooooliioooo.herokuapp.com");

  ws.onopen = () => {
    ws.send("connected");
    console.log("open ws");
  };

  ws.onmessage = data => {
    const dat = JSON.parse(data.data);
    // console.dir(dat);
    if (dat.counter === 0 || dat.counter) {
      conID = dat.counter;
      console.log("conID == " + conID);
    } else if (dat.ping === "ping") {
      ws.send("pong");
    } else if (dat.id && dat.change !== undefined) {
      console.log("mi tut");
      $("#msgs")
        .find($("#" + dat.id))
        .children(".msg_cotainer")
        .children("text")
        .text(dat.change);
      $("#msgs");
    } else {
      switch (dat.val) {
        case "User connected": {
          console.log("User connected"); //these two are server-only exceptions
          break;
        }

        case "User disconnected": {
          console.log("User disconnected");
          break;
        }

        default: {
          // console.log("the default here");

          printOut(dat);
          cache.set(dat["_id"], JSON.stringify(dat));
        }
      }
    }
  };

  ws.onclose = () => {
    ws.send("shit, closed");
    ws.close();
  };

  $("#messageForm").submit(e => {
    e.preventDefault();

    let time = getTime();

    const val = $("#msgText")
      .val()
      .toString()
      .trim()
      .replace(/>/g, "\\>");

    if (val !== "") {
      if (edit && address) {
        $(`#${address}`)
          .children(".msg_cotainer_send")
          .children("text")
          .text(val);
        ws.send(JSON.stringify({ change: val, id: address }));
        $(`#${address}`)
          .children(".msg_cotainer_send")
          .css("background-color", "#78e08f");
        edit = 0;
        address = 0;
        console.log("edit set to: " + edit);
        console.log("address set to: " + address);
        $("#msgText")
          .val("")
          .focus();
        // KILL THE LAST DIV ELEMENT OF #msgs
        $("#change").remove();
        return false;
      } else {
        ws.send(JSON.stringify({ val, name, time }));

        return false;
      }
    } else {
      $("#msgText")
        .val("")
        .focus();

      return false;
    }
  });
}); // THE END OF DOCUMENT.READY()

function say() {
  console.log("ok");
  return false;
}

function printOut(dat) {
  if (dat.name === $.cookie("name")) {
    $("#msgs").append(
      $(
        '<div id="' +
          dat["_id"] +
          '" class="d-flex justify-content-end mb-4">' +
          '<div class="mes msg_cotainer_send"><text>' +
          textify(dat.val) +
          '</text><span class= "msg_time_send" >' +
          dat.time +
          '</span ></div ><div class="img_cont_msg"><img src="https://www.facephi.com/uploads/imagenes/paginas/galeria/201607/galeria-me.png"class="rounded-circle user_img_msg"/><div class="edit">edit</div></div></div>'
      )
    );
    $("#msgs")
      .find($(`#${dat["_id"]}`))
      .children(".img_cont_msg")
      .children("div")
      .click(() => {
        if (edit) {
          $(`#${address}`)
            .children(".msg_cotainer_send")
            .css("background-color", "#78e08f");
          $("#change").remove();
        }
        edit = 1;
        address = dat["_id"];

        let message = $(`#${address}`) //taking the value to $message
          .children(".msg_cotainer_send")
          .css("background-color", "#b4ffc4")
          .children("text")
          .text();

        console.log("edit set to: " + edit);
        console.log("address set to: " + address);
        console.log("Editing a message...");

        $("#msgText")
          .val(message)
          .focus();

        $("#msgs").after(
          '<div id="change"><p class="change">' +
            message.substring(0, 100) +
            "...</p></div>"
        );

        // $("#msgs").scrollTop($("#msgs")[0].scrollHeight);
        return false;
      });

    $("#msgText")
      .val("")
      .focus();

    $("#msgs").scrollTop($("#msgs")[0].scrollHeight);
  } else {
    $("#msgs").append(
      $(
        '<div id="' +
          dat["_id"] +
          '" class="d-flex justify-content-start mb-4">' +
          '<div class="img_cont_msg">' +
          '<img src="https://scontent.fdnk1-1.fna.fbcdn.net/v/t1.0-9/14495295_184976548596176_4973533060545737799_n.png?_nc_cat=104&_nc_ht=scontent.fdnk1-1.fna&oh=312abdec8c94d604abcebfb5e49a5399&oe=5D245688" class="rounded-circle user_img_msg"/></div>' +
          '<div class="msg_cotainer"><text>' +
          textify(dat.val) +
          '</text><span class= "msg_time" ><div class="time">' +
          dat.time +
          "</div>" +
          " " +
          '<div class="name">' +
          dat.name +
          "</div>" +
          "</span ></div >"
      )
    );
    $("#msgs").scrollTop($("#msgs")[0].scrollHeight);
  }
  return false;
}

function getTime() {
  let now = new Date();
  let minutes =
    now.getMinutes() < 10 ? "0" + now.getMinutes() : now.getMinutes();
  let hours = now.getHours() < 10 ? "0" + now.getHours() : now.getHours();
  const time = hours + ":" + minutes;
  return time;
}

function textify(msg) {
  let i = 55;
  let spl = msg.split("");
  while (i < msg.length) {
    let y = 0;
    for (let k = 0; k < 8; k++) {
      if (spl[i - k] === " ") {
        spl.splice(i - k, 1, "\n");
        let y = 1;
        break;
      } else if (spl[i + k] === " ") {
        spl.splice(i + k, 1, "\n");
        let y = 1;
        break;
      }
      if (k === 7) {
        spl.splice(i, 0, "\n");
      }
    }
    i += 55;
  }
  return spl.join("");
}

function dropHandler(ev) {
  console.log("File(s) dropped");

  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();

  if (ev.dataTransfer.items) {
    // Use DataTransferItemList interface to access the file(s)
    for (var i = 0; i < ev.dataTransfer.items.length; i++) {
      // If dropped items aren't files, reject them
      if (ev.dataTransfer.items[i].kind === "file") {
        var file = ev.dataTransfer.items[i].getAsFile();
        console.log("... file[" + i + "].name = " + file.name);
      }
    }
  } else {
    // Use DataTransfer interface to access the file(s)
    for (var i = 0; i < ev.dataTransfer.files.length; i++) {
      console.log(
        "... file[" + i + "].name = " + ev.dataTransfer.files[i].name
      );
    }
  }
}

// 27.02.2019 - first trial version // At the noon i thought it would take me 4 days more to accomplish
// 28.02.2019 - added the "edit" button, textify function // Took me about 6-8 hours
