$(document).ready(() => {
  list();
  $("#fm").submit(() => {
    const key = $("#key").val();
    const val = $("#val").val();

    if (key === "" || val === "") {
      return false;
    }

    const data = {};

    data[key] = val;

    $.post("/", data, (result, status) => {
      console.log("status: " + status + "\n We hope we did it");
      console.log(data);
    });

    $("#key").val("");
    $("#val").val("");
    $("#key").focus();
    list();
    return false;
  });
});

function list() {
  $.get("allElements", (data, status) => {
    $("#list")
      .children()
      .remove();

    data.forEach(doc => {
      let props = "";
      for (let key in doc) {
        props += key + ": ";
        props += doc[key] + ", ";
      }

      $("#list").append("<li>" + props + "</li>");
      return false;
    });
  });
}
