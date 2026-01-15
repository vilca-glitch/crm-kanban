require('dotenv').config({ path: '.env.local' });

const { App } = require('@slack/bolt');
const fs = require('fs');
const path = require('path');
const { createTask, getStages, getClients, getTasks, updateTask } = require('./lib/crm');
const { parseTaskFromMessage, generateTaskSummary } = require('./lib/claude');
const { processReminders } = require('./lib/reminders');

const STATUS_FILE = path.join(__dirname, 'status.json');

// Validate required environment variables
const requiredEnvVars = ['SLACK_BOT_TOKEN', 'SLACK_SIGNING_SECRET', 'SLACK_APP_TOKEN'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('Please set these in .env.local');
  process.exit(1);
}

function updateStatus(status) {
  const statusData = {
    connected: status.connected,
    lastPing: new Date().toISOString(),
    error: status.error || null,
  };
  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify(statusData, null, 2));
  } catch (error) {
    console.error('Failed to write status file:', error.message);
  }
}

// Initialize the Slack app with Socket Mode
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

// Handle app_mention events (when someone @mentions the bot)
app.event('app_mention', async ({ event, say }) => {
  try {
    const text = (event.text || '').replace(/<@[A-Z0-9]+>/g, '').trim();

    if (!text) {
      await say({
        text: "Hi! I can help you manage tasks. Try saying something like:\n" +
              "- `@bot Create a proposal for Acme Corp, high priority`\n" +
              "- `@bot Show my tasks`\n" +
              "- `@bot List clients`",
        thread_ts: event.ts,
      });
      return;
    }

    // Check for commands
    const lowerText = text.toLowerCase();

    if (lowerText.startsWith('show') || lowerText.startsWith('list tasks') || lowerText === 'tasks') {
      await handleShowTasks(say, event.ts);
      return;
    }

    if (lowerText.startsWith('list clients') || lowerText === 'clients') {
      await handleListClients(say, event.ts);
      return;
    }

    if (lowerText.startsWith('stages') || lowerText === 'list stages') {
      await handleListStages(say, event.ts);
      return;
    }

    // Default: try to create a task from the message
    await handleCreateTask(text, say, event.ts);
  } catch (error) {
    console.error('Error handling app_mention:', error);
    await say({
      text: `Sorry, I encountered an error: ${error.message}`,
      thread_ts: event.ts,
    }).catch(err => console.error('Failed to send error message:', err));
  }
});

// Handle direct messages
app.event('message', async ({ event, say }) => {
  // Ignore bot messages and messages with subtypes (like message_changed)
  if (event.subtype || event.bot_id) return;

  // Only handle DMs (channel type 'im')
  if (event.channel_type !== 'im') return;

  try {
    const text = (event.text || '').trim();

    if (!text) return;

    const lowerText = text.toLowerCase();

    if (lowerText === 'help') {
      await say({
        text: "Here's what I can do:\n" +
              "- `create <task description>` - Create a new task\n" +
              "- `tasks` or `show tasks` - Show all tasks\n" +
              "- `clients` - List all clients\n" +
              "- `stages` - List all stages\n" +
              "Or just describe a task and I'll create it for you!",
      });
      return;
    }

    if (lowerText.startsWith('show') || lowerText.startsWith('list tasks') || lowerText === 'tasks') {
      await handleShowTasks(say);
      return;
    }

    if (lowerText.startsWith('clients') || lowerText === 'list clients') {
      await handleListClients(say);
      return;
    }

    if (lowerText.startsWith('stages') || lowerText === 'list stages') {
      await handleListStages(say);
      return;
    }

    // Default: create a task
    await handleCreateTask(text, say);
  } catch (error) {
    console.error('Error handling message:', error);
    await say({
      text: `Sorry, I encountered an error: ${error.message}`,
    }).catch(err => console.error('Failed to send error message:', err));
  }
});

// Handle slash command /task
app.command('/task', async ({ command, ack, respond }) => {
  await ack();

  try {
    const text = (command.text || '').trim();

    if (!text) {
      await respond({
        text: 'Please provide a task description. Example: `/task Create proposal for Acme Corp, high priority`',
      });
      return;
    }

    const clients = await getClients();
    const stages = await getStages();
    const taskData = await parseTaskFromMessage(text, clients);

    // Use the first stage as default (with null safety)
    const defaultStage = (stages && stages.length > 0)
      ? (stages.find(s => s.name.toLowerCase() === 'to do') || stages[0])
      : null;
    taskData.stageId = defaultStage?.id || 'todo';

    const result = await createTask(taskData);

    if (result && result.success && result.task) {
      await respond({
        text: `:white_check_mark: Task created!\n*${result.task.title}*\n` +
              `Client: ${result.task.client || 'None'}\n` +
              `Priority: ${result.task.priority}\n` +
              `Stage: ${defaultStage?.name || 'To Do'}`,
      });
    } else {
      await respond({
        text: `:x: Failed to create task: ${result?.error || 'Unknown error'}`,
      });
    }
  } catch (error) {
    console.error('Error handling /task command:', error);
    await respond({
      text: `:x: Error creating task: ${error.message}`,
    });
  }
});

