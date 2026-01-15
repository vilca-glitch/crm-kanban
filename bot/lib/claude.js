const Anthropic = require('@anthropic-ai/sdk');

// Validate API key before creating client
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY environment variable is not set');
  console.error('The bot will use fallback task parsing (message as title)');
}

// Use configurable model or default to latest Haiku
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-3-5-haiku-20241022';

let anthropic = null;
if (process.env.ANTHROPIC_API_KEY) {
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

const SYSTEM_PROMPT = `You are a helpful assistant that parses natural language messages into structured task data for a CRM Kanban board.

When given a message, extract the following fields if present:
- title: The main task title (required)
- client: The client name if mentioned
- priority: "high", "medium", or "low" (default to "medium" if not specified)
- dueDate: ISO date string if a date is mentioned (format: YYYY-MM-DD)
- checklist: Array of checklist items if subtasks are mentioned

Return ONLY valid JSON with these fields. Do not include any explanatory text.

Examples:
Input: "Create a proposal for Acme Corp, high priority, due Friday"
Output: {"title": "Create proposal", "client": "Acme Corp", "priority": "high", "dueDate": "2024-01-19", "checklist": []}

Input: "Follow up with John at TechStart about the demo. Need to: send pricing, schedule call, prepare slides"
Output: {"title": "Follow up about demo", "client": "TechStart", "priority": "medium", "checklist": [{"text": "Send pricing"}, {"text": "Schedule call"}, {"text": "Prepare slides"}]}

Input: "urgent: fix bug in login page"
Output: {"title": "Fix bug in login page", "priority": "high", "checklist": []}`;

function createFallbackTask(message) {
  // Simple fallback: use message as title, detect priority keywords
  const lowerMessage = message.toLowerCase();
  let priority = 'medium';

  if (lowerMessage.includes('urgent') || lowerMessage.includes('asap') || lowerMessage.includes('high priority')) {
    priority = 'high';
  } else if (lowerMessage.includes('low priority') || lowerMessage.includes('when you can')) {
    priority = 'low';
  }

  return {
    title: message.substring(0, 100).trim() || 'New Task',
    priority,
    checklist: [],
  };
}

async function parseTaskFromMessage(message, existingClients = []) {
  // If no API key, use fallback immediately
  if (!anthropic) {
    console.warn('Claude API not available, using fallback task parsing');
    return createFallbackTask(message);
  }

  try {
    const clientContext = existingClients.length > 0
      ? `\n\nExisting clients in the system: ${existingClients.join(', ')}. If the message mentions a client similar to one of these, use the existing client name.`
      : '';

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 500,
      system: SYSTEM_PROMPT + clientContext,
      messages: [
        {
          role: 'user',
          content: `Parse this message into a task: "${message}"\n\nToday's date is ${new Date().toISOString().split('T')[0]}`,
        },
      ],
    });

    // Validate response structure
    if (!response || !response.content || !response.content[0]) {
      throw new Error('Empty response from Claude');
    }

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error(`Unexpected response type: ${content.type}`);
    }

    // Parse JSON with try-catch
    let taskData;
    try {
      taskData = JSON.parse(content.text);
    } catch (parseError) {
      console.error('Failed to parse JSON from Claude:', content.text);
      return createFallbackTask(message);
    }

    // Validate required fields
    if (!taskData.title) {
      taskData.title = message.substring(0, 100).trim() || 'New Task';
    }

    // Ensure priority is valid
    if (!['high', 'medium', 'low'].includes(taskData.priority)) {
      taskData.priority = 'medium';
    }

    // Ensure checklist items have proper structure
    if (taskData.checklist && Array.isArray(taskData.checklist)) {
      taskData.checklist = taskData.checklist
        .filter(item => item) // Remove null/undefined
        .map((item, index) => {
          const text = typeof item === 'string' ? item : (item?.text || '');
          return text ? {
            id: `temp-${index}`,
            text: text.trim(),
            completed: false,
          } : null;
        })
        .filter(Boolean); // Remove items with empty text
    } else {
      taskData.checklist = [];
    }

    return taskData;
  } catch (error) {
    // Check for rate limit errors
    if (error.status === 429) {
      console.error('Claude API rate limit exceeded');
    } else {
      console.error('Error parsing task with Claude:', error.message);
    }

    // Fallback: create a basic task with the message as title
    return createFallbackTask(message);
  }
}

async function generateTaskSummary(tasks) {
  // If no API key, use simple summary
  if (!anthropic) {
    return 'Here are your current tasks.';
  }

  try {
    if (!tasks || tasks.length === 0) {
      return 'No tasks to summarize.';
    }

    const taskList = tasks
      .map(t => `- ${t.title} (${t.priority} priority, ${t.client || 'no client'})`)
      .join('\n');

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Summarize these tasks in a brief, friendly message:\n${taskList}`,
        },
      ],
    });

    // Validate response
    if (!response || !response.content || !response.content[0]) {
      return 'Here are your current tasks.';
    }

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text;
    }

    return 'Here are your current tasks.';
  } catch (error) {
    console.error('Error generating summary:', error.message);
    return 'Here are your current tasks.';
  }
}

module.exports = {
  parseTaskFromMessage,
  generateTaskSummary,
};
