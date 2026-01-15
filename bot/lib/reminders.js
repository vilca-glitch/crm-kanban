const axios = require('axios');

const CRM_BASE_URL = process.env.CRM_API_URL || 'http://localhost:3000';
const CRM_PUBLIC_URL = process.env.CRM_PUBLIC_URL || CRM_BASE_URL;

const crmClient = axios.create({
  baseURL: CRM_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

async function checkForDueReminders() {
  try {
    const response = await crmClient.get('/api/reminders/check');
    if (response.data && response.data.success) {
      return response.data.tasks || [];
    }
    return [];
  } catch (error) {
    console.error('Error checking for reminders:', error.message);
    return [];
  }
}

async function markReminderSent(taskId) {
  try {
    const response = await crmClient.post('/api/reminders/check', { taskId });
    return response.data && response.data.success;
  } catch (error) {
    console.error('Error marking reminder as sent:', error.message);
    return false;
  }
}

function formatReminderMessage(task) {
  const priorityEmoji = task.priority === 'high' ? ':red_circle:' :
                        task.priority === 'medium' ? ':large_yellow_circle:' : ':large_green_circle:';

  // Format time remaining with minute-level precision
  let timeText;
  const mins = task.minutesRemaining || 0;
  if (mins === 0) {
    timeText = 'now';
  } else if (mins < 60) {
    timeText = mins === 1 ? 'in 1 minute' : `in ${mins} minutes`;
  } else {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (remainingMins === 0) {
      timeText = hours === 1 ? 'in 1 hour' : `in ${hours} hours`;
    } else {
      timeText = `in ${hours}h ${remainingMins}m`;
    }
  }

  // Add specific due time if not end of day
  let dueTimeDisplay = '';
  if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    const hours = dueDate.getHours();
    const minutes = dueDate.getMinutes();
    if (hours !== 23 || minutes !== 59) {
      dueTimeDisplay = ` at ${dueDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })}`;
    }
  }

  const taskUrl = `${CRM_PUBLIC_URL}/?task=${task.id}`;

  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: ':bell: Task Reminder',
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${task.title}*`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Client:*\n${task.client || 'None'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Priority:*\n${priorityEmoji} ${task.priority}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:clock1: *Due ${timeText}*${dueTimeDisplay}`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Task',
              emoji: true,
            },
            url: taskUrl,
            action_id: 'view_task',
          },
        ],
      },
    ],
    text: `Reminder: "${task.title}" is due ${timeText}${dueTimeDisplay}`,
  };
}

async function sendReminder(app, channelId, task) {
  try {
    const message = formatReminderMessage(task);

    await app.client.chat.postMessage({
      channel: channelId,
      ...message,
    });

    // Mark reminder as sent
    await markReminderSent(task.id);

    console.log(`Reminder sent for task: ${task.title}`);
    return true;
  } catch (error) {
    console.error('Error sending reminder:', error.message);
    return false;
  }
}

async function processReminders(app, channelId) {
  if (!channelId) {
    console.warn('SLACK_REMINDERS_CHANNEL not set, skipping reminder check');
    return;
  }

  const tasks = await checkForDueReminders();

  if (tasks.length === 0) {
    return;
  }

  console.log(`Found ${tasks.length} task(s) needing reminders`);

  for (const task of tasks) {
    await sendReminder(app, channelId, task);
  }
}

module.exports = {
  checkForDueReminders,
  markReminderSent,
  formatReminderMessage,
  sendReminder,
  processReminders,
};
