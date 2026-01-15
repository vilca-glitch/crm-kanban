const axios = require('axios');

const CRM_BASE_URL = process.env.CRM_API_URL || 'http://localhost:3000';

if (!process.env.CRM_API_URL) {
  console.warn('CRM_API_URL not set, defaulting to http://localhost:3000');
}

const crmClient = axios.create({
  baseURL: CRM_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

async function createTask(taskData) {
  try {
    const response = await crmClient.post('/api/tasks', taskData);
    if (!response || !response.data) {
      throw new Error('Invalid response from API');
    }
    return response.data;
  } catch (error) {
    const statusCode = error.response?.status;
    const message = error.response?.data?.error || error.message;
    console.error('Error creating task:', { statusCode, message });
    return { success: false, error: message };
  }
}

async function getStages() {
  try {
    const response = await crmClient.get('/api/stages');
    if (!response || !response.data) {
      throw new Error('Invalid response from API');
    }
    return response.data;
  } catch (error) {
    const statusCode = error.response?.status;
    const message = error.response?.data?.error || error.message;
    console.error('Error fetching stages:', { statusCode, message });
    return [];
  }
}

async function getClients() {
  try {
    const response = await crmClient.get('/api/clients');
    if (!response || !response.data) {
      throw new Error('Invalid response from API');
    }
    return response.data;
  } catch (error) {
    const statusCode = error.response?.status;
    const message = error.response?.data?.error || error.message;
    console.error('Error fetching clients:', { statusCode, message });
    return [];
  }
}

async function getTasks(filters = {}) {
  try {
    const params = {};
    if (filters.client) params.client = filters.client;
    if (filters.priority) params.priority = filters.priority;
    if (filters.stageId) params.stageId = filters.stageId;

    const response = await crmClient.get('/api/tasks', { params });
    if (!response || !response.data) {
      throw new Error('Invalid response from API');
    }
    return response.data;
  } catch (error) {
    const statusCode = error.response?.status;
    const message = error.response?.data?.error || error.message;
    console.error('Error fetching tasks:', { statusCode, message });
    return [];
  }
}

async function updateTask(taskId, updates) {
  try {
    const response = await crmClient.patch(`/api/tasks/${taskId}`, updates);
    if (!response || !response.data) {
      throw new Error('Invalid response from API');
    }
    return response.data;
  } catch (error) {
    const statusCode = error.response?.status;
    const message = error.response?.data?.error || error.message;
    console.error('Error updating task:', { statusCode, message });
    return { success: false, error: message };
  }
}

async function deleteTask(taskId) {
  try {
    const response = await crmClient.delete(`/api/tasks/${taskId}`);
    if (!response || !response.data) {
      throw new Error('Invalid response from API');
    }
    return response.data;
  } catch (error) {
    const statusCode = error.response?.status;
    const message = error.response?.data?.error || error.message;
    console.error('Error deleting task:', { statusCode, message });
    return { success: false, error: message };
  }
}

module.exports = {
  createTask,
  getStages,
  getClients,
  getTasks,
  updateTask,
  deleteTask,
};
