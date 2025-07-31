const express = require('express');
const cors = require('cors');
const { customAlphabet } = require('nanoid');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Use nanoid to generate random string part
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 7);

// Our disposable domain (change as needed)
const DOMAIN = 'tempmail.example.com';

// In-memory storage: { emailAddress => [ messages ] }
const mailboxes = new Map();

// Time to live for mailbox in milliseconds (e.g., 1 hour)
const MAILBOX_TTL = 3600 * 1000;

// Clean up expired mailboxes periodically
setInterval(() => {
  const now = Date.now();
  for (const [email, box] of mailboxes.entries()) {
    if (now - box.createdAt > MAILBOX_TTL) {
      mailboxes.delete(email);
      console.log(`Mailbox ${email} expired and removed`);
    }
  }
}, 10 * 60 * 1000); // every 10 minutes

// Generate new disposable email address
app.get('/api/new-mailbox', (req, res) => {
  const localPart = nanoid();
  const emailAddress = `${localPart}@${DOMAIN}`;

  if (!mailboxes.has(emailAddress)) {
    mailboxes.set(emailAddress, { createdAt: Date.now(), messages: [] });

    // For demo, add a welcome email automatically
    mailboxes.get(emailAddress).messages.push({
      id: 1,
      from: 'welcome@tempmail.example.com',
      subject: 'Welcome to Temporary Mail!',
      body: 'This is your temporary disposable inbox. All emails here expire after 1 hour.',
      receivedAt: new Date().toISOString(),
    });
  }

  res.json({ emailAddress });
});

// Fetch emails for a given mailbox
app.get('/api/mailbox/:email/messages', (req, res) => {
  const email = req.params.email.toLowerCase();
  if (!mailboxes.has(email)) {
    return res.status(404).json({ error: 'Mailbox not found or expired' });
  }
  const mailbox = mailboxes.get(email);
  // Return all messages sorted by receivedAt desc
  const sortedMessages = mailbox.messages
    .slice()
    .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));
  res.json(sortedMessages);
});

// Simulate incoming email POST to mailbox (for testing)
// In real usage, integrate with an SMTP service that forwards mails here.
app.post('/api/mailbox/:email/new', (req, res) => {
  const email = req.params.email.toLowerCase();
  const { from, subject, body } = req.body;
  if (! mailboxes.has(email)) {
    return res.status(404).json({ error: 'Mailbox not found or expired' });
  }
  if (!from || !subject || !body) {
    return res.status(400).json({ error: 'Missing fields: from, subject, and body required' });
  }
  const mailbox = mailboxes.get(email);
  const newId = mailbox.messages.length ? mailbox.messages[mailbox.messages.length - 1].id + 1 : 1;

  mailbox.messages.push({
    id: newId,
    from,
    subject,
    body,
    receivedAt: new Date().toISOString(),
  });

  res.json({ success: true, message: 'Email received (simulated)' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Temp email backend listening on port ${PORT}`);
  console.log(`Disposable domain: ${DOMAIN}`);
});
