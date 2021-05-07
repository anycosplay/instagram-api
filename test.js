const { InstagramAPI } = require("./dist/main");

// https://www.instagram.com/p/CMf29lRF52W/
const code = "CNl2AiUHlYM";

InstagramAPI.get(code).then((result) => {
  console.log(result);
});
