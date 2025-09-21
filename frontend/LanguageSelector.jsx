import React, { useState } from 'react';

function LanguageSelector() {
  const [language, setLanguage] = useState('en');

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    // Implement language change logic here
    console.log('Language changed to:', e.target.value);
  };

  return (
    <div className="container mx-auto">
      <label htmlFor="language" className="block text-gray-700 text-sm font-bold mb-2">Select Language:</label>
      <select
        id="language"
        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        value={language}
        onChange={handleLanguageChange}
      >
        <option value="en">English</option>
        <option value="hi">Hindi</option>
        <option value="te">Telugu</option>
        <option value="ta">Tamil</option>
        <option value="bn">Bengali</option>
      </select>
    </div>
  );
}

export default LanguageSelector;