#!/usr/bin/env node

const { InstagramAPI } = require("../dist/main");

// https://www.instagram.com/p/COjeb41hb17/
const code = "COjeb41hb17";

let instagramAPI = new InstagramAPI();

instagramAPI.get(code).then(function (result) {
  console.log(result);
});
