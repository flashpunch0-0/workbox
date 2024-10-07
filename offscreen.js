const FIREBASE_HOSTING_URL = "your-firebase-hosting-url"; // Replace with your Firebase hosting URL

// Create an iframe and append it to the body to host the Firebase auth page
const iframe = document.createElement("iframe");
iframe.src = FIREBASE_HOSTING_URL;
document.body.appendChild(iframe);

// Function to check if a string is valid JSON
function isValidJSON(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getAuth" && message.target === "offscreen") {
    function handleIframeMessage({ data }) {
      console.log("Raw iframe message received:", data);
      if (typeof data === "string" && isValidJSON(data)) {
        const parsedData = JSON.parse(data);
        console.log(parsedData);
        if (parsedData && typeof parsedData === "object") {
          window.removeEventListener("message", handleIframeMessage);
          sendResponse(parsedData.result.user);
          chrome.runtime.sendMessage({
            action: "authResponse",
            user: parsedData.result.user,
          });
        }
      } else {
        if (data === "") {
          console.warn("Received an empty message from iframe");
        } else {
          console.warn("Received a non-JSON message from iframe:", data);
        }
      }
    }

    window.addEventListener("message", handleIframeMessage);

    iframe.contentWindow.postMessage({ initAuth: true }, "*"); // Using "*" as a wildcard if CORS allows it.
    return true;
  }
});
