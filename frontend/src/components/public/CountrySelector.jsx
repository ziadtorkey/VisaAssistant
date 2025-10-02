import { useState, useEffect, useRef } from 'react';
import { getCountries, getVisaRequirements, getScrapingStatus } from '../../services/api';
import VisaResults from './VisaResults';
import SearchableSelect from '../common/SearchableSelect';

function CountrySelector() {
  const [countries, setCountries] = useState([]);
  const [passportCountry, setPassportCountry] = useState('');
  const [residenceCountry, setResidenceCountry] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState(null);
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    fetchCountries();
    return () => {
      // Cleanup polling on unmount
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const fetchCountries = async () => {
    try {
      const response = await getCountries();
      setCountries(response.data);
    } catch (err) {
      console.error('Error fetching countries:', err);
      setError('Failed to load countries');
    }
  };

  const pollScrapingStatus = async (requestId) => {
    try {
      const response = await getScrapingStatus(requestId);

      if (response.data.status === 'completed') {
        // Stop polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        // Display results
        setResults(response.data);
        setLoading(false);
        setLoadingMessage('');
      } else if (response.data.status === 'failed') {
        // Stop polling and show error
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        setError(response.data.error || 'Failed to gather visa requirements');
        setResults(null); // Clear any previous results
        setLoading(false);
        setLoadingMessage('');
      } else {
        // Still pending, update message
        setResults(null); // Make sure results are cleared while loading
        setLoadingMessage(response.data.message || 'Gathering visa requirement information...');
      }
    } catch (err) {
      console.error('Error polling status:', err);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setError('Failed to check scraping status');
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    setLoadingMessage('Checking visa requirements...');

    try {
      const response = await getVisaRequirements(
        passportCountry,
        residenceCountry,
        destinationCountry
      );

      // Check if scraping was triggered
      if (response.data.scraping && response.data.requestId) {
        setLoadingMessage(response.data.message || 'Gathering visa requirement information...');

        // Start polling for status
        pollingIntervalRef.current = setInterval(() => {
          pollScrapingStatus(response.data.requestId);
        }, 3000); // Poll every 3 seconds
      } else {
        // Data already available
        setResults(response.data);
        setLoading(false);
        setLoadingMessage('');
      }
    } catch (err) {
      console.error('Error fetching visa requirements:', err);
      setError('Failed to fetch visa requirements');
      setLoading(false);
      setLoadingMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Visa Requirements Checker
          </h1>
          <p className="text-gray-600">
            Find visa requirements and documentation for international travel
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <SearchableSelect
              label="Passport Country"
              value={passportCountry}
              onChange={setPassportCountry}
              options={countries.map(c => ({ value: c.code, label: c.name }))}
              placeholder="Select your passport country"
              required={true}
            />

            <SearchableSelect
              label="Country of Residence"
              value={residenceCountry}
              onChange={setResidenceCountry}
              options={countries.map(c => ({ value: c.code, label: c.name }))}
              placeholder="Select your country of residence"
              required={true}
            />

            <SearchableSelect
              label="Destination Country"
              value={destinationCountry}
              onChange={setDestinationCountry}
              options={countries.map(c => ({ value: c.code, label: c.name }))}
              placeholder="Select your destination"
              required={true}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Loading...' : 'Get Visa Requirements'}
            </button>
          </form>

          {loading && loadingMessage && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                <p className="text-blue-800">{loadingMessage}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>

        {results && <VisaResults data={results} />}
      </div>
    </div>
  );
}

export default CountrySelector;