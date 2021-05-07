const { InstagramAPI } = require("./dist/main");

// https://www.instagram.com/p/CMf29lRF52W/
const code = "COjeb41hb17";

InstagramAPI.get(code).then((result) => {
  console.log(result);
});
