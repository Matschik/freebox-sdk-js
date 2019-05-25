const axios = require("axios");
const https = require("https");
const { createHmac } = require("crypto");

const FREEBOX_LOCAL_URL = "https://mafreebox.freebox.fr";

// HTTPS Access: https://dev.freebox.fr/sdk/os/#https-access
const FREEBOX_ROOT_CA = `
-----BEGIN CERTIFICATE-----
MIIFmjCCA4KgAwIBAgIJAKLyz15lYOrYMA0GCSqGSIb3DQEBCwUAMFoxCzAJBgNV
BAYTAkZSMQ8wDQYDVQQIDAZGcmFuY2UxDjAMBgNVBAcMBVBhcmlzMRAwDgYDVQQK
DAdGcmVlYm94MRgwFgYDVQQDDA9GcmVlYm94IFJvb3QgQ0EwHhcNMTUwNzMwMTUw
OTIwWhcNMzUwNzI1MTUwOTIwWjBaMQswCQYDVQQGEwJGUjEPMA0GA1UECAwGRnJh
bmNlMQ4wDAYDVQQHDAVQYXJpczEQMA4GA1UECgwHRnJlZWJveDEYMBYGA1UEAwwP
RnJlZWJveCBSb290IENBMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA
xqYIvq8538SH6BJ99jDlOPoyDBrlwKEp879oYplicTC2/p0X66R/ft0en1uSQadC
sL/JTyfgyJAgI1Dq2Y5EYVT/7G6GBtVH6Bxa713mM+I/v0JlTGFalgMqamMuIRDQ
tdyvqEIs8DcfGB/1l2A8UhKOFbHQsMcigxOe9ZodMhtVNn0mUyG+9Zgu1e/YMhsS
iG4Kqap6TGtk80yruS1mMWVSgLOq9F5BGD4rlNlWLo0C3R10mFCpqvsFU+g4kYoA
dTxaIpi1pgng3CGLE0FXgwstJz8RBaZObYEslEYKDzmer5zrU1pVHiwkjsgwbnuy
WtM1Xry3Jxc7N/i1rxFmN/4l/Tcb1F7x4yVZmrzbQVptKSmyTEvPvpzqzdxVWuYi
qIFSe/njl8dX9v5hjbMo4CeLuXIRE4nSq2A7GBm4j9Zb6/l2WIBpnCKtwUVlroKw
NBgB6zHg5WI9nWGuy3ozpP4zyxqXhaTgrQcDDIG/SQS1GOXKGdkCcSa+VkJ0jTf5
od7PxBn9/TuN0yYdgQK3YDjD9F9+CLp8QZK1bnPdVGywPfL1iztngF9J6JohTyL/
VMvpWfS/X6R4Y3p8/eSio4BNuPvm9r0xp6IMpW92V8SYL0N6TQQxzZYgkLV7TbQI
Hw6v64yMbbF0YS9VjS0sFpZcFERVQiodRu7nYNC1jy8CAwEAAaNjMGEwHQYDVR0O
BBYEFD2erMkECujilR0BuER09FdsYIebMB8GA1UdIwQYMBaAFD2erMkECujilR0B
uER09FdsYIebMA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0PAQH/BAQDAgGGMA0GCSqG
SIb3DQEBCwUAA4ICAQAZ2Nx8mWIWckNY8X2t/ymmCbcKxGw8Hn3BfTDcUWQ7GLRf
MGzTqxGSLBQ5tENaclbtTpNrqPv2k6LY0VjfrKoTSS8JfXkm6+FUtyXpsGK8MrLL
hZ/YdADTfbbWOjjD0VaPUoglvo2N4n7rOuRxVYIij11fL/wl3OUZ7GHLgL3qXSz0
+RGW+1oZo8HQ7pb6RwLfv42Gf+2gyNBckM7VVh9R19UkLCsHFqhFBbUmqwJgNA2/
3twgV6Y26qlyHXXODUfV3arLCwFoNB+IIrde1E/JoOry9oKvF8DZTo/Qm6o2KsdZ
dxs/YcIUsCvKX8WCKtH6la/kFCUcXIb8f1u+Y4pjj3PBmKI/1+Rs9GqB0kt1otyx
Q6bqxqBSgsrkuhCfRxwjbfBgmXjIZ/a4muY5uMI0gbl9zbMFEJHDojhH6TUB5qd0
JJlI61gldaT5Ci1aLbvVcJtdeGhElf7pOE9JrXINpP3NOJJaUSueAvxyj/WWoo0v
4KO7njox8F6jCHALNDLdTsX0FTGmUZ/s/QfJry3VNwyjCyWDy1ra4KWoqt6U7SzM
d5jENIZChM8TnDXJzqc+mu00cI3icn9bV9flYCXLTIsprB21wVSMh0XeBGylKxeB
S27oDfFq04XSox7JM9HdTt2hLK96x1T7FpFrBTnALzb7vHv9MhXqAT90fPR/8A==
-----END CERTIFICATE-----
`;

