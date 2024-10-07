---
# WORKBOX

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Technologies Used](#technologies-used)
4. [Installation](#installation)
5. [Usage](#usage)
6. [File Structure](#file-structure)
7. [Firebase Firestore Integration](#firebase-firestore-integration)
8. [Firebase Security Rules](#firebase-security-rules)
9. [Contributing](#contributing)
10. [License](#license)
11. extra
---

## Overview

The **WORKBOX** is a lightweight tool designed to help users manage their job applications efficiently. Users can easily add job listings, update statuses, and track their job application progress all from within their browser.

## Features

- **Add New Job Listings**: Users can input job details including company name, role, application status, and job URL.
- **View Job Applications**: Display a list of applied jobs with details in an organized manner.
- **Edit Job Status**: Users can change the status of their applications using a simple dropdown menu.
- **User Authentication**: Integration with Firebase Authentication for secure access.
- **Firestore Database**: Store and retrieve job application data in real-time using Firestore.

## Technologies Used

- **HTML/CSS**: For the frontend layout and styling.
- **JavaScript**: For client-side logic and handling user interactions.
- **Firebase**: For user authentication and Firestore database management.
- **Bootstrap**: For responsive design and easy styling.

## Installation

1. **Clone the repository**:

2. **Navigate to the project directory**:
   ```bash
   cd job-tracker-extension
   ```
3. **Load the extension in Chrome**:
   - Open Chrome and navigate to `chrome://extensions`.
   - Enable **Developer mode** (toggle on the top right).
   - Click on **Load unpacked** and select the project directory.

## Usage

1. **Sign In**: Click the "Sign In" button to authenticate with your Firebase account.
2. **Add a Job**: Fill in the job details in the form and click "Save Job" to add it to your list.
3. **View Jobs**: Your applied jobs will be displayed in the "Applied Jobs" section.
4. **Change Status**: Click the "Change Status" button next to a job to update its status.

## File Structure

```
job-tracker-extension/
│
├── dist/
│   ├── backgroundbundled.js
│   └── popup.js
├── popup.html
├── manifest.json
└── styles.css
```

- **`popup.html`**: The main UI for the extension.
- **`popup.js`**: Handles the logic for adding, viewing, and updating jobs.
- **`manifest.json`**: Metadata about the extension, including permissions and background scripts.
- **`styles.css`**: Custom styles for the extension.

## Firebase Firestore Integration

This extension uses Firebase Firestore to store and retrieve job application data. Here's how the integration works:

- **Add Job**: When a new job is added, it's stored in the Firestore database under the authenticated user's document.
- **Fetch Jobs**: On extension load, jobs are fetched from Firestore and displayed in the UI.
- **Update Job Status**: Changing the job status updates the Firestore document in real-time.

### Example Code for Firestore Integration

```javascript
// Save a new job to Firestore
const saveJobToFirestore = (userId, jobData) => {
  const db = firebase.firestore();
  db.collection("users")
    .doc(userId)
    .collection("jobs")
    .add(jobData)
    .then(() => {
      console.log("Job saved successfully!");
    })
    .catch((error) => {
      console.error("Error saving job: ", error);
    });
};
```

## Firebase Security Rules

To ensure secure access to the Firestore database, the following rules are implemented:

```plaintext
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2024, 11, 1);
    }
    match /users/{userId}/jobs/{jobId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

- Users can only read and write to their own job data.

## Contributing

If you would like to contribute to the project, please follow these steps:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/YourFeature`.
3. Make your changes and commit them: `git commit -m 'Add some feature'`.
4. Push to the branch: `git push origin feature/YourFeature`.
5. Open a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Feel free to modify any section to better match your project’s specifics or preferences. If you have any additional features or modifications in mind, you can include those as well!
