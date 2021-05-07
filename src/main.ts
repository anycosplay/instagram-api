import * as https from "https";

export class InstagramAPI {
  constructor() {}

  static async get(code) {
    if (!code) {
      throw new Error("Post code is required.");
    }

    if (!code.match(/^[a-zA-Z0-9_-]*$/gi)) {
      throw new Error("Invalid post code.");
    }

    const htmlPage = await this.sendHttpRequest(this.getEmbedUrl(code));
    const regexResults = /window\.__additionalDataLoaded\('extra',(.*?)\);<\/script>/gs.exec(
      htmlPage
    );
    const additionalData = JSON.parse(regexResults[1]);

    if (!regexResults) {
      throw new Error("Regex failed! Could not get additional data");
    }

    if (additionalData) {
      return this.mapAdditionalData(additionalData);
    }

    return this.mapHtmlPage(htmlPage);
  }

  static mapAdditionalData(data) {
    const media = data.shortcode_media;

    return {
      id: media.id,
      code: media.shortcode,
      is_video: media.is_video,
      url: media.video_url || media.display_url,
      caption: media.edge_media_to_caption
        ? media.edge_media_to_caption.edges[0].node.text
        : undefined,
      children: media.edge_sidecar_to_children
        ? this.mapPostChildren(media.edge_sidecar_to_children.edges)
        : [],
    };
  }
  x;

  static mapPostChildren(children) {
    return children.map(function (edge) {
      return {
        id: edge.node.id,
        code: edge.node.shortcode,
        is_video: edge.node.is_video,
        url: edge.node.video_url || edge.node.display_url,
      };
    });
  }

  static async mapHtmlPage(html) {
    const regexMediaIdResult = /data-media-id="(.*?)"/gs.exec(html);
    const regexCodeResult = /instagram\.com\/p\/(.*?)\//gs.exec(html);
    const regexUrlResult = /class="Content(.*?)src="(.*?)"/gs.exec(html);
    let caption;

    if (!regexMediaIdResult) {
      throw new Error("Could not extract post media id");
    }

    if (!regexCodeResult) {
      throw new Error("Could not extract post code");
    }

    if (!regexUrlResult) {
      throw new Error("Could not extract post url");
    }

    const regexCaptionResult = /class="Caption"(.*?)class="CaptionUsername"(.*?)<\/a>(.*?)<div/gs.exec(
      html
    );
    const regexMediaTypeResult = /data-media-type="(.*?)"/gs.exec(html);
    const regexVideoUrlResult = /property="og:video" content="(.*?)"/.exec(
      await this.sendHttpRequest(this.getReelUrl(regexCodeResult[1]))
    );

    if (regexCaptionResult) {
      caption = regexCaptionResult[3].replace(/<[^>]*>/g, "").trim();
    }

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
