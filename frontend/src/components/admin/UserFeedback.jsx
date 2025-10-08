import { useState, useEffect } from 'react';
import { getAllFeedback, markFeedbackAsRead, deleteFeedback, getFeedbackStats } from '../../services/api';

function UserFeedback() {
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState({ total: 0, unread: 0, read: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchFeedback();
    fetchStats();
  }, [currentPage, statusFilter]);

  const fetchStats = async () => {
    try {
      const response = await getFeedbackStats();
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching feedback stats:', err);
    }
  };

  const fetchFeedback = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 20
      });

      if (statusFilter) {
        queryParams.append('status', statusFilter);
      }

      const response = await getAllFeedback(queryParams.toString());
      setFeedback(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
    } catch (err) {
      console.error('Error fetching feedback:', err);
      setError('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markFeedbackAsRead(id);
      fetchFeedback();
      fetchStats();
    } catch (err) {
      console.error('Error marking feedback as read:', err);
      alert('Failed to mark feedback as read');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this feedback?')) {
      return;
    }

    try {
      await deleteFeedback(id);
      fetchFeedback();
      fetchStats();
    } catch (err) {
      console.error('Error deleting feedback:', err);
      alert('Failed to delete feedback');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && feedback.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">User Feedback</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Feedback</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.total || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Unread</h3>
          <p className="text-3xl font-bold text-orange-600">{stats.unread || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Read</h3>
          <p className="text-3xl font-bold text-green-600">{stats.read || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-4 items-center">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Feedback List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {feedback.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No feedback found
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {feedback.map((item) => (
              <div
                key={item.id}
                className={`p-6 ${item.status === 'unread' ? 'bg-yellow-50' : 'bg-white'}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.status === 'unread'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {item.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {item.email}
                    </p>
                    {(item.passport_country || item.residence_country || item.destination_country) && (
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Context:</strong>{' '}
                        {item.passport_country} → {item.destination_country}
                        {item.residence_country && item.residence_country !== item.passport_country && (
                          <span> (residing in {item.residence_country})</span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {item.status === 'unread' && (
                      <button
                        onClick={() => handleMarkAsRead(item.id)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                      >
                        Mark as Read
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 mt-3">
                  <p className="text-gray-800 whitespace-pre-wrap">{item.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default UserFeedback;
