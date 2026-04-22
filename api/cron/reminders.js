import { runFeeReminderCron } from '../../server/utils/reminderCron.js';

export default async function handler(req, res) {
  // Security check: Verify the Vercel Cron Secret
  // Vercel automatically includes this header for scheduled jobs
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const results = await runFeeReminderCron();
    res.status(200).json({ 
      success: true, 
      message: 'Fee reminder cron executed successfully',
      results 
    });
  } catch (error) {
    console.error('[Cron API] Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error', 
      error: error.message 
    });
  }
}
