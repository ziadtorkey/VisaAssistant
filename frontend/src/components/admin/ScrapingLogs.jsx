import { useState, useEffect } from 'react';
import { getLogs } from '../../services/api';

function ScrapingLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, success, failure

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await getLogs(200);
      setLogs(response.data);
    } catch (err) {
      setError('Failed to load logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    return log.status === filter;
  });

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center py-8">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Scraping Logs</h1>
        <button
          onClick={fetchLogs}
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow p-1 inline-flex">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          All ({logs.length})
        </button>
        <button
          onClick={() => setFilter('success')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            filter === 'success'
              ? 'bg-green-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Success ({logs.filter((l) => l.status === 'success').length})
        </button>
        <button
          onClick={() => setFilter('failure')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            filter === 'failure'
              ? 'bg-red-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Failures ({logs.filter((l) => l.status === 'failure').length})
        </button>
      </div>

      {/* Logs List */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">No logs to display</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`p-6 ${
                  log.status === 'success' ? 'bg-white' : 'bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          log.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {log.status}
                      </span>
                      <p className="text-sm font-medium text-gray-900">
                        {log.passport_country} → {log.destination_country}
                      </p>
                    </div>

                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>

                    {log.error_message && (
                      <div className="mt-3 p-3 bg-red-100 rounded-md">
                        <p className="text-sm text-red-800">
                          <strong>Error:</strong> {log.error_message}
                        </p>
                      </div>
                    )}

                    {log.scraped_urls && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-700 mb-1">
                          Scraped URLs:
                        </p>
                        <div className="text-xs text-gray-600 space-y-1">
                          {JSON.parse(log.scraped_urls).map((url, index) => (
                            <a
                              key={index}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-blue-600 hover:underline truncate"
                            >
                              {url}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ScrapingLogs;