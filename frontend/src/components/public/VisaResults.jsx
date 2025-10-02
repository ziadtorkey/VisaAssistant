function VisaResults({ data }) {
  if (!data.available) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-yellow-900 mb-2">
          Information Not Available
        </h2>
        <p className="text-yellow-800">{data.message}</p>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-6 no-print">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Visa Requirements
          </h2>
          <p className="text-sm text-gray-600">
            Last updated: {formatDate(data.lastUpdated)} ({data.daysOld} days ago)
          </p>
          {data.statusMessage && (
            <p className="text-sm text-yellow-600 mt-1">{data.statusMessage}</p>
          )}
        </div>
        <button
          onClick={handlePrint}
          className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
        >
          Print Checklist
        </button>
      </div>

      {/* Show message if no data has been scraped yet */}
      {!data.visaStatus && data.requiredDocuments.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            📋 Visa Information Available - Data Not Yet Loaded
          </h3>
          <p className="text-blue-800 mb-4">
            This visa requirement combination exists in our database, but the detailed information hasn't been gathered yet.
          </p>
          <p className="text-blue-700 text-sm">
            <strong>For administrators:</strong> Visit the admin panel to scrape visa requirements using OpenAI, or this data can be manually added.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* Visa Status */}
        {data.visaStatus && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Visa Status
            </h3>
            <div className={`inline-block px-4 py-2 rounded-md font-medium ${
              data.visaStatus === 'not_required' ? 'bg-green-100 text-green-800' :
              data.visaStatus === 'visa_on_arrival' ? 'bg-blue-100 text-blue-800' :
              data.visaStatus === 'evisa' ? 'bg-purple-100 text-purple-800' :
              'bg-red-100 text-red-800'
            }`}>
              {data.visaStatus.replace(/_/g, ' ').toUpperCase()}
            </div>
          </div>
        )}

        {/* Required Documents */}
        {data.requiredDocuments && data.requiredDocuments.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Required Documents
            </h3>
            <ul className="space-y-2">
              {data.requiredDocuments.map((doc, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">{doc}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Application Steps */}
        {data.applicationSteps && data.applicationSteps.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Application Process
            </h3>
            <ol className="space-y-2">
              {data.applicationSteps.map((step, index) => (
                <li key={index} className="flex items-start">
                  <span className="font-semibold text-blue-600 mr-2">
                    {index + 1}.
                  </span>
                  <span className="text-gray-700">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Key Information */}
        <div className="grid md:grid-cols-2 gap-4">
          {data.applicationLocation && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">
                Where to Apply
              </h4>
              <p className="text-gray-700">{data.applicationLocation}</p>
            </div>
          )}

          {data.visaFee && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Visa Fee</h4>
              <p className="text-gray-700">{data.visaFee}</p>
            </div>
          )}

          {data.processingTime && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">
                Processing Time
              </h4>
              <p className="text-gray-700">{data.processingTime}</p>
            </div>
          )}
        </div>

        {/* Contact Information */}
        {data.contactInfo && Object.keys(data.contactInfo).length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Contact Information
            </h3>
            <div className="bg-gray-50 p-4 rounded-md space-y-2">
              {data.contactInfo.embassy && (
                <p className="text-gray-700">
                  <span className="font-medium">Embassy:</span>{' '}
                  {data.contactInfo.embassy}
                </p>
              )}
              {data.contactInfo.address && (
                <p className="text-gray-700">
                  <span className="font-medium">Address:</span>{' '}
                  {data.contactInfo.address}
                </p>
              )}
              {data.contactInfo.phone && (
                <p className="text-gray-700">
                  <span className="font-medium">Phone:</span>{' '}
                  {data.contactInfo.phone}
                </p>
              )}
              {data.contactInfo.email && (
                <p className="text-gray-700">
                  <span className="font-medium">Email:</span>{' '}
                  {data.contactInfo.email}
                </p>
              )}
              {data.contactInfo.website && (
                <p className="text-gray-700">
                  <span className="font-medium">Website:</span>{' '}
                  <a
                    href={data.contactInfo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {data.contactInfo.website}
                  </a>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Useful Links */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Official Resources
          </h3>
          <div className="space-y-2">
            {data.contactInfo?.website && (
              <a
                href={data.contactInfo.website}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:underline"
              >
                Official Embassy Website →
              </a>
            )}
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(data.destinationCountry + ' visa application ' + data.residenceCountry)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-600 hover:underline"
            >
              Search for Visa Application Process →
            </a>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent('VFS Global ' + data.destinationCountry + ' ' + data.residenceCountry)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-600 hover:underline"
            >
              Search for VFS Global Center →
            </a>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-sm text-yellow-800 mb-2">
            <strong>⚠️ Important Disclaimer:</strong>
          </p>
          <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
            <li>This information is provided for reference only</li>
            <li>Visa requirements can change without notice</li>
            <li><strong>Always verify with official sources:</strong> embassy websites, VFS Global, or official visa application centers</li>
            <li>Application procedures may differ based on your specific situation</li>
            <li>We are not responsible for any inaccuracies or changes in requirements</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default VisaResults;