class FreeboxRegister {
  constructor({
    app_id,
    app_name,
    app_version = "1.0.0",
    device_name = "NodeJS",
  } = {}) {
    // Generate defaults required
    const suffixId = `_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    if (!app_name && !app_id) {
      app_name = `nodejs_app${suffixId}`;
      app_id = `fbx.${app_name}`;
    }

    if (app_name && !app_id) {
      app_id = `fbx.${app_name}${suffixId}`;
    }

    if (!app_name && app_id) {
      app_name = `${app_id}${suffixId}`;
    }
    this.appIdentity = { app_id, app_name, app_version, device_name };
    this.baseURL = FREEBOX_LOCAL_URL;
    this.baseAPIURL;
    this.axiosInstance = axios.create({
      httpsAgent: new https.Agent({
        ca: FREEBOX_ROOT_CA,
      }),
    });
  }

  async register({ silent = false } = {}) {
    let discoveryRes;
    try {
      discoveryRes = await this.discovery();
    } catch (err) {
      console.error(
        "\x1b[31m%s\x1b[0m",
        `Error: You are probably not connected to your Freebox network (check "${FREEBOX_LOCAL_URL}").`
      );
      throw err;
    }

    const {
      api_domain,
      https_port,
      api_base_url,
      api_version,
    } = discoveryRes.data;

    this.baseAPIURL = `${this.baseURL}${api_base_url}v${api_version
      .slice(0, 1)
      .trim()}`;

    const res = await this.requestAuthorization(this.appIdentity);
    const { app_token, track_id } = res.data.result;

    if (!silent) {
      console.info(
        "\x1b[36m%s\x1b[0m",
        `Please check your Freebox Server LCD screen and authorize application access to register your app.`
      );
    }
    await this.getAuthorizationStatus(track_id);
    const access = {
      app_token,
      app_id: this.appIdentity.app_id,
      api_domain,
      https_port,
      api_base_url,
      api_version,
    };

    if (!silent) {
      console.info(
        "\x1b[32m%s\x1b[0m",
        `Your app has been granted access !\nSave safely those following informations secret to connect to your Freebox API:`
      );
      console.info(access);
    }

    return access;
  }

  async request(requestConfig) {
    return await this.axiosInstance.request(requestConfig);
  }

  async discovery() {
    return await this.request({
      method: "GET",
      baseURL: this.baseURL,
      url: "api_version",
    });
  }

  // Require to be connected to local freebox URL
  async requestAuthorization() {
    return await this.request({
      method: "POST",
      baseURL: this.baseAPIURL,
      url: "login/authorize",
      data: this.appIdentity,
    });
  }

  async getAuthorizationStatus(track_id) {
    const authorizationStatus = {
      unknown: "The app_token is invalid or has been revoked",
      pending: "The user has not confirmed the authorization request yet",
      timeout:
        "The user did not confirmed the authorization within the given time",
      granted: "The app_token is valid and can be used to open a session",
      denied: "The user denied the authorization request",
    };
    const self = this;
    return new Promise(async (resolve, reject) => {
      async function checkTrackAuthorizationProgress() {
        try {
          const response = await self.trackAuthorizationProgress(track_id);
          const { status } = response.data.result;

          if (status === "pending") {
            return true;
          } else if (status === "granted") {
            clearInterval(intervalTrackAuthorizationProgress);
            resolve(true);
          } else {
            clearInterval(intervalTrackAuthorizationProgress);
            const endStatus = response.data.result.status;
            const errData = response.data;
            // @TODO
            reject(
              `${authorizationStatus[endStatus]}: \n ${JSON.stringify(
                errData,
                null,
                2
              )}`
            );
          }
        } catch (err) {
          clearInterval(intervalTrackAuthorizationProgress);
          reject(err);
        }
      }

      const intervalTrackAuthorizationProgress = setInterval(
        checkTrackAuthorizationProgress,
        2 * 1000
      );
    });
  }

  async trackAuthorizationProgress(track_id) {
    if (
      !track_id ||
      (typeof track_id !== "string" && typeof track_id !== "number")
    ) {
      throw new Error("track_id must be a string or a number not null");
    }
    return await this.request({
      method: "GET",
      baseURL: this.baseAPIURL,
      url: `login/authorize/${track_id}`,
    });
  }
}

class Freebox {
  constructor({
    app_token,
    api_domain = FREEBOX_LOCAL_URL,
    https_port,
    api_base_url,
    api_version,
    app_id,
    app_version, // optional to open session
  }) {
    const validationErrors = [];
    if (typeof api_domain !== "string" || app_token.length < 1) {
      validationErrors.push(`api_domain must be a string not empty.`);
    }
    if (typeof app_token !== "string" || app_token.length < 1) {
      validationErrors.push(
        `app_token is required and must be a string not empty.`
      );
    }
    if (typeof api_base_url !== "string" || api_base_url.length < 1) {
      validationErrors.push(
        `api_base_url is required and must be a string not empty`
      );
    }
    if (typeof api_version !== "string" || api_version.length < 1) {
      validationErrors.push(
        `api_version is required and must be a string not empty`
      );
    }
    if (typeof app_id !== "string" || app_id.length < 1) {
      validationErrors.push(
        `app_id is required and must be a string not empty`
      );
    }

    if (validationErrors.length > 0) {
      throw new Error(
        `Validation errors in Freebox constructor args: \n ${JSON.stringify(
          validationErrors,
          null,
          2
        )}`
      );
    }

    this.baseAPIURL = `https://${api_domain}${
      https_port ? ":" + https_port : ""
    }${api_base_url}v${api_version.slice(0, 1).trim()}`;

    this.appToken = app_token;
    this.appVersion = app_version;
    this.appId = app_id;
    this.headers = {};

    this.axiosInstanceCache = null;
  }

  _getAxiosInstance(updateCache = false) {
    if (this.axiosInstanceCache && !updateCache) {
      return this.axiosInstanceCache;
    }
    // Secure HTTPS configuration
    // https://engineering.circle.com/https-authorized-certs-with-node-js-315e548354a2
    const axiosConfig = {
      baseURL: this.baseAPIURL,
      headers: this.headers,
    };
    if (axiosConfig.baseURL.indexOf("https://") > -1) {
      axiosConfig.httpsAgent = new https.Agent({
        ca: FREEBOX_ROOT_CA,
      });
    }
    const axiosInstance = axios.create(axiosConfig);
    this.axiosInstanceCache = axiosInstance;
    return axiosInstance;
  }

  async request(requestConfig) {
    return await this._getAxiosInstance().request(requestConfig);
  }

  async login() {
    const challengeRes = await this.getChallenge();
    const { challenge, logged_in } = challengeRes.data.result;
    const sessionStart = {
      app_id: this.appId,
      app_version: typeof this.appVersion === "string" ? this.appVersion : null, // optional
      password: createHmac("sha1", this.appToken)
        .update(challenge)
        .digest("hex"),
    };
    const openSessionRes = await this.openSession(sessionStart);
    const { session_token, permissions } = openSessionRes.data.result;
    this.headers["X-Fbx-App-Auth"] = session_token;
    this._getAxiosInstance(true); // Must update axios instance cache
  }

  async openSession(sessionStart) {
    return await this.request({
      method: "POST",
      url: "login/session",
      data: sessionStart,
    });
  }

  async getChallenge() {
    return await this.request({
      method: "GET",
      url: "login",
    });
  }

  async logout() {
    return await this.request({
      method: "POST",
      url: "login/logout",
    });
  }
}

module.exports = {
  FreeboxRegister,
  Freebox,
};

module.exports.default = Freebox;
