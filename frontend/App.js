import React, { useState } from 'react';
import LandingPage from './LandingPage';
import PlanningForm from './PlanningForm';
import ItineraryDisplay from './ItineraryDisplay';
import LanguageSelector from './LanguageSelector';
import CommunityImpactDashboard from './CommunityImpactDashboard';
import { useState } from 'react';

function App() {
  const [travelMode, setTravelMode] = useState('');
  const [itinerary, setItinerary] = useState(null);

  const handleItineraryGenerated = (itineraryData) => {
    setItinerary(itineraryData);
  };

  return (
    <div className="container mx-auto">
      <LanguageSelector />
      {itinerary ? (
        <>
          <ItineraryDisplay itinerary={itinerary} />
          <CommunityImpactDashboard />
        </>
      ) : travelMode ? (
        <PlanningForm onItineraryGenerated={handleItineraryGenerated} />
      ) : (
        <LandingPage onTravelModeSelect={(mode) => setTravelMode(mode)} />
      )}
    </div>
  );
}

export default App;