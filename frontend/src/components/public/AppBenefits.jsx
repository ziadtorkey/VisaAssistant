function AppBenefits() {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Why Use Our Visa Assistant?
        </h2>
        <p className="text-lg text-gray-600">
          Get accurate, up-to-date visa requirements in seconds
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Benefit 1: AI-Powered Search */}
        <div className="text-center p-6 rounded-lg bg-gradient-to-br from-teal-50 to-teal-100 hover:shadow-md transition-shadow">
          <div className="mb-4 flex justify-center">
            <svg className="w-16 h-16 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            AI-Powered Search
          </h3>
          <p className="text-gray-700">
            Our advanced AI searches official embassy websites and government sources to provide you with the most accurate visa requirements
          </p>
        </div>

        {/* Benefit 2: Up-to-Date Information */}
        <div className="text-center p-6 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-md transition-shadow">
          <div className="mb-4 flex justify-center">
            <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Always Current
          </h3>
          <p className="text-gray-700">
            We regularly update our database to ensure you receive the latest visa requirements and policy changes
          </p>
        </div>

        {/* Benefit 3: Comprehensive Requirements */}
        <div className="text-center p-6 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-md transition-shadow">
          <div className="mb-4 flex justify-center">
            <svg className="w-16 h-16 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Complete Details
          </h3>
          <p className="text-gray-700">
            Get comprehensive information including required documents, application steps, fees, processing times, and embassy contact details
          </p>
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800 text-center">
          <strong>Important:</strong> While we strive for accuracy, always verify requirements with official embassy sources before applying for a visa.
        </p>
      </div>
    </div>
  );
}

export default AppBenefits;
