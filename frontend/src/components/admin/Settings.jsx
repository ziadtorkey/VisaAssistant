import { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../../services/api';

function Settings() {
  const [settings, setSettings] = useState({
    data_expiry_days: '14',
    scraping_retry_attempts: '3',
    scraping_delay_ms: '2000',
    ai_scraper: 'perplexity'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await getSettings();
      setSettings(response.data);
    } catch (err) {
      setError('Failed to load settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await updateSettings(settings);
      setSuccess(true);
    } catch (err) {
      setError('Failed to save settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Expiry Period (days)
            </label>
            <input
              type="number"
              value={settings.data_expiry_days}
              onChange={(e) =>
                handleChange('data_expiry_days', e.target.value)
              }
              className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Number of days before data is considered stale
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scraping Retry Attempts
            </label>
            <input
              type="number"
              value={settings.scraping_retry_attempts}
              onChange={(e) =>
                handleChange('scraping_retry_attempts', e.target.value)
              }
              className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="10"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Number of times to retry failed scraping attempts
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scraping Delay (milliseconds)
            </label>
            <input
              type="number"
              value={settings.scraping_delay_ms}
              onChange={(e) =>
                handleChange('scraping_delay_ms', e.target.value)
              }
              className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1000"
              step="100"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Delay between scraping requests (respectful crawling)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Scraper
            </label>
            <select
              value={settings.ai_scraper}
              onChange={(e) => handleChange('ai_scraper', e.target.value)}
              className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="perplexity">Perplexity (Web Search - More Accurate)</option>
              <option value="openai">OpenAI (GPT-3.5 - Faster, Less Accurate)</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Choose AI service for scraping visa requirements
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Note: Perplexity requires PERPLEXITY_API_KEY in .env
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800">Settings saved successfully!</p>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white py-2 px-6 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Settings;