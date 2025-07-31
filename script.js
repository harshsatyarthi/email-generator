// Backend API endpoints
const API_NEW_EMAIL = 'http://localhost:5000/api/new-mailbox';
const API_FETCH_EMAILS = email => `http://localhost:5000/api/mailbox/${encodeURIComponent(email)}/messages`;

const tempEmailInput = document.getElementById('temp-email');
const copyBtn = document.getElementById('copy-btn');
const generateBtn = document.getElementById('generate-btn');
const refreshBtn = document.getElementById('refresh-btn');
const emailList = document.getElementById('email-list');
const showPreviousBtn = document.getElementById('show-previous-btn');
const previousEmailsSection = document.getElementById('previous-emails');
const previousEmailList = document.getElementById('previous-email-list');
const clearBtn = document.getElementById('clear-btn');

let currentEmail = null;

// Copy email to clipboard
copyBtn.addEventListener('click', () => {
  if (tempEmailInput.value) {
    navigator.clipboard.writeText(tempEmailInput.value).then(() => {
      copyBtn.textContent = "Copied!";
      setTimeout(() => {
        copyBtn.textContent = "Copy";
      }, 1200);
    }).catch(() => {
      alert("Failed to copy email. Please copy manually.");
    });
  }
});

function saveEmailToHistory(email) {
  let emails = JSON.parse(localStorage.getItem('previousEmails') || '[]');
  if (!emails.includes(email)) {
    emails.push(email);
    localStorage.setItem('previousEmails', JSON.stringify(emails));
  }
}

function showPreviousEmails() {
  let emails = JSON.parse(localStorage.getItem('previousEmails') || '[]');
  previousEmailList.innerHTML = '';
  if (emails.length === 0) {
    previousEmailList.innerHTML = '<li>No previous emails.</li>';
  } else {
    emails.forEach(email => {
      const li = document.createElement('li');
      li.textContent = email;
      previousEmailList.appendChild(li);
    });
  }
  previousEmailsSection.style.display = 'block';
}

showPreviousBtn.addEventListener('click', showPreviousEmails);

// Generate new email and fetch inbox
async function generateNewEmail() {
  try {
    generateBtn.disabled = true;
    refreshBtn.disabled = true;
    copyBtn.disabled = true;
    tempEmailInput.value = "Generating...";
    emailList.innerHTML = "<li>Loading inbox...</li>";

    const response = await fetch(API_NEW_EMAIL);
    if (!response.ok) throw new Error('Failed to fetch new email');
    const data = await response.json();
    currentEmail = data.emailAddress;

    tempEmailInput.value = currentEmail;
    copyBtn.disabled = false;
    refreshBtn.disabled = false;
    emailList.innerHTML = "<li>No emails yet.</li>";
    saveEmailToHistory(currentEmail); // Save to history
  } catch (err) {
    alert(`Error generating new email: ${err.message}`);
    tempEmailInput.value = "";
    emailList.innerHTML = "<li>Error loading inbox.</li>";
    copyBtn.disabled = true;
    refreshBtn.disabled = true;  // <- fixed here
  } finally {
    generateBtn.disabled = false;
  }
}

// Add event listener for Generate New Email button
generateBtn.addEventListener('click', generateNewEmail);

refreshBtn.addEventListener('click', refreshInbox);

async function refreshInbox() {
  if (!currentEmail) return;
  refreshBtn.disabled = true;
  emailList.innerHTML = '<li>Refreshing...</li>';
  try {
    const response = await fetch(API_FETCH_EMAILS(currentEmail));
    if (!response.ok) throw new Error('Failed to fetch inbox');
    const data = await response.json();
    if (data.messages && data.messages.length > 0) {
      emailList.innerHTML = '';
      data.messages.forEach(msg => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>From:</strong> ${msg.from} <br><strong>Subject:</strong> ${msg.subject}`;
        emailList.appendChild(li);
      });
    } else {
      emailList.innerHTML = '<li>No emails yet.</li>';
    }
  } catch (err) {
    emailList.innerHTML = `<li>Error: ${err.message}</li>`;
  } finally {
    refreshBtn.disabled = false;
  }
}

// Clear previous emails and reset UI
clearBtn.addEventListener('click', () => {
  localStorage.removeItem('previousEmails');
  previousEmailList.innerHTML = '<li>No previous emails.</li>';
  previousEmailsSection.style.display = 'none';
  emailList.innerHTML = '<li>No emails yet.</li>';
  tempEmailInput.value = '';
  currentEmail = null;
  copyBtn.disabled = true;
  refreshBtn.disabled = true;
});
