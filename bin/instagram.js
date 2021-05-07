#!/usr/bin/env node

const { InstagramAPI } = require("../dist/main");

// https://www.instagram.com/p/CMf29lRF52W/
const code = "COKCgQ4goDn";

InstagramAPI.get(code).then((result) => {
  console.log(result);
});
