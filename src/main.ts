import * as https from "https";

export class InstagramAPI {
  constructor() {}

  async get(code) {
    try {
      if (!code) {
        throw new Error("Post code is required.");
      }

      if (!code.match(/^[a-zA-Z0-9_-]*$/gi)) {
        throw new Error("Invalid post code.");
      }

      const htmlPage = await this.httpGet(this.getEmbedUrl(code));
      const regexResults = /window\.__additionalDataLoaded\('extra',(.*?)\);<\/script>/gs.exec(
        htmlPage
      );

      if (!regexResults) {
        throw new Error("Regex failed! Could not get additional data");
      }

      const additionalData = JSON.parse(regexResults[1]);

      if (additionalData) {
        return this.mapAdditionalData(additionalData);
      }

      return this.mapHtmlPage(htmlPage);
    } catch (err) {
      console.log(err);
    }
  }

  mapAdditionalData(data) {
    return {
      id: data.shortcode_media.id,
      code: data.shortcode_media.shortcode,
      is_video: data.shortcode_media.is_video,
      url: data.shortcode_media.video_url || data.shortcode_media.display_url,
      caption: data.shortcode_media.edge_media_to_caption
        ? data.shortcode_media.edge_media_to_caption.edges[0].node.text
        : undefined,
      children: data.shortcode_media.edge_sidecar_to_children
        ? this.mapPostChildren(
            data.shortcode_media.edge_sidecar_to_children.edges
          )
        : [],
    };
  }

  mapPostChildren(children) {
    return children.map(function (edge) {
      return {
        id: edge.node.id,
        code: edge.node.shortcode,
        is_video: edge.node.is_video,
        url: edge.node.video_url || edge.node.display_url,
      };
    });
  }

  async mapHtmlPage(html) {
    const regexMediaIdResult = /data-media-id="(.*?)"/gs.exec(html);

    if (!regexMediaIdResult) {
      throw new Error("Could not extract post media id");
    }

    const regexCodeResult = /instagram\.com\/p\/(.*?)\//gs.exec(html);

    if (!regexCodeResult) {
      throw new Error("Could not extract post code");
    }

    const regexUrlResult = /class="Content(.*?)src="(.*?)"/gs.exec(html);

    if (!regexUrlResult) {
      throw new Error("Could not extract post url");
    }

    const regexCaptionResult = /class="Caption"(.*?)class="CaptionUsername"(.*?)<\/a>(.*?)<div/gs.exec(
      html
    );
    const regexMediaTypeResult = /data-media-type="(.*?)"/gs.exec(html);
    const regexVideoUrlResult = /property="og:video" content="(.*?)"/.exec(
      await this.httpGet(this.getReelUrl(regexCodeResult[1]))
    );
    let caption = "";

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

  getEmbedUrl(postCode) {
    return `https://www.instagram.com/p/${postCode}/embed/captioned/`;
  }

  getReelUrl(postCode) {
    return `https://www.instagram.com/reel/${postCode}/`;
  }

  async httpGet(url): Promise<string> {
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
