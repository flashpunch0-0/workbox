document
  .getElementById("job-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const company = document.getElementById("company").value;
    const role = document.getElementById("role").value;
    const status = document.getElementById("status").value;
    const jobUrl = document.getElementById("job-url").value;

    // Check if a URL is provided and valid
    if (jobUrl && !document.getElementById("job-url").checkValidity()) {
      alert("Please enter a valid URL, starting with https:// or http://");
      return;
    }

    const job = {
      company,
      role,
      status,
      url: jobUrl,
      dateApplied: new Date().toLocaleDateString(),
    };

    chrome.storage.local.get("user", function (result) {
      if (result.user) {
        // User is authenticated, store job in Firestore
        const userId = result.user.uid;

        // Send job data to the background script to save in Firestore
        chrome.runtime.sendMessage(
          {
            action: "saveJobToFirestore",
            userId: userId,
            jobData: job,
          },
          function (response) {
            if (response.status === "success") {
              displayJobs(); // Refresh the UI after saving
            } else {
              console.error("Failed to save job to Firestore:", response.error);
            }
          }
        );
      } else {
        // Fallback: save jobs in chrome storage if the user isn't authenticated
        chrome.storage.local.get({ jobs: [] }, function (result) {
          const jobs = result.jobs;
          jobs.push(job);

          chrome.storage.local.set({ jobs }, function () {
            displayJobs();
          });
        });
      }
    });

    document.getElementById("job-form").reset();
  });

function deleteJob(jobId) {
  chrome.storage.local.get("user", function (result) {
    if (result.user) {
      const userId = result.user.uid;

      // Send delete request to background script
      chrome.runtime.sendMessage(
        {
          action: "deleteJobFromFirestore",
          userId: userId,
          jobId: jobId,
        },
        function (response) {
          if (response.status === "success") {
            console.log("Job deleted successfully from Firestore");
            displayJobs(); // Refresh the UI after deleting
          } else {
            console.error(
              "Failed to delete job from Firestore:",
              response.error
            );
          }
        }
      );
    }
  });
}

function displayJobs() {
  chrome.storage.local.get("user", function (result) {
    if (result.user) {
      const userId = result.user.uid;

      // Fetch jobs from Firestore for the authenticated user
      chrome.runtime.sendMessage(
        {
          action: "fetchJobsFromFirestore",
          userId: userId,
        },
        function (response) {
          if (response.status === "success") {
            const jobs = response.jobs;
            // const jobs = response.;
            console.log("Fetched jobs from Firestore:", jobs); // Log the jobs
            updateJobListUI(jobs); // Custom function to render job list
          } else {
            console.error(
              "Failed to fetch jobs from Firestore:",
              response.error
            );
          }
        }
      );
    } else {
      // Fallback: fetch jobs from local storage if the user isn't authenticated
      chrome.storage.local.get({ jobs: [] }, function (result) {
        const jobs = result.jobs;
        updateJobListUI(jobs); // Custom function to render job list
      });
    }
  });
}

function updateJobStatus(jobId, newStatus) {
  chrome.storage.local.get("user", function (result) {
    if (result.user) {
      const userId = result.user.uid;

      chrome.runtime.sendMessage(
        {
          action: "updateJobStatusInFirestore",
          userId: userId,
          jobId: jobId,
          newStatus: newStatus,
        },
        function (response) {
          if (response && response.status === "success") {
            // Update the status text in the UI
            document.getElementById(`status-${jobId}`).textContent = newStatus;
            displayJobs();
          } else {
            console.error(
              "Failed to update job status:",
              response?.error || "Unknown error"
            );
          }
        }
      );
    }
  });
}

function updateJobListUI(jobs) {
  const jobList = document.getElementById("job-list");
  jobList.innerHTML = "";

  jobs.forEach((job) => {
    const li = document.createElement("li");
    li.classList.add("job-item");

    const jobInfo = document.createElement("div");
    jobInfo.classList.add("job-info");
    jobInfo.innerHTML = `<strong>${job.company}</strong> - ${job.role} - <em>${job.status}</em>`;

    const actions = document.createElement("div");
    actions.classList.add("actions");

    const viewButton = document.createElement("button");
    viewButton.textContent = "View Job";
    viewButton.classList.add("btn", "btn-primary", "btn-sm", "mr-2");
    viewButton.onclick = function () {
      window.open(job.url, "_blank");
    };

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.classList.add("btn", "btn-danger", "btn-sm");
    deleteButton.onclick = function () {
      deleteJob(job.jobId);
    };

    // Dropdown for status change with placeholder
    const statusDropdown = document.createElement("select");
    statusDropdown.classList.add("status-dropdown");

    // Create and append the placeholder option
    const placeholderOption = document.createElement("option");
    placeholderOption.textContent = "Change Status";
    placeholderOption.value = ""; // No value for placeholder
    placeholderOption.disabled = true; // Disable the placeholder
    placeholderOption.selected = true; // Make it selected by default
    statusDropdown.appendChild(placeholderOption);

    // Add options to the dropdown
    ["Applied", "Interviewed", "Offer Received", "Rejected"].forEach(
      (status) => {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = status;
        statusDropdown.appendChild(option);
      }
    );

    // Handle status change
    statusDropdown.onchange = function () {
      const newStatus = statusDropdown.value;
      if (newStatus) {
        updateJobStatus(job.jobId, newStatus);
        statusDropdown.selectedIndex = 0; // Reset to placeholder after selection
      }
    };

    // Append elements to the actions container
    actions.appendChild(viewButton);
    actions.appendChild(deleteButton);
    actions.appendChild(statusDropdown); // Add dropdown to the list item

    // Append job info and actions to the list item
    li.appendChild(jobInfo);
    li.appendChild(actions);

    jobList.appendChild(li);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const signInButton = document.getElementById("signInButton");
  const signOutButton = document.getElementById("signOutButton");
  const userInfo = document.getElementById("userInfo");

  function updateUI(user) {
    if (user) {
      userInfo.textContent = `Signed in as: ${user.email}`;
      signInButton.style.display = "none";
      signOutButton.style.display = "block";
      // updateJobListUI(null);
    } else {
      userInfo.textContent = "Not signed in";
      signInButton.style.display = "block";
      signOutButton.style.display = "none";
    }
  }

  function loadUserData() {
    chrome.storage.local.get("user", function (result) {
      if (result.user) {
        updateUI(result.user);
      } else {
        updateUI(null);
      }
    });
  }

  // Load user data when the popup is opened
  loadUserData();
  displayJobs();

  signInButton.addEventListener("click", async function () {
    await chrome.runtime.sendMessage({ action: "signIn" }, function (response) {
      if (response && response.user) {
        chrome.storage.local.set({ user: response.user }, function () {
          updateUI(response.user);
          displayJobs();
        });
      }
    });
  });

  signOutButton.addEventListener("click", async function () {
    await chrome.runtime.sendMessage({ action: "signOut" }, function () {
      chrome.storage.local.remove("user", function () {
        updateUI(null);
        updateJobListUI(null);
        displayJobs();
      });
    });
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "loadDetails") {
    loadUserData();
    displayJobs();
  }
});
