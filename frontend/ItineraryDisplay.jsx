import React from 'react';
import { mockWeatherData, mockPlaceData, mockHotelData, mockTransportData, mockLocalExperienceData } from './utils/mockData';

function ItineraryDisplay({ itinerary }) {
  return (
    <div className="container mx-auto">
      <h2 className="text-xl font-bold">Your Itinerary</h2>
      {itinerary && itinerary.length > 0 ? (
        itinerary.map((day) => (
          <div key={day.day} className="mb-4">
            <h3 className="text-lg font-bold">Day {day.day}</h3>
            <ul>
              {day.activities.map((activity, index) => (
                <li key={index}>{activity}</li>
              ))}
            </ul>
            <p>Cost: ₹{day.cost}</p>
            <p>Safety Tips: {day.safetyTips.join(', ')}</p>
          </div>
        ))
      ) : (
        <p>No itinerary data available.</p>
      )}

      <h3 className="text-lg font-bold">Weather Data</h3>
      <p>Temperature: {mockWeatherData.temperature}°C</p>
      <p>Condition: {mockWeatherData.condition}</p>

      <h3 className="text-lg font-bold">Place Data</h3>
      <p>Name: {mockPlaceData.name}</p>
      <p>Address: {mockPlaceData.address}</p>

      <h3 className="text-lg font-bold">Hotel Data</h3>
      <ul>
        {mockHotelData.map((hotel) => (
          <li key={hotel.id}>{hotel.name} - ₹{hotel.price}</li>
        ))}
      </ul>

      <h3 className="text-lg font-bold">Transport Data</h3>
      <ul>
        {mockTransportData.map((transport) => (
          <li key={transport.id}>{transport.type}: {transport.name} - ₹{transport.price}</li>
        ))}
      </ul>

      <h3 className="text-lg font-bold">Local Experience Data</h3>
      <ul>
        {mockLocalExperienceData.map((experience) => (
          <li key={experience.id}>{experience.name} - ₹{experience.price}</li>
        ))}
      </ul>
    </div>
  );
}

export default ItineraryDisplay;