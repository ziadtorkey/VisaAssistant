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
      // Ensure we always set an array
      setCountries(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching countries:', err);
      setCountries([]); // Set empty array on error
      setError('Failed to load countries. Please check if the backend is running.');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 relative overflow-hidden">
      {/* World map dotted pattern background */}
      <div className="absolute inset-0 opacity-15 pointer-events-none flex items-center justify-center">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_%28blue_dots%29.svg"
          alt="World map dotted background"
          className="w-full h-full object-contain"
          style={{ filter: 'grayscale(100%) brightness(0.7)' }}
        />
      </div>

      {/* Decorative dotted patterns */}
      <div className="absolute top-10 left-10 w-32 h-32 opacity-20">
        <div className="w-full h-full" style={{
          backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
          backgroundSize: '8px 8px'
        }}></div>
      </div>
      <div className="absolute top-20 right-20 w-40 h-40 opacity-20">
        <div className="w-full h-full" style={{
          backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
          backgroundSize: '8px 8px'
        }}></div>
      </div>
      <div className="absolute bottom-32 left-1/4 w-36 h-36 opacity-15">
        <div className="w-full h-full" style={{
          backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
          backgroundSize: '8px 8px'
        }}></div>
      </div>

      {/* Circular background images */}
      <div className="absolute top-8 right-32 w-64 h-64 rounded-full overflow-hidden shadow-2xl z-0">
        <img
          src="https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600&h=600&fit=crop"
          alt="City skyline"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="absolute top-64 right-16 w-56 h-56 rounded-full overflow-hidden shadow-2xl z-0">
        <img
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=600&fit=crop"
          alt="Park landscape"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-left mb-10">
          <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">VISA REQUIREMENTS</p>
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-3 leading-tight">
            Adventure &<br />
            Experience<br />
            The Travel !
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-1">
              <SearchableSelect
                label="Passport Country"
                value={passportCountry}
                onChange={setPassportCountry}
                options={countries.map(c => ({ value: c.code, label: c.name }))}
                placeholder="Insert keyword"
                required={true}
              />
            </div>

            <div className="md:col-span-1">
              <SearchableSelect
                label="Country of Residence"
                value={residenceCountry}
                onChange={setResidenceCountry}
                options={countries.map(c => ({ value: c.code, label: c.name }))}
                placeholder="All Destinations"
                required={true}
              />
            </div>

            <div className="md:col-span-1">
              <SearchableSelect
                label="Destination Country"
                value={destinationCountry}
                onChange={setDestinationCountry}
                options={countries.map(c => ({ value: c.code, label: c.name }))}
                placeholder="All Typologies"
                required={true}
              />
            </div>

            <div className="md:col-span-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3.5 px-8 rounded-lg font-semibold uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                {loading ? 'Loading...' : 'SEARCH'}
              </button>
            </div>
          </form>

          {loading && loadingMessage && (
            <div className="mt-6 p-4 bg-teal-50 border border-teal-200 rounded-lg">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600 mr-3"></div>
                <p className="text-teal-800 font-medium">{loadingMessage}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}
        </div>

        {results && <VisaResults data={results} />}

        {/* Top 10 Most Visited Countries Section */}
        {!results && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mt-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              Top 10 Most Visited Countries
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                { name: 'France', visitors: '89M', code: 'fr', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop' },
                { name: 'Spain', visitors: '83M', code: 'es', image: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=400&h=300&fit=crop' },
                { name: 'USA', visitors: '79M', code: 'us', image: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=400&h=300&fit=crop' },
                { name: 'China', visitors: '66M', code: 'cn', image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400&h=300&fit=crop' },
                { name: 'Italy', visitors: '64M', code: 'it', image: 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=400&h=300&fit=crop' },
                { name: 'Turkey', visitors: '51M', code: 'tr', image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=400&h=300&fit=crop' },
                { name: 'Mexico', visitors: '45M', code: 'mx', image: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=400&h=300&fit=crop' },
                { name: 'Thailand', visitors: '40M', code: 'th', image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=300&fit=crop' },
                { name: 'Germany', visitors: '39M', code: 'de', image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&h=300&fit=crop' },
                { name: 'UK', visitors: '36M', code: 'gb', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop' }
              ].map((country, index) => (
                <div key={index} className="group cursor-pointer">
                  <div className="relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300">
                    <img
                      src={country.image}
                      alt={country.name}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
                      <img
                        src={`https://flagcdn.com/w80/${country.code}.png`}
                        srcSet={`https://flagcdn.com/w160/${country.code}.png 2x`}
                        width="60"
                        alt={`${country.name} flag`}
                        className="mb-2 rounded shadow-md"
                      />
                      <h3 className="text-white font-bold text-xl">{country.name}</h3>
                      <p className="text-teal-300 text-sm font-medium">{country.visitors} visitors/year</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CountrySelector;