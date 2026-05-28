import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[80vh] bg-transparent text-gray-800 dark:text-gray-200">
      <h1 className="text-8xl font-extrabold mb-4 text-blue-600 dark:text-blue-500">404</h1>
      <p className="text-3xl font-semibold mb-6">Oops! Page not found.</p>
      <p className="text-gray-500 dark:text-gray-400 mb-8 text-center max-w-md text-lg">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link 
        to="/" 
        className="px-8 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:shadow-xl hover:-translate-y-1 transform transition-all duration-300 font-semibold text-lg"
      >
        Return to Home
      </Link>
    </div>
  );
};

export default NotFound;
