import config from "../Config/url.config.json";
import { send, copyTextToClipboard } from "../Sevices/common";
import { DeviceUUID } from "device-uuid";
import moment from "moment";
const API_KEY = {
  "x-api-key": config.ACCESS_TOKEN
};

function generateDeviceIDDay() {
  const du = new DeviceUUID().parse();
  const dua = [
    du.language,
    du.platform,
    du.os,
    du.cpuCores,
    du.isAuthoritative,
    du.silkAccelerated,
    du.isKindleFire,
    du.isDesktop,
    du.isMobile,
    du.isTablet,
    du.isWindows,
    du.isLinux,
    du.isLinux64,
    du.isMac,
    du.isiPad,
    du.isiPhone,
    du.isiPod,
    du.isSmartTV,
    du.pixelDepth,
    du.isTouchScreen,
    moment().dayOfYear()
  ];
  return du.hashMD5(dua.join(":"));
}

const correlationId = generateDeviceIDDay();

export function getCorrelationId() {
  return correlationId;
}

export async function getUsersSession(sessionId) {
  return send(
    `${config.CHAT_BASE_URL}/user?session=${sessionId}`,
    "GET",
    API_KEY
  ).then(data => data.users);
}

export async function getSession(sessionId, username) {
  return sessionId
    ? send(
        `${
          config.CHAT_BASE_URL
        }/chat?session=${sessionId}&correlationId=${correlationId}${
          username ? `&username=${username}` : ""
        }`,
        "GET",
        API_KEY
      )
    : send(
        `${
          config.CHAT_BASE_URL
        }/chat?new-session=true&correlationId=${correlationId}${
          username ? `&username=${username}` : ""
        }`,
        "GET",
        API_KEY
      );
}

export async function performSend(newMessage) {
  return send(`${config.CHAT_BASE_URL}/chat`, "POST", API_KEY, newMessage).then(
    data => JSON.parse(data.messages).messages
  );
}

export function buildChatLink(sessionId, nickname) {
  return `www.synaren.com/synaren-chat/chat?session=${sessionId}${
    nickname ? `&nickname=${nickname}` : ""
  }`;
}

export function shareLink(sessionId, nickname) {
  return copyTextToClipboard(buildChatLink(sessionId, nickname));
}
