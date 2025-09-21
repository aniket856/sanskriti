import React, { useState } from 'react';
import { generateItinerary } from './utils/apiHelpers';

function PlanningForm({ onItineraryGenerated }) {
  const [destination, setDestination] = useState('');
  const [budget, setBudget] = useState(5000);
  const [duration, setDuration] = useState(1);
  const [theme, setTheme] = useState('Heritage');

  const handleSubmit = async (e) => {
    e.preventDefault();

    let promptExtras = '';

    const prompt = `Create a detailed ${duration}-day itinerary for ${destination} with budget ₹${budget} focusing on ${theme} experiences. ${promptExtras} Format response as JSON with daily activities, costs, and safety tips.`;

    console.log('Prompt:', prompt);

    const itineraryData = await generateItinerary(destination, budget, duration, theme);
    console.log('Itinerary Data:', itineraryData);
    onItineraryGenerated(itineraryData);
  };

  return (
    <div className="container mx-auto">
      <h2 className="text-xl font-bold">Plan Your Trip</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="destination" className="block text-gray-700 text-sm font-bold mb-2">Destination:</label>
          <select
            id="destination"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          >
            <option value="">Select Destination</option>
            <option value="Rajasthan">Rajasthan</option>
            <option value="Goa">Goa</option>
            <option value="Kerala">Kerala</option>
            <option value="Himachal">Himachal</option>
            <option value="Varanasi">Varanasi</option>
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="budget" className="block text-gray-700 text-sm font-bold mb-2">Budget (₹):</label>
          <input
            type="range"
            id="budget"
            className="w-full"
            min="5000"
            max="100000"
            value={budget}
            onChange={(e) => setBudget(parseInt(e.target.value))}
          />
          <span>{budget}</span>
        </div>
        <div className="mb-4">
          <label htmlFor="duration" className="block text-gray-700 text-sm font-bold mb-2">Duration (Days):</label>
          <input
            type="number"
            id="duration"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            min="1"
            max="14"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="theme" className="block text-gray-700 text-sm font-bold mb-2">Theme:</label>
          <select
            id="theme"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="Heritage">Heritage</option>
            <option value="Adventure">Adventure</option>
            <option value="Nightlife">Nightlife</option>
            <option value="Spiritual">Spiritual</option>
            <option value="Culinary">Culinary</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Generate Itinerary
        </button>
      </form>
    </div>
  );
}

export default PlanningForm;