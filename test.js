const fetch = require('node-fetch');

(async () => {
  console.log("Mocking payload...");
  const hasReminder = true;
  const reminderTime = "2026-06-06T12:00";
  
  const payload = {
    title: "Test Note",
    type: "ideas",
    content: "Testing reminder bug",
    has_reminder: hasReminder,
    reminder_time: hasReminder && reminderTime ? reminderTime : null
  };
  
  console.log("Payload:", JSON.stringify(payload, null, 2));
  
  // Let's destructure it like express does
  const req = { body: payload };
  const { title, type, content, has_reminder, reminder_time } = req.body;
  
  console.log("Extracted has_reminder:", has_reminder);
  console.log("Evaluated for prisma has_reminder:", has_reminder || false);
})();
