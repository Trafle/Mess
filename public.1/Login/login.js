$(document).ready(function() {
  $("#mainForm").submit(() => {
    const name = $("#username")
      .val()
      .trim();
    const password = $("#password")
      .val()
      .trim();

    const data = { name, password }; //asd

    if (/[<>/\\!^*$]/g.test(name)) {
      alert("please, don't use symbols like \" ' < > / \\ ! ^ * $ in the name");
    } else {
      $.post("/submitLogin", data, (result, status) => {
        console.log("User data is being checked...");
        console.dir(result);
        if (result === "this user already exists") {
          alert(result + ". You should now sign In");
        } else {
          alert("You are successfully signed Up");
          window.location = "/";
        }
      });
    }
    $("#username").val("");
    $("#password").val("");
    $("#username").focus();

    return false;
  });
});