async function handleCreateTask(text, say, threadTs = null) {
  try {
    const clients = await getClients();
    const stages = await getStages();
    const taskData = await parseTaskFromMessage(text, clients || []);

    // Use the first stage as default (with null safety)
    const defaultStage = (stages && stages.length > 0)
      ? (stages.find(s => s.name.toLowerCase() === 'to do') || stages[0])
      : null;
    taskData.stageId = defaultStage?.id || 'todo';

    const result = await createTask(taskData);

    const messageOptions = {
      text: (result && result.success && result.task)
        ? `:white_check_mark: Task created!\n*${result.task.title}*\n` +
          `Client: ${result.task.client || 'None'}\n` +
          `Priority: ${result.task.priority}\n` +
          (result.task.dueDate ? `Due: ${result.task.dueDate}\n` : '') +
          (result.task.checklist?.length > 0 ? `Checklist: ${result.task.checklist.length} items` : '')
        : `:x: Failed to create task: ${result?.error || 'Unknown error'}`,
    };

    if (threadTs) {
      messageOptions.thread_ts = threadTs;
    }

    await say(messageOptions);
  } catch (error) {
    console.error('Error in handleCreateTask:', error);
    const messageOptions = {
      text: `:x: Error creating task: ${error.message}`,
    };
    if (threadTs) {
      messageOptions.thread_ts = threadTs;
    }
    await say(messageOptions).catch(err => console.error('Failed to send error message:', err));
  }
}

async function handleShowTasks(say, threadTs = null) {
  try {
    const tasks = await getTasks();
    const stages = await getStages();

    if (!tasks || tasks.length === 0) {
      const messageOptions = {
        text: 'No tasks found. Create one by describing it to me!',
      };
      if (threadTs) messageOptions.thread_ts = threadTs;
      await say(messageOptions);
      return;
    }

    // Group tasks by stage
    const tasksByStage = {};
    if (stages && stages.length > 0) {
      stages.forEach(stage => {
        tasksByStage[stage.id] = {
          name: stage.name,
          tasks: tasks.filter(t => t.stageId === stage.id),
        };
      });
    }

    let message = ':clipboard: *Your Tasks*\n\n';

    for (const stageId in tasksByStage) {
      const stage = tasksByStage[stageId];
      if (stage.tasks.length === 0) continue;

      message += `*${stage.name}*\n`;
      stage.tasks.forEach(task => {
        const priorityEmoji = task.priority === 'high' ? ':red_circle:' :
                             task.priority === 'medium' ? ':large_yellow_circle:' : ':large_green_circle:';
        message += `${priorityEmoji} ${task.title}`;
        if (task.client) message += ` (${task.client})`;
        message += '\n';
      });
      message += '\n';
    }

    const messageOptions = { text: message };
    if (threadTs) messageOptions.thread_ts = threadTs;
    await say(messageOptions);
  } catch (error) {
    console.error('Error in handleShowTasks:', error);
    const messageOptions = {
      text: `:x: Error fetching tasks: ${error.message}`,
    };
    if (threadTs) messageOptions.thread_ts = threadTs;
    await say(messageOptions).catch(err => console.error('Failed to send error message:', err));
  }
}

async function handleListClients(say, threadTs = null) {
  try {
    const clients = await getClients();

    const message = clients && clients.length > 0
      ? `:busts_in_silhouette: *Clients*\n${clients.map(c => `- ${c}`).join('\n')}`
      : 'No clients found yet. Create a task with a client name to add one!';

    const messageOptions = { text: message };
    if (threadTs) messageOptions.thread_ts = threadTs;
    await say(messageOptions);
  } catch (error) {
    console.error('Error in handleListClients:', error);
    const messageOptions = {
      text: `:x: Error fetching clients: ${error.message}`,
    };
    if (threadTs) messageOptions.thread_ts = threadTs;
    await say(messageOptions).catch(err => console.error('Failed to send error message:', err));
  }
}

async function handleListStages(say, threadTs = null) {
  try {
    const stages = await getStages();

    const message = stages && stages.length > 0
      ? `:kanban: *Stages*\n${stages.map(s => `- ${s.name}`).join('\n')}`
      : 'No stages found.';

    const messageOptions = { text: message };
    if (threadTs) messageOptions.thread_ts = threadTs;
    await say(messageOptions);
  } catch (error) {
    console.error('Error in handleListStages:', error);
    const messageOptions = {
      text: `:x: Error fetching stages: ${error.message}`,
    };
    if (threadTs) messageOptions.thread_ts = threadTs;
    await say(messageOptions).catch(err => console.error('Failed to send error message:', err));
  }
}

// Start the app
(async () => {
  try {
    await app.start();
    console.log('Slack bot is running!');
    updateStatus({ connected: true });

    // Keep status updated periodically
    setInterval(() => {
      updateStatus({ connected: true });
    }, 60000); // Update every minute

    // Start reminder scheduler (check every 60 seconds)
    const remindersChannel = process.env.SLACK_REMINDERS_CHANNEL;
    if (remindersChannel) {
      console.log(`Reminder scheduler started, posting to channel: ${remindersChannel}`);
      setInterval(() => {
        processReminders(app, remindersChannel);
      }, 60000); // Check every minute
      // Also run immediately on startup
      processReminders(app, remindersChannel);
    } else {
      console.warn('SLACK_REMINDERS_CHANNEL not set - reminder notifications disabled');
    }
  } catch (error) {
    console.error('Failed to start Slack bot:', error);
    updateStatus({ connected: false, error: error.message });
    process.exit(1);
  }
})();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down Slack bot...');
  updateStatus({ connected: false });
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down Slack bot...');
  updateStatus({ connected: false });
  process.exit(0);
});
