import config from "../Config/url.config.json";

export async function getSession(sessionId) {
  return (sessionId
    ? send(`${config.CHAT_BASE_URL}?session=${sessionId}`, "GET")
    : send(`${config.CHAT_BASE_URL}?new-session=true`, "GET")
  );
}


export async function performSend(newMessage){
	return send(config.CHAT_BASE_URL, 'POST', undefined, newMessage)
		.then(data => JSON.parse(data.messages).messages);
}

function send(url, method, headers, body) {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    if (headers) {
      Object.keys(headers).forEach(header =>
        xhr.setRequestHeader(header, headers[header])
      );
    }
    xhr.onreadystatechange = function() {
      if (this.readyState === XMLHttpRequest.DONE) {
        var response = null;
        try {
          response = JSON.parse(xhr.response);
        } catch (error) {}
        if (this.status === 200) {
          resolve(response);
        } else {
          reject(response);
        }
      }
    };
    xhr.onerror = function() {
      var response = null;
      try {
        response = JSON.parse(xhr.response);
      } catch (error) {}
      reject(response);
    };
    xhr.send(JSON.stringify(body));
  }).catch(error => {
    console.error(error);
    throw error;
  });
}

function hashCode(str) {
  // java String#hashCode
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

export function stringToRGB(i) {
  var c = (hashCode(i) & 0x00ffffff).toString(16).toUpperCase();

  return "#" + "00000".substring(0, 6 - c.length) + c;
}

const fallbackCopyTextToClipboard = (text) => {
  var textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
  } catch (err) { }
  document.body.removeChild(textArea);
}
const copyTextToClipboard = (text) => {
  if (!navigator.clipboard) {
    return new Promise((resolve, reject) => {
      fallbackCopyTextToClipboard(text);
      resolve();
    });
  }
  return navigator.clipboard.writeText(text);
}


export function buildChatLink(sessionId, nickname){
  return `www.synaren.com/cloud-chat/chat?session=${sessionId}${nickname ? `&nickname=${nickname}` : ''}`
}

export function shareLink(sessionId, nickname) {
  return copyTextToClipboard(buildChatLink(sessionId, nickname))
}