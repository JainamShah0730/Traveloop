/**
 * AgentQueue — In-memory async job queue for TravelAgent
 * 
 * Uses a Map-based store with pending → processing → completed → failed lifecycle.
 * Jobs are also persisted to the database (AgentJob model) for history.
 * 
 * Why in-memory instead of BullMQ:
 * The project uses Upstash Redis (HTTP-based), which can't power BullMQ (needs TCP Redis).
 * For Phase 1, this is acceptable — jobs don't survive server restarts but that's fine
 * for a chat-like interaction where the user is actively polling.
 */

const { randomBytes } = require('crypto');
const { runTravelAgent } = require('./TravelAgent');
const db = require('../db');

// In-memory job store
const jobs = new Map();

// Auto-cleanup: remove jobs older than 1 hour every 10 minutes
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [id, job] of jobs) {
    if (job.createdAt < oneHourAgo) {
      jobs.delete(id);
    }
  }
}, 10 * 60 * 1000);

/**
 * Add a job to the queue and start processing it asynchronously.
 * Returns the jobId immediately.
 */
async function addJob({ userId, userMessage, conversationHistory = [] }) {
  const jobId = randomBytes(12).toString('hex');

  const job = {
    id: jobId,
    userId,
    userMessage,
    conversationHistory,
    status: 'pending',
    response: null,
    toolsCalled: [],
    error: null,
    createdAt: Date.now()
  };

  jobs.set(jobId, job);

  // Also create a DB record for persistence
  let dbJobId = null;
  try {
    const dbJob = await db.agentJob.create({
      data: {
        userId,
        userMessage,
        conversationHistory: conversationHistory || [],
        status: 'pending'
      }
    });
    dbJobId = dbJob.id;
    job.dbId = dbJobId;
  } catch (err) {
    console.warn('Could not create AgentJob DB record:', err.message);
  }

  // Process asynchronously — don't await
  processJob(jobId).catch(err => {
    console.error(`Job ${jobId} processing failed:`, err);
  });

  return { jobId, dbId: dbJobId };
}

/**
 * Get current job status and result
 */
function getJob(jobId) {
  return jobs.get(jobId) || null;
}

/**
 * Process a job in the background
 */
async function processJob(jobId) {
  const job = jobs.get(jobId);
  if (!job) return;

  job.status = 'processing';

  // Update DB
  if (job.dbId) {
    try {
      await db.agentJob.update({
        where: { id: job.dbId },
        data: { status: 'processing' }
      });
    } catch (err) { /* ignore */ }
  }

  try {
    const result = await runTravelAgent({
      userMessage: job.userMessage,
      userId: job.userId,
      conversationHistory: job.conversationHistory
    });

    job.status = 'completed';
    job.response = result.response;
    job.toolsCalled = result.toolsCalled;
    job.messages = result.messages;

    // Persist to DB
    if (job.dbId) {
      try {
        await db.agentJob.update({
          where: { id: job.dbId },
          data: {
            status: 'completed',
            response: result.response,
            toolsCalled: result.toolsCalled,
            messages: result.messages
          }
        });
      } catch (err) {
        console.warn('Could not update AgentJob DB record:', err.message);
      }
    }
  } catch (err) {
    job.status = 'failed';
    job.error = err.message;

    // Persist error to DB
    if (job.dbId) {
      try {
        await db.agentJob.update({
          where: { id: job.dbId },
          data: { status: 'failed', error: err.message }
        });
      } catch (dbErr) { /* ignore */ }
    }
  }
}

module.exports = { addJob, getJob };
