'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface BotStatus {
  connected: boolean;
  lastPing: string | null;
  error: string | null;
}

export default function SettingsPage() {
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBotStatus = async () => {
    try {
      const response = await fetch('/api/bot/status');
      const data = await response.json();
      setBotStatus(data);
    } catch (error) {
      console.error('Failed to fetch bot status:', error);
      setBotStatus({
        connected: false,
        lastPing: null,
        error: 'Failed to fetch bot status',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBotStatus();

    // Poll every 30 seconds
    const interval = setInterval(fetchBotStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBotStatus();
  };

  const formatLastPing = (lastPing: string | null) => {
    if (!lastPing) return 'Never';
    const date = new Date(lastPing);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);

    if (diffSec < 60) return `${diffSec} seconds ago`;
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Slack Bot Integration */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-purple-600" fill="currentColor">
                  <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.124 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.52 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.124a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.52v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Slack Bot Integration</h2>
                <p className="text-sm text-gray-500">Create tasks directly from Slack</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading bot status...</div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Connection Status */}
              <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50">
                {botStatus?.connected ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <div>
                      <div className="font-medium text-green-700">Connected</div>
                      <div className="text-sm text-gray-500">
                        Last ping: {formatLastPing(botStatus.lastPing)}
                      </div>
                    </div>
                  </>
                ) : botStatus?.error ? (
                  <>
                    <XCircle className="w-6 h-6 text-red-500" />
                    <div>
                      <div className="font-medium text-red-700">Disconnected</div>
                      <div className="text-sm text-gray-500">{botStatus.error}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-6 h-6 text-yellow-500" />
                    <div>
                      <div className="font-medium text-yellow-700">Not Started</div>
                      <div className="text-sm text-gray-500">
                        Start the bot with: <code className="bg-gray-200 px-1 rounded">npm run bot</code>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Bot Commands */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Available Commands</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-purple-600">/task [description]</code>
                    <span className="text-gray-600">Create a new task</span>
                  </div>
                  <div className="flex gap-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-purple-600">@bot tasks</code>
                    <span className="text-gray-600">Show all tasks</span>
                  </div>
                  <div className="flex gap-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-purple-600">@bot clients</code>
                    <span className="text-gray-600">List all clients</span>
                  </div>
                  <div className="flex gap-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-purple-600">DM the bot</code>
                    <span className="text-gray-600">Send direct messages to create tasks</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Setup Instructions */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Setup Instructions</h2>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">1. Create a Slack App</h3>
              <p>Go to <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">api.slack.com/apps</a> and create a new app.</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-2">2. Enable Socket Mode</h3>
              <p>In your app settings, enable Socket Mode and generate an App-Level Token with <code className="bg-gray-100 px-1 rounded">connections:write</code> scope.</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-2">3. Configure Bot Permissions</h3>
              <p>Under OAuth & Permissions, add these Bot Token Scopes:</p>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li><code className="bg-gray-100 px-1 rounded">app_mentions:read</code></li>
                <li><code className="bg-gray-100 px-1 rounded">chat:write</code></li>
                <li><code className="bg-gray-100 px-1 rounded">commands</code></li>
                <li><code className="bg-gray-100 px-1 rounded">im:history</code></li>
                <li><code className="bg-gray-100 px-1 rounded">im:read</code></li>
                <li><code className="bg-gray-100 px-1 rounded">im:write</code></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-2">4. Add Environment Variables</h3>
              <p>Add these to your <code className="bg-gray-100 px-1 rounded">.env.local</code> file:</p>
              <pre className="bg-gray-100 p-3 rounded mt-2 overflow-x-auto">
{`SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
SLACK_SIGNING_SECRET=...
ANTHROPIC_API_KEY=sk-ant-...
CRM_API_URL=http://localhost:3000`}
              </pre>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-2">5. Start the Bot</h3>
              <p>Run <code className="bg-gray-100 px-1 rounded">npm run bot</code> to start the Slack bot, or <code className="bg-gray-100 px-1 rounded">npm run dev:all</code> to run both the CRM and bot together.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
