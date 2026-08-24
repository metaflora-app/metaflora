import { mkdir, chmod } from "node:fs/promises";
import { isAbsolute, join, relative, resolve } from "node:path";

const DEFAULT_PROFILE_DIRECTORY = "hermes-profile";

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function absolutePath(value, label) {
  const normalized = text(value);
  if (!normalized || !isAbsolute(normalized)) {
    throw new TypeError(`${label} must be an absolute path.`);
  }
  return resolve(normalized);
}

function isWithin(parent, candidate) {
  const child = relative(parent, candidate);
  return child === "" || (!child.startsWith("..") && !isAbsolute(child));
}

export function getPersistentBrowserProfileConfig(env = process.env) {
  const volumeMountPath = text(env.RAILWAY_VOLUME_MOUNT_PATH);
  const configuredProfilePath = text(env.HERMES_BROWSER_PROFILE_DIR);
  if (!volumeMountPath && configuredProfilePath) {
    throw new TypeError("HERMES_BROWSER_PROFILE_DIR requires a Railway volume.");
  }
  if (!volumeMountPath) {
    return Object.freeze({
      configured: false,
      persistent: false,
      profileDir: null,
      storage: "ephemeral",
      authorization: "unavailable",
    });
  }

  const mountPath = absolutePath(volumeMountPath, "RAILWAY_VOLUME_MOUNT_PATH");
  const profileDir = configuredProfilePath
    ? absolutePath(configuredProfilePath, "HERMES_BROWSER_PROFILE_DIR")
    : join(mountPath, DEFAULT_PROFILE_DIRECTORY);
  if (!isWithin(mountPath, profileDir)) {
    throw new TypeError("HERMES_BROWSER_PROFILE_DIR must be inside the Railway volume.");
  }

  return Object.freeze({
    configured: true,
    persistent: true,
    profileDir,
    storage: "railway_volume",
    authorization: "required_once",
  });
}

export async function preparePersistentBrowserProfile({
  env = process.env,
  fsImpl = { mkdir, chmod },
} = {}) {
  const config = getPersistentBrowserProfileConfig(env);
  if (!config.configured) {
    return Object.freeze({
      ready: false,
      ...config,
      error: "persistent volume is not configured",
    });
  }
  if (typeof fsImpl?.mkdir !== "function" || typeof fsImpl?.chmod !== "function") {
    throw new TypeError("filesystem adapter must provide mkdir and chmod.");
  }

  try {
    await fsImpl.mkdir(config.profileDir, { recursive: true, mode: 0o700 });
    await fsImpl.chmod(config.profileDir, 0o700);
    return Object.freeze({ ready: true, ...config });
  } catch {
    return Object.freeze({
      ready: false,
      ...config,
      error: "persistent profile directory is unavailable",
    });
  }
}

export function getPersistentBrowserProfileStatus(profileResult) {
  const value = profileResult && typeof profileResult === "object"
    ? profileResult
    : {};
  return Object.freeze({
    persistent: value.persistent === true,
    storage: value.storage === "railway_volume" ? "railway_volume" : "ephemeral",
    ready: value.ready === true,
    authorization: value.authorization === "required_once"
      ? "required_once"
      : "unavailable",
    automation: value.ready === true && value.authorization === "authorized"
      ? "ready"
      : value.ready === true
        ? "blocked_until_authorization"
        : "unavailable",
  });
}

export function createPersistentBrowserSessionService({ profileResult, fundingConnector = null } = {}) {
  const status = getPersistentBrowserProfileStatus(profileResult);
  return Object.freeze({
    async getStatus() {
      let connectorStatus = null;
      if (typeof fundingConnector?.getStatus === "function") {
        try {
          connectorStatus = await fundingConnector.getStatus();
        } catch {
          connectorStatus = { automation: "unavailable", authorization: "unknown" };
        }
      }
      return Object.freeze({
        ...status,
        ...(connectorStatus && typeof connectorStatus === "object" ? {
          authorization: connectorStatus.authorization ?? status.authorization,
          automation: connectorStatus.automation ?? status.automation,
          profileMode: connectorStatus.profileMode ?? "persistent",
          loginPerPayment: connectorStatus.loginPerPayment === false,
        } : {}),
      });
    },
    async beginAuthorization() {
      if (typeof fundingConnector?.beginAuthorization !== "function") {
        throw new Error("browser authorization is not configured");
      }
      return fundingConnector.beginAuthorization();
    },
    async getAuthorizationView(token) {
      if (typeof fundingConnector?.getAuthorizationView !== "function") {
        throw new Error("browser authorization is not configured");
      }
      return fundingConnector.getAuthorizationView(token);
    },
    async authorizationAction(token, action) {
      if (typeof fundingConnector?.authorizationAction !== "function") {
        throw new Error("browser authorization is not configured");
      }
      return fundingConnector.authorizationAction(token, action);
    },
    async completeAuthorization(token) {
      if (typeof fundingConnector?.completeAuthorization !== "function") {
        throw new Error("browser authorization is not configured");
      }
      return fundingConnector.completeAuthorization(token);
    },
    async cancelAuthorization(token) {
      if (typeof fundingConnector?.cancelAuthorization !== "function") {
        throw new Error("browser authorization is not configured");
      }
      return fundingConnector.cancelAuthorization(token);
    },
  });
}
