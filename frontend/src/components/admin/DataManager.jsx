import { useState, useEffect } from 'react';
import {
  getAllVisaRequirements,
  getAllCountries,
  deleteVisaRequirement,
  scrapeRequirement
} from '../../services/api';
import SearchableSelect from '../common/SearchableSelect';

function DataManager() {
  const [requirements, setRequirements] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scrapingId, setScrapingId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10);

  // Filter state
  const [filters, setFilters] = useState({
    passportCountryId: '',
    residenceCountryId: '',
    destinationCountryId: '',
    dataStatus: ''
  });

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    fetchRequirements();
  }, [currentPage, filters]);

  const fetchCountries = async () => {
    try {
      const response = await getAllCountries();
      setCountries(response.data);
    } catch (err) {
      console.error('Failed to load countries:', err);
    }
  };

  const fetchRequirements = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
        ...(filters.passportCountryId && { passportCountryId: filters.passportCountryId }),
        ...(filters.residenceCountryId && { residenceCountryId: filters.residenceCountryId }),
        ...(filters.destinationCountryId && { destinationCountryId: filters.destinationCountryId }),
        ...(filters.dataStatus && { dataStatus: filters.dataStatus })
      });

      const response = await getAllVisaRequirements(params.toString());
      setRequirements(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
      setTotalCount(response.data.pagination.total);
    } catch (err) {
      setError('Failed to load visa requirements');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleClearFilters = () => {
    setFilters({
      passportCountryId: '',
      residenceCountryId: '',
      destinationCountryId: '',
      dataStatus: ''
    });
    setCurrentPage(1);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this requirement?')) {
      return;
    }

    try {
      await deleteVisaRequirement(id);
      setRequirements(requirements.filter((r) => r.id !== id));
    } catch (err) {
      alert('Failed to delete requirement');
      console.error(err);
    }
  };

  const handleScrape = async (id, force = false) => {
    try {
      setScrapingId(id);
      await scrapeRequirement(id, force);

      if (force) {
        alert('Rescraping started! The data will be refreshed automatically when ready (may take 30-60 seconds).');

        // Poll for updated data every 5 seconds for up to 2 minutes
        let attempts = 0;
        const maxAttempts = 24; // 2 minutes / 5 seconds

        const pollInterval = setInterval(async () => {
          attempts++;

          try {
            await fetchRequirements();

            // Check if the specific requirement has been updated
            const updatedReq = requirements.find(r => r.id === id);
            if (updatedReq && updatedReq.data_status === 'fresh') {
              clearInterval(pollInterval);
              setScrapingId(null);
              alert('Rescraping completed successfully!');
            }

            if (attempts >= maxAttempts) {
              clearInterval(pollInterval);
              setScrapingId(null);
              alert('Rescraping is taking longer than expected. Please check the logs or refresh manually.');
            }
          } catch (err) {
            console.error('Error polling for updates:', err);
          }
        }, 5000);
      } else {
        alert('Scraping started! Check logs for updates.');
        setScrapingId(null);
      }
    } catch (err) {
      alert('Failed to start scraping');
      console.error(err);
      setScrapingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'fresh':
        return 'bg-green-100 text-green-800';
      case 'stale':
        return 'bg-yellow-100 text-yellow-800';
      case 'unavailable':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center py-8">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Data Management</h1>
        <p className="text-gray-600">{totalCount.toLocaleString()} total combinations</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          <button
            onClick={handleClearFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear All
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SearchableSelect
            label="Passport Country"
            value={filters.passportCountryId}
            onChange={(value) => handleFilterChange('passportCountryId', value)}
            options={[
              { value: '', label: 'All Countries' },
              ...countries.map(c => ({ value: c.id.toString(), label: `${c.name} (${c.code})` }))
            ]}
            placeholder="All Countries"
          />

          <SearchableSelect
            label="Residence Country"
            value={filters.residenceCountryId}
            onChange={(value) => handleFilterChange('residenceCountryId', value)}
            options={[
              { value: '', label: 'All Countries' },
              ...countries.map(c => ({ value: c.id.toString(), label: `${c.name} (${c.code})` }))
            ]}
            placeholder="All Countries"
          />

          <SearchableSelect
            label="Destination Country"
            value={filters.destinationCountryId}
            onChange={(value) => handleFilterChange('destinationCountryId', value)}
            options={[
              { value: '', label: 'All Countries' },
              ...countries.map(c => ({ value: c.id.toString(), label: `${c.name} (${c.code})` }))
            ]}
            placeholder="All Countries"
          />

          <SearchableSelect
            label="Data Status"
            value={filters.dataStatus}
            onChange={(value) => handleFilterChange('dataStatus', value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'fresh', label: 'Fresh' },
              { value: 'stale', label: 'Stale' },
              { value: 'unavailable', label: 'Unavailable' }
            ]}
            placeholder="All Statuses"
          />
        </div>
      </div>

      {/* Table */}
      {requirements.length === 0 && !loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">No visa requirements found with current filters.</p>
          <p className="text-sm text-gray-500 mt-2">
            Try adjusting your filters or clear them to see all data.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From → To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visa Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : (
                  requirements.map((req) => (
                    <tr key={req.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {req.passport_country} → {req.destination_country}
                        </div>
                        <div className="text-xs text-gray-500">
                          Residence: {req.residence_country}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {req.visa_status?.replace(/_/g, ' ') || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(req.last_updated)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            req.data_status
                          )}`}
                        >
                          {req.data_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleScrape(req.id, false)}
                          disabled={scrapingId === req.id}
                          className="text-blue-600 hover:text-blue-900 disabled:text-gray-400"
                        >
                          {scrapingId === req.id ? 'Scraping...' : 'Scrape'}
                        </button>
                        <button
                          onClick={() => handleScrape(req.id, true)}
                          disabled={scrapingId === req.id}
                          className="text-green-600 hover:text-green-900 disabled:text-gray-400"
                        >
                          Rescrape
                        </button>
                        <button
                          onClick={() => handleDelete(req.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * pageSize, totalCount)}
                  </span>{' '}
                  of <span className="font-medium">{totalCount.toLocaleString()}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNum
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataManager;