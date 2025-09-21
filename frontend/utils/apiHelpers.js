const mockItineraryData = {
  itinerary: [
    {
      day: 1,
      activities: ['Visit the Taj Mahal', 'Explore Agra Fort'],
      cost: 5000,
      safetyTips: ['Be aware of your surroundings', 'Stay hydrated']
    },
    {
      day: 2,
      activities: ['Visit Fatehpur Sikri', 'Shop for souvenirs'],
      cost: 3000,
      safetyTips: ['Bargain before buying', 'Keep your belongings safe']
    }
  ]
};

export const generateItinerary = async (destination, budget, duration, theme) => {
  // Mock Gemini API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockItineraryData);
    }, 1000);
  });
};