# Instagram API

## Install

```
npm install https://github.com/anycosplay/instagram-api.git
```

## Usage

```
import InstagramApi from "instagram-api";

// https://www.instagram.com/p/CMf29lRF52W/
const code = "CMf29lRF52W";

InstagramApi.get(code).then((result) => {
  console.log(result);
});
```
