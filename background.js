import { initializeApp } from "firebase/app";
require("dotenv").config();
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  QuerySnapshot,
  updateDoc,
} from "firebase/firestore";

import { deleteDoc, doc } from "firebase/firestore";

chrome.runtime.onInstalled.addListener(function () {
  console.log("WORKBOX Installed");
});

const OFFSCREEN_DOCUMENT_PATH = "offscreen.html";
const FIREBASE_HOSTING_URL = process.env.FIREBASE_HOSTING_URL; // Replace with your Firebase hosting URL

let creatingOffscreenDocument;

async function hasOffscreenDocument() {
  const matchedClients = await clients.matchAll();
  return matchedClients.some((client) =>
    client.url.endsWith(OFFSCREEN_DOCUMENT_PATH)
  );
}

async function setupOffscreenDocument() {
  if (await hasOffscreenDocument()) return;

  if (creatingOffscreenDocument) {
    await creatingOffscreenDocument;
  } else {
    creatingOffscreenDocument = chrome.offscreen.createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: [chrome.offscreen.Reason.DOM_SCRAPING],
      justification: "Firebase Authentication",
    });
    await creatingOffscreenDocument;
    creatingOffscreenDocument = null;
  }
}

async function getAuthFromOffscreen() {
  await setupOffscreenDocument();
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: "getAuth", target: "offscreen" },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      }
    );
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "signIn") {
    getAuthFromOffscreen()
      .then((user) => {
        console.log(user);
        chrome.storage.local.set({ user: user }, () => {
          sendResponse({ user: user });
        });
        chrome.runtime.sendMessage({ action: "loadDetails" });
      })
      .catch((error) => {
        console.error("Authentication error:", error);
        sendResponse({ error: error.message });
      });
    return true; // Indicates we will send a response asynchronously
  } else if (message.action === "signOut") {
    chrome.storage.local.remove("user", () => {
      sendResponse();
    });
    return true;
  }
  if (message.action === "authResponse") {
    chrome.storage.local.set({ user: message.user }, () => {
      // Optionally send a response back to popup if needed
      console.log("User data saved:", message.user);
    });
  }
});

const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID,
  measurementId: process.env.MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "saveJobToFirestore") {
    const { userId, jobData } = message;
    addDoc(collection(db, "users", userId, "jobs"), jobData)
      .then(() => {
        sendResponse({ status: "success", message: "saved to firebase" });
      })
      .catch((error) => {
        sendResponse({ status: "error", error: error.message });
      });
    return true;
  }

  if (message.action === "fetchJobsFromFirestore") {
    const { userId } = message;

    // Log userId for debugging purposes
    console.log(`Fetching jobs for user ID: ${userId}`);

    getDocs(collection(db, "users", userId, "jobs"))
      .then((querySnapshot) => {
        // console.log(jobs);
        const jobs = querySnapshot.docs.map((doc) => {
          const jobData = doc.data();
          const jobId = doc.id; // Get the document ID (jobId)
          console.log(`Fetched job with ID: ${jobId}, Data:`, jobData);
          return { ...jobData, jobId }; // Include jobId in the returned object
        });

        // Log fetched jobs for debugging purposes
        console.log("Fetched jobs:", jobs);

        sendResponse({ status: "success", jobs });
      })
      .catch((error) => {
        console.error("Error fetching jobs from Firestore:", error);
        sendResponse({ status: "error", error: error.message });
      });

    return true; // Indicates async response
  }

  if (message.action === "deleteJobFromFirestore") {
    const { userId, jobId } = message;
    const jobDocRef = doc(db, "users", userId, "jobs", jobId);

    deleteDoc(jobDocRef)
      .then(() => {
        sendResponse({
          status: "success",
          message: "Job successfully deleted from Firestore",
        });
        // chrome.runtime.sendMessage({ action: "jobListUpdated" });
      })
      .catch((error) => {
        sendResponse({ status: "error", error: error.message });
      });
    return true; // Indicates async response
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateJobStatusInFirestore") {
    const { userId, jobId, newStatus } = message;
    const jobDocRef = doc(db, "users", userId, "jobs", jobId);

    // Only update the status field
    updateDoc(jobDocRef, { status: newStatus })
      .then(() => {
        // Send a success response back
        sendResponse({ status: "success" });
      })
      .catch((error) => {
        // Send an error response back
        sendResponse({ status: "error", error: error.message });
      });

    return true;
  }
});
