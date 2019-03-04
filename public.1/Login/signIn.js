$(document).ready(function() {
  $("#mainForm").submit(() => {
    const name = $("#username").val();
    const password = $("#password").val();

    if (name && password) {
      const data = { name, password };

      console.log("User data is being checked...");

      $.post("/signIn", data, (result, status) => {
        console.dir(result);
        if (result === "no such user") {
          alert(result);
          $("#username").val("");
          $("#password").val("");
          $("#username").focus();
        } else {
          alert("Sign in successful"); //yep
          window.location = "/";
        }
      });

      return false;
    } else {
      return false;
    }
  });
});
