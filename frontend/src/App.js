import React, { useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Slider } from "./components/ui/slider";
import { Switch } from "./components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Badge } from "./components/ui/badge";
import { Separator } from "./components/ui/separator";
import { Heart, Shield, MapPin, Clock, Utensils, Home, Star, Users, Leaf } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LandingPage = () => {
  const [showPlanner, setShowPlanner] = useState(false);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('https://images.unsplash.com/photo-1548013146-72479768bada?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxJbmRpYSUyMHRyYXZlbHxlbnwwfHx8fDE3NTgzNjU1Njl8MA&ixlib=rb-4.1.0&q=85')`
          }}
        />
        
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 tracking-tight">
            संस्कृति
          </h1>
          <p className="text-xl md:text-2xl text-orange-100 mb-4 font-medium">
            AI-Powered Travel Planning for Indian Women
          </p>
          <p className="text-lg text-orange-200 mb-12 max-w-2xl mx-auto leading-relaxed">
            Discover India safely and authentically with personalized itineraries designed for solo female travelers
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={() => setShowPlanner(true)}
              size="lg" 
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-2xl transform transition-all duration-300 hover:scale-105"
            >
              <MapPin className="mr-2 h-5 w-5" />
              Plan Your Journey
            </Button>
            
            <div className="flex items-center gap-4 text-white">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-300" />
                <span className="text-sm">Safety First</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-orange-300" />
                <span className="text-sm">Women-Friendly</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      {!showPlanner && (
        <div className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-gray-800 mb-16">
              Why Choose Sanskriti?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center p-8 bg-white/80 backdrop-blur-sm border-orange-200 hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <Shield className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                  <CardTitle className="text-orange-800">Safety Prioritized</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Every recommendation prioritizes women's safety with verified accommodations and well-lit areas
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-center p-8 bg-white/80 backdrop-blur-sm border-orange-200 hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <Heart className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                  <CardTitle className="text-orange-800">Period-Friendly</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Thoughtful planning includes clean facilities, nearby pharmacies, and comfortable spaces
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-center p-8 bg-white/80 backdrop-blur-sm border-orange-200 hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <Users className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                  <CardTitle className="text-orange-800">Community Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Support local families and artisans while experiencing authentic Indian culture
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
      
      {showPlanner && <TripPlanner />}
    </div>
  );
};

const TripPlanner = () => {
  const [formData, setFormData] = useState({
    destination: "",
    budget: [25000],
    duration: 3,
    theme: "",
    travel_mode: "solo_female",
    period_friendly: false,
    special_preferences: ""
  });
  
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const indianDestinations = [
    "Jaipur, Rajasthan", "Goa", "Kerala", "Rishikesh, Uttarakhand",
    "Udaipur, Rajasthan", "Hampi, Karnataka", "Manali, Himachal Pradesh",
    "Pushkar, Rajasthan", "Varanasi, Uttar Pradesh", "Mysore, Karnataka"
  ];
  
  const themes = [
    { value: "heritage", label: "Heritage & Culture", icon: "🏛️" },
    { value: "spiritual", label: "Spiritual Journey", icon: "🕉️" },
    { value: "adventure", label: "Adventure", icon: "🏔️" },
    { value: "wellness", label: "Wellness & Yoga", icon: "🧘‍♀️" },
    { value: "culinary", label: "Culinary Experience", icon: "🍛" }
  ];
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(`${API}/itinerary/generate`, {
        destination: formData.destination,
        budget: formData.budget[0],
        duration: formData.duration,
        theme: formData.theme,
        travel_mode: formData.travel_mode,
        period_friendly: formData.period_friendly,
        special_preferences: formData.special_preferences
      });
      
      setItinerary(response.data);
    } catch (error) {
      console.error("Error generating itinerary:", error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <Card className="p-12 text-center bg-white/90 backdrop-blur-sm">
          <div className="animate-spin h-16 w-16 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-6"></div>
          <h3 className="text-2xl font-semibold text-orange-800 mb-2">Sakhi is planning your perfect trip...</h3>
          <p className="text-gray-600">Creating a personalized, safe itinerary just for you</p>
        </Card>
      </div>
    );
  }
  
  if (itinerary) {
    return <ItineraryDisplay itinerary={itinerary} />;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white/90 backdrop-blur-sm border-orange-200 shadow-2xl">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold text-orange-800">Plan Your Solo Journey</CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Tell us about your dream trip and we'll create the perfect itinerary
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Destination */}
              <div className="space-y-3">
                <Label htmlFor="destination" className="text-lg font-semibold text-gray-700">
                  Where would you like to go?
                </Label>
                <Select onValueChange={(value) => setFormData({...formData, destination: value})}>
                  <SelectTrigger className="w-full p-4 text-lg border-orange-200 focus:border-orange-500">
                    <SelectValue placeholder="Choose your destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {indianDestinations.map((dest) => (
                      <SelectItem key={dest} value={dest}>{dest}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Budget */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold text-gray-700">
                  Budget: ₹{formData.budget[0].toLocaleString('en-IN')}
                </Label>
                <Slider
                  value={formData.budget}
                  onValueChange={(value) => setFormData({...formData, budget: value})}
                  max={100000}
                  min={5000}
                  step={2500}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>₹5,000</span>
                  <span>₹1,00,000</span>
                </div>
              </div>
              
              {/* Duration */}
              <div className="space-y-3">
                <Label htmlFor="duration" className="text-lg font-semibold text-gray-700">
                  Duration (days)
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="14"
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                  className="w-full p-4 text-lg border-orange-200 focus:border-orange-500"
                />
              </div>
              
              {/* Theme */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold text-gray-700">
                  What's your travel theme?
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {themes.map((theme) => (
                    <Card
                      key={theme.value}
                      className={`cursor-pointer transition-all duration-300 hover:shadow-md ${
                        formData.theme === theme.value 
                          ? 'bg-orange-100 border-orange-500 shadow-md' 
                          : 'bg-white border-gray-200 hover:border-orange-300'
                      }`}
                      onClick={() => setFormData({...formData, theme: theme.value})}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl mb-2">{theme.icon}</div>
                        <p className="font-medium text-gray-700">{theme.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              
              {/* Period-Friendly Option */}
              <div className="bg-pink-50 p-6 rounded-lg border border-pink-200">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-lg font-semibold text-gray-700">
                      Period-Friendly Planning
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Include clean facilities, nearby pharmacies, and comfortable spaces
                    </p>
                  </div>
                  <Switch
                    checked={formData.period_friendly}
                    onCheckedChange={(checked) => setFormData({...formData, period_friendly: checked})}
                  />
                </div>
              </div>
              
              {/* Special Preferences */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-gray-700">
                  Any special preferences or requirements?
                </Label>
                <textarea
                  className="w-full p-4 border border-orange-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 resize-none"
                  rows="3"
                  placeholder="e.g., vegetarian food only, avoid crowded places, photography focus..."
                  value={formData.special_preferences}
                  onChange={(e) => setFormData({...formData, special_preferences: e.target.value})}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 text-lg font-semibold rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl"
                disabled={!formData.destination || !formData.theme}
              >
                <MapPin className="mr-2 h-5 w-5" />
                Generate My Perfect Itinerary
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ItineraryDisplay = ({ itinerary }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Card className="mb-8 bg-white/90 backdrop-blur-sm border-orange-200 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-bold text-orange-800">
              Your Perfect Journey to {itinerary.destination}
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 mt-2">
              {itinerary.duration} days • ₹{itinerary.total_cost.toLocaleString('en-IN')} • {itinerary.theme} theme
            </CardDescription>
            
            <div className="flex justify-center gap-4 mt-6">
              <Badge variant="secondary" className="bg-green-100 text-green-800 px-4 py-2">
                <Shield className="h-4 w-4 mr-2" />
                Safety Score: {itinerary.safety_score}%
              </Badge>
              {itinerary.period_friendly && (
                <Badge variant="secondary" className="bg-pink-100 text-pink-800 px-4 py-2">
                  <Heart className="h-4 w-4 mr-2" />
                  Period-Friendly
                </Badge>
              )}
            </div>
          </CardHeader>
        </Card>
        
        {/* Community Impact */}
        <Card className="mb-8 bg-white/90 backdrop-blur-sm border-orange-200">
          <CardHeader>
            <CardTitle className="text-2xl text-orange-800 flex items-center">
              <Leaf className="h-6 w-6 mr-2" />
              Community Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="text-2xl font-bold text-green-700">
                  {itinerary.community_impact.families_benefited}
                </h3>
                <p className="text-green-600">Local Families Supported</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="text-2xl font-bold text-blue-700">
                  ₹{itinerary.community_impact.total_impact.toLocaleString('en-IN')}
                </h3>
                <p className="text-blue-600">Community Investment</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="text-2xl font-bold text-purple-700">
                  {itinerary.community_impact.impact_percentage}%
                </h3>
                <p className="text-purple-600">Stays with Community</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Daily Itinerary */}
        <div className="space-y-6">
          {itinerary.days.map((day, index) => (
            <Card key={index} className="bg-white/90 backdrop-blur-sm border-orange-200">
              <CardHeader>
                <CardTitle className="text-xl text-orange-800">
                  Day {day.day} • ₹{day.estimated_cost.toLocaleString('en-IN')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Activities */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Activities
                    </h4>
                    <div className="space-y-3">
                      {day.activities.map((activity, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-gray-800">{activity.activity}</h5>
                            <Badge variant="outline">₹{activity.cost}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">{activity.description}</p>
                          <div className="flex items-center mt-2 text-xs text-gray-500">
                            <MapPin className="h-3 w-3 mr-1" />
                            {activity.location}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Accommodation & Meals */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <Home className="h-4 w-4 mr-2" />
                      Stay & Meals
                    </h4>
                    
                    {/* Accommodation */}
                    <div className="p-3 bg-blue-50 rounded-lg mb-4">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-gray-800">{day.accommodation.name}</h5>
                        <Badge variant="outline">₹{day.accommodation.cost}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{day.accommodation.location}</p>
                      <div className="flex items-center gap-2">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs">Safety: {day.accommodation.safety_rating}/5</span>
                        {day.accommodation.women_friendly && (
                          <Badge variant="secondary" className="text-xs bg-pink-100 text-pink-800">
                            Women-Friendly
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Meals */}
                    <div className="space-y-2">
                      <h5 className="font-medium text-gray-700 flex items-center">
                        <Utensils className="h-4 w-4 mr-2" />
                        Recommended Meals
                      </h5>
                      {day.meals.map((meal, idx) => (
                        <div key={idx} className="p-2 bg-yellow-50 rounded text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">{meal.restaurant}</span>
                            <span>₹{meal.cost}</span>
                          </div>
                          <p className="text-gray-600">{meal.cuisine} • {meal.meal}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Safety Tips */}
                {day.safety_tips.length > 0 && (
                  <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h5 className="font-medium text-green-800 mb-2 flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Safety Tips for Day {day.day}
                    </h5>
                    <ul className="list-disc list-inside space-y-1">
                      {day.safety_tips.map((tip, idx) => (
                        <li key={idx} className="text-sm text-green-700">{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Action Buttons */}
        <Card className="mt-8 bg-white/90 backdrop-blur-sm border-orange-200">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3"
              >
                Save Itinerary
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-orange-600 text-orange-600 hover:bg-orange-50 px-8 py-3"
              >
                Share with Friends
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;