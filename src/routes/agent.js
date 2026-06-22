/**
 * Agent Routes — AI Travel Agent API
 * 
 * POST /api/agent/chat         — Start a new agent conversation job
 * GET  /api/agent/job/:jobId   — Poll for job result
 * POST /api/agent/optimize/:id — Optimize an existing itinerary
 * POST /api/agent/budget/predict — Standalone budget prediction
 */

const express = require('express');
const auth = require('../middleware/auth');
const db = require('../db');
const { addJob, getJob } = require('../services/agentQueue');
const { BudgetTool } = require('../services/tools/BudgetTool');
const { generateItinerary } = require('../services/AIService');

const router = express.Router();

// ── POST /api/agent/chat ─────────────────────────────────────────
// Body: { message, conversationHistory? }
// Returns: { jobId, status: 'pending' }
router.post('/chat', auth, async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message required' });
    }

    const { jobId } = await addJob({
      userId: req.user.id,
      userMessage: message.trim(),
      conversationHistory: conversationHistory || []
    });

    res.json({ jobId, status: 'pending' });
  } catch (err) {
    console.error('Agent chat error:', err);
    res.status(500).json({ error: 'Failed to start agent job' });
  }
});

// ── GET /api/agent/job/:jobId ────────────────────────────────────
// Poll for result
router.get('/job/:jobId', auth, async (req, res) => {
  try {
    const job = getJob(req.params.jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found or expired' });
    }

    // Only return the job if it belongs to the requesting user
    if (job.userId !== req.user.id) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json({
      jobId: job.id,
      status: job.status,
      response: job.response,
      toolsCalled: job.toolsCalled,
      error: job.error
    });
  } catch (err) {
    console.error('Agent job poll error:', err);
    res.status(500).json({ error: 'Failed to fetch job status' });
  }
});

// ── POST /api/agent/optimize/:itineraryId ────────────────────────
// Reorder itinerary activities for efficiency
router.post('/optimize/:itineraryId', auth, async (req, res) => {
  try {
    const itinerary = await db.aiItinerary.findUnique({
      where: { id: req.params.itineraryId }
    });

    if (!itinerary || itinerary.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const itineraryData = itinerary.data;
    if (!itineraryData?.days || itineraryData.days.length === 0) {
      return res.status(400).json({ error: 'No itinerary days to optimize' });
    }

    // Use the existing AIService.callClaude-like approach via DeepSeek
    const { OpenAI } = require('openai');
    const openai = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: process.env.DEEPSEEK_API_KEY || 'missing-key'
    });

    const optimizePrompt = `You are optimizing an existing travel itinerary.

DESTINATION: ${itinerary.destination}
CURRENT ITINERARY:
${JSON.stringify(itineraryData.days, null, 2)}

Your task:
1. For each day, reorder activities to minimize travel time between them
2. Put outdoor activities in the morning (before peak heat / before crowds)
3. Put indoor activities in the afternoon (museums, malls, galleries)
4. Put sunset/evening activities last
5. If any activity has known opening hours, respect them
6. Flag any activity that is too far from the others on the same day

Return ONLY a JSON array of updated days with reordered activities.
Preserve ALL existing fields — only change the morning/afternoon/evening assignments.
No preamble. No backticks. Just the JSON array.

[{ "day": 1, "title": "...", "morning": {...}, "afternoon": {...}, "evening": {...}, "optimization_note": "Reordered to avoid midday heat" }]`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: optimizePrompt }],
      model: 'deepseek-chat',
      max_tokens: 3000
    });

    let raw = completion.choices[0].message.content;
    let optimizedDays;
    try {
      optimizedDays = JSON.parse(raw);
    } catch {
      optimizedDays = JSON.parse(raw.replace(/```json|```/g, '').trim());
    }

    const updatedData = {
      ...itineraryData,
      days: optimizedDays,
      optimizedAt: new Date().toISOString()
    };

    await db.aiItinerary.update({
      where: { id: req.params.itineraryId },
      data: { data: updatedData }
    });

    res.json({ success: true, optimizedDays });
  } catch (err) {
    console.error('Optimize error:', err);
    res.status(500).json({ error: 'Failed to optimize itinerary' });
  }
});

// ── POST /api/agent/budget/predict ───────────────────────────────
// Standalone budget prediction
router.post('/budget/predict', auth, async (req, res) => {
  try {
    const { destination, durationDays, travelers, style, totalBudget } = req.body;

    if (!destination || !durationDays || !totalBudget) {
      return res.status(400).json({ error: 'destination, durationDays, and totalBudget are required' });
    }

    const prediction = await BudgetTool.predict({
      destination,
      duration_days: Number(durationDays),
      travelers: Number(travelers) || 1,
      style: style || 'mid',
      total_budget: Number(totalBudget)
    });

    // Get cheapest months via DeepSeek
    let cheapestMonths = [];
    try {
      const { OpenAI } = require('openai');
      const openai = new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: process.env.DEEPSEEK_API_KEY || 'missing-key'
      });

      const monthPrompt = `For a trip to ${destination} lasting ${durationDays} days with style "${style || 'mid'}",
which 3 months of the year offer the best value (low season + good weather)?
Return ONLY JSON: [{ "month": "October", "reason": "...", "savingsVsYearly": "~20%" }]
No preamble. No backticks.`;

      const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: monthPrompt }],
        model: 'deepseek-chat',
        max_tokens: 500
      });

      const raw = completion.choices[0].message.content;
      try {
        const jsonMatch = raw.match(/\[[\s\S]*\]/);
        cheapestMonths = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(raw);
      } catch { /* ignore parse failure */ }
    } catch (err) {
      console.warn('Cheapest months generation failed:', err.message);
    }

    res.json({ prediction, cheapestMonths });
  } catch (err) {
    console.error('Budget predict error:', err);
    res.status(500).json({ error: 'Failed to predict budget' });
  }
});

module.exports = router;
