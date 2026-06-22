require('dotenv').config();
const { addJob, getJob } = require('./src/services/agentQueue');

async function runE2E() {
  console.log('Starting E2E Test...');
  try {
    const { jobId } = await addJob({
      userId: 'test-user-id',
      userMessage: 'Plan 5 days Goa, 2 people, ₹60,000 total, leaving Mumbai',
      conversationHistory: []
    });

    console.log('Job started:', jobId);

    // Poll until complete
    let attempts = 0;
    while (attempts < 30) { // Max 60 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      const job = getJob(jobId);
      
      console.log(`Poll ${attempts+1}: Status = ${job.status}`);
      
      if (job.status === 'completed') {
        console.log('\n--- SUCCESS ---');
        console.log('Tools Called:', job.toolsCalled);
        console.log('\nResponse snippet:\n', job.response.slice(0, 300) + '...');
        return;
      } else if (job.status === 'failed') {
        console.error('\n--- FAILED ---');
        console.error(job.error);
        return;
      }
      attempts++;
    }
    console.log('Timeout waiting for job');
  } catch (err) {
    console.error('Test error:', err);
  }
}

runE2E();
