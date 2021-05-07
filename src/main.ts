import * as https from "https";

import {
  InstagramAdditionalDataResponse,
  InstagramPostResponse,
  InstagramPostChild,
  InstagramAdditionalDataChildren,
} from "./types";

export class InstagramAPI {
  static async get(code): Promise<InstagramPostResponse> {
    if (!code) {
      throw new Error("Post code is required.");
    }

    if (!code.match(/^[a-zA-Z0-9_-]*$/gi)) {
      throw new Error("Invalid post code.");
    }

    const htmlPage = await InstagramAPI.sendHttpRequest(
      InstagramAPI.getEmbedUrl(code)
    );

    const regexResults = /window\.__additionalDataLoaded\('extra',(.*?)\);<\/script>/gs.exec(
      htmlPage
    );
    const additionalData = JSON.parse(regexResults[1]);

    if (!regexResults) {
      throw new Error("Regex failed! Could not get additional data");
    }

    if (additionalData) {
      return InstagramAPI.mapAdditionalData(additionalData);
    }

    return InstagramAPI.mapHtmlPage(htmlPage);
  }

  static mapAdditionalData(
    data: InstagramAdditionalDataResponse
  ): InstagramPostResponse {
    const media = data.shortcode_media;

    return {
      // type: media.__typename,
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
  }
  x;

  static mapPostChildren(
    children: InstagramAdditionalDataChildren[]
  ): InstagramPostChild[] {
    return children.map(function (edge) {
      return {
        // type: edge.node.__typename,
        id: edge.node.id,
        code: edge.node.shortcode,
        is_video: edge.node.is_video,
        url: edge.node.video_url || edge.node.display_url,
      };
    });
  }

  static async mapHtmlPage(html) {
    /**
     * Extract id
     */
    const regexMediaIdResult = /data-media-id="(.*?)"/gs.exec(html);

    if (!regexMediaIdResult) {
      throw new Error("Could not extract post media id");
    }

    /**
     * Extract code
     */
    const regexCodeResult = /instagram\.com\/p\/(.*?)\//gs.exec(html);

    if (!regexCodeResult) {
      throw new Error("Could not extract post code");
    }

    /**
     * Extract url
     */
    const regexUrlResult = /class="Content(.*?)src="(.*?)"/gs.exec(html);

    if (!regexUrlResult) {
      throw new Error("Could not extract post url");
    }

    /**
     * Extract caption
     */
    let caption;
    const regexCaptionResult = /class="Caption"(.*?)class="CaptionUsername"(.*?)<\/a>(.*?)<div/gs.exec(
      html
    );
    /**
     * Replace all html tags and trim the result
     */
    if (regexCaptionResult) {
      caption = regexCaptionResult[3].replace(/<[^>]*>/g, "").trim();
    }

    /**
     * If the media type is not reel video, return the photo
     */
    const regexMediaTypeResult = /data-media-type="(.*?)"/gs.exec(html);

    if (regexMediaTypeResult && regexMediaTypeResult[1] !== "GraphVideo") {
      return {
        id: regexMediaIdResult[1],
        code: regexCodeResult[1],
        is_video: false,
        url: decodeURI(regexUrlResult[2]).replace(/amp;/g, ""),
        caption,
        children: [],
      };
    }

    /**
     * Request to fetch reel video url
     */
    const regexVideoUrlResult = /property="og:video" content="(.*?)"/.exec(
      await InstagramAPI.sendHttpRequest(
        InstagramAPI.getReelUrl(regexCodeResult[1])
      )
    );

    if (!regexVideoUrlResult) {
      throw new Error("Could not fetch reel video url");
    }
    return {
      id: regexMediaIdResult[1],
      code: regexCodeResult[1],
      is_video: true,
      url: regexVideoUrlResult[1],
      caption,
      children: [],
    };
  }

  static getEmbedUrl(postCode) {
    return `https://www.instagram.com/p/${postCode}/embed/captioned/`;
  }

  static getReelUrl(postCode) {
    return `https://www.instagram.com/reel/${postCode}/`;
  }

  static async sendHttpRequest(url): Promise<string> {
    return new Promise(function (resolve, reject) {
      https
        .get(url, function (response) {
          let data: string = "";

          response.on("data", function (chunk: string) {
            data = data + chunk;
          });

          response.on("end", () => {
            return resolve(data);
          });
        })
        .on("error", (error) => {
          return reject(error);
        });
    });
  }
}
