import React from 'react';

import React from 'react';

function LandingPage({ onTravelModeSelect }) {
  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold">Sanskriti Travel Planner</h1>
      <p>Plan your dream trip to India with our AI-powered itinerary generator.</p>
      <div className="flex justify-center">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => onTravelModeSelect('solo_female')}
        >
          Solo Female
        </button>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => onTravelModeSelect('friend_group')}
        >
          Friend Group
        </button>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => onTravelModeSelect('couple')}
        >
          Couple
        </button>
      </div>
    </div>
  );
}

export default LandingPage;