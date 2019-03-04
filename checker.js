"use strict";
function textify(msg) {
  let i = 25;
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
        spl.splice(i + 12, 0, "\n");
      }
    }
    i += 25;
  }
  return spl.join("");
}

console.log(
  textify(
    "This is an array of dohuiaasojdsdafadsfasdfasdfadfssl;dfgml;sfdkgl;sdfdp symbols and we hope we get it ok cz we need it"
  )
);
