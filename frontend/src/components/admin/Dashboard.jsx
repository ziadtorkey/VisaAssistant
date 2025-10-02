import { useState, useEffect } from 'react';
import { getDashboard } from '../../services/api';

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await getDashboard();
      setData(response.data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center py-8">{error}</div>;
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Total Combinations
          </h3>
          <p className="text-3xl font-bold text-gray-900">
            {data.stats.totalCombinations}
          </p>
        </div>

        <div className="bg-green-50 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-green-700 mb-2">
            Fresh Data
          </h3>
          <p className="text-3xl font-bold text-green-900">
            {data.stats.freshData}
          </p>
        </div>

        <div className="bg-yellow-50 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-yellow-700 mb-2">
            Stale Data
          </h3>
          <p className="text-3xl font-bold text-yellow-900">
            {data.stats.staleData}
          </p>
        </div>

        <div className="bg-red-50 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-red-700 mb-2">
            Unavailable
          </h3>
          <p className="text-3xl font-bold text-red-900">
            {data.stats.unavailableData}
          </p>
        </div>
      </div>

      {/* Data Freshness */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Data Freshness
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Oldest Update</p>
            <p className="text-lg font-medium text-gray-900">
              {formatDate(data.stats.oldestUpdate)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Newest Update</p>
            <p className="text-lg font-medium text-gray-900">
              {formatDate(data.stats.newestUpdate)}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Failures */}
      {data.recentFailures && data.recentFailures.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Failures
          </h2>
          <div className="space-y-3">
            {data.recentFailures.map((log) => (
              <div
                key={log.id}
                className="border-l-4 border-red-500 bg-red-50 p-4"
              >
                <p className="font-medium text-gray-900">
                  {log.passport_country} → {log.destination_country}
                </p>
                <p className="text-sm text-red-600 mt-1">{log.error_message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(log.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Logs */}
      {data.recentLogs && data.recentLogs.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-2">
            {data.recentLogs.map((log) => (
              <div
                key={log.id}
                className={`flex items-center justify-between p-3 rounded ${
                  log.status === 'success'
                    ? 'bg-green-50'
                    : 'bg-red-50'
                }`}
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {log.passport_country} → {log.destination_country}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    log.status === 'success'
                      ? 'bg-green-200 text-green-800'
                      : 'bg-red-200 text-red-800'
                  }`}
                >
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;