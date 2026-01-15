'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, Clock, MessageSquare } from 'lucide-react';

interface Activity {
  id: string;
  timestamp: string;
  userRequest: string;
  botAction: string;
  success: boolean;
  error: string | null;
}

export default function TranscriptPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const fetchActivities = async (reset = false) => {
    try {
      const offset = reset ? 0 : activities.length;
      const response = await fetch(`/api/bot/activity?limit=50&offset=${offset}`);
      const data = await response.json();

      if (reset) {
        setActivities(data.activities);
      } else {
        setActivities((prev) => [...prev, ...data.activities]);
      }
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivities(true);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchActivities(true);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Transcript</h1>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-gray-500">Loading activity log...</div>
          </div>
        ) : activities.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h2>
            <p className="text-gray-500">
              Bot activity will appear here when you use the Slack bot.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={`bg-white rounded-lg shadow-sm border p-4 ${
                  !activity.success ? 'border-l-4 border-l-red-400' : ''
                }`}
              >
                {/* User Request */}
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    User Request
                  </div>
                  <div className="text-gray-900 font-medium">{activity.userRequest}</div>
                </div>

                {/* Time */}
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Time
                  </div>
                  <div className="flex items-center gap-1 text-gray-600 text-sm">
                    <Clock className="w-4 h-4" />
                    {formatTime(activity.timestamp)}
                  </div>
                </div>

                {/* Bot Action */}
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Bot Action
                  </div>
                  <div className="flex items-start gap-2">
                    {activity.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <div className={activity.success ? 'text-gray-700' : 'text-red-700'}>
                        {activity.botAction}
                      </div>
                      {activity.error && (
                        <div className="text-sm text-red-500 mt-1">{activity.error}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Load More */}
            {hasMore && (
              <button
                onClick={() => fetchActivities(false)}
                className="w-full py-3 text-center text-blue-600 hover:text-blue-700 bg-white rounded-lg shadow-sm border hover:bg-gray-50 transition-colors"
              >
                Load more
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
