"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstagramAPI = void 0;
var https = require("https");
var InstagramAPI = (function () {
    function InstagramAPI() {
    }
    InstagramAPI.get = function (code) {
        return __awaiter(this, void 0, void 0, function () {
            var htmlPage, regexResults, additionalData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!code) {
                            throw new Error("Post code is required.");
                        }
                        if (!code.match(/^[a-zA-Z0-9_-]*$/gi)) {
                            throw new Error("Invalid post code.");
                        }
                        return [4, InstagramAPI.sendHttpRequest(InstagramAPI.getEmbedUrl(code))];
                    case 1:
                        htmlPage = _a.sent();
                        regexResults = /window\.__additionalDataLoaded\('extra',(.*?)\);<\/script>/gs.exec(htmlPage);
                        additionalData = JSON.parse(regexResults[1]);
                        if (!regexResults) {
                            throw new Error("Regex failed! Could not get additional data");
                        }
                        if (additionalData) {
                            return [2, InstagramAPI.mapAdditionalData(additionalData)];
                        }
                        return [2, InstagramAPI.mapHtmlPage(htmlPage)];
                }
            });
        });
    };
    InstagramAPI.mapAdditionalData = function (data) {
        var media = data.shortcode_media;
        return {
            id: media.id,
            code: media.shortcode,
            is_video: media.is_video,
            url: media.video_url || media.display_url,
            caption: media.edge_media_to_caption
                ? media.edge_media_to_caption.edges[0].node.text
                : undefined,
            children: media.edge_sidecar_to_children
                ? InstagramAPI.mapPostChildren(media.edge_sidecar_to_children.edges)
                : [],
        };
    };
    InstagramAPI.mapPostChildren = function (children) {
        return children.map(function (edge) {
            return {
                id: edge.node.id,
                code: edge.node.shortcode,
                is_video: edge.node.is_video,
                url: edge.node.video_url || edge.node.display_url,
            };
        });
    };
    InstagramAPI.mapHtmlPage = function (html) {
        return __awaiter(this, void 0, void 0, function () {
            var regexMediaIdResult, regexCodeResult, regexUrlResult, caption, regexCaptionResult, regexMediaTypeResult, regexVideoUrlResult, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        regexMediaIdResult = /data-media-id="(.*?)"/gs.exec(html);
                        if (!regexMediaIdResult) {
                            throw new Error("Could not extract post media id");
                        }
                        regexCodeResult = /instagram\.com\/p\/(.*?)\//gs.exec(html);
                        if (!regexCodeResult) {
                            throw new Error("Could not extract post code");
                        }
                        regexUrlResult = /class="Content(.*?)src="(.*?)"/gs.exec(html);
                        if (!regexUrlResult) {
                            throw new Error("Could not extract post url");
                        }
                        regexCaptionResult = /class="Caption"(.*?)class="CaptionUsername"(.*?)<\/a>(.*?)<div/gs.exec(html);
                        if (regexCaptionResult) {
                            caption = regexCaptionResult[3].replace(/<[^>]*>/g, "").trim();
                        }
                        regexMediaTypeResult = /data-media-type="(.*?)"/gs.exec(html);
                        if (regexMediaTypeResult && regexMediaTypeResult[1] !== "GraphVideo") {
                            return [2, {
                                    id: regexMediaIdResult[1],
                                    code: regexCodeResult[1],
                                    is_video: false,
                                    url: decodeURI(regexUrlResult[2]).replace(/amp;/g, ""),
                                    caption: caption,
                                    children: [],
                                }];
                        }
                        _b = (_a = /property="og:video" content="(.*?)"/).exec;
                        return [4, InstagramAPI.sendHttpRequest(InstagramAPI.getReelUrl(regexCodeResult[1]))];
                    case 1:
                        regexVideoUrlResult = _b.apply(_a, [_c.sent()]);
                        if (!regexVideoUrlResult) {
                            throw new Error("Could not fetch reel video url");
                        }
                        return [2, {
                                id: regexMediaIdResult[1],
                                code: regexCodeResult[1],
                                is_video: true,
                                url: regexVideoUrlResult[1],
                                caption: caption,
                                children: [],
                            }];
                }
            });
        });
    };
    InstagramAPI.getEmbedUrl = function (postCode) {
        return "https://www.instagram.com/p/" + postCode + "/embed/captioned/";
    };
    InstagramAPI.getReelUrl = function (postCode) {
        return "https://www.instagram.com/reel/" + postCode + "/";
    };
    InstagramAPI.sendHttpRequest = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, new Promise(function (resolve, reject) {
                        https
                            .get(url, function (response) {
                            var data = "";
                            response.on("data", function (chunk) {
                                data = data + chunk;
                            });
                            response.on("end", function () {
                                return resolve(data);
                            });
                        })
                            .on("error", function (error) {
                            return reject(error);
                        });
                    })];
            });
        });
    };
    return InstagramAPI;
}());
exports.InstagramAPI = InstagramAPI;
