import AIAdvisor from "./components/AIAdvisor";
import WeatherInfo from "./components/WeatherInfo";
import useAdaptiveBudget from "./hooks/useAdaptiveBudget";
import React, { useState, useEffect } from "react";
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

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

const LandingPage = () => {
  const [showPlanner, setShowPlanner] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)), url('https://images.unsplash.com/photo-1548013146-72479768bada?crop=entropy&cs=srgb&fm=jpg&q=85')`
          }}
        />
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 tracking-tight">संस्कृति</h1>
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

      {!showPlanner && (
        <div className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-gray-800 mb-16">Why Choose Sanskriti?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center p-8 bg-white/80 backdrop-blur-sm border-orange-200 hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <Shield className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                  <CardTitle className="text-orange-800">Safety Prioritized</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Every recommendation prioritizes women's safety with verified accommodations and well-lit areas.
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
                    Thoughtful planning includes clean facilities, nearby pharmacies, and comfortable spaces.
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
                    Support local families and artisans while experiencing authentic Indian culture.
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
    destination: "Goa",
    budget: [25000],
    duration: 3,
    theme: "heritage",
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
      const requestData = {
        destination: formData.destination,
        budget: formData.budget[0],
        duration: formData.duration,
        theme: formData.theme,
        travel_mode: formData.travel_mode,
        period_friendly: formData.period_friendly,
        special_preferences: formData.special_preferences
      };

      const response = await axios.post(`${API}/itinerary/generate`, requestData);
      setItinerary(response.data);
    } catch (error) {
      console.error("Error generating itinerary:", error);
      alert(`Error: ${error.response?.data?.detail || error.message}`);
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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* EaseMyTrip-style header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Plan Your Journey</h2>
          <p className="text-gray-600 text-lg">Fill in your travel details to get personalized recommendations</p>
        </div>
        
        <Card className="easemytrip-card">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-12">
            <CardTitle className="text-2xl font-semibold">Trip Details</CardTitle>
            <CardDescription className="text-blue-100">
              Enter your preferences for a customized travel experience
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Destination - EaseMyTrip style */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <Label className="text-lg font-semibold text-gray-800">Destination</Label>
                    <p className="text-sm text-gray-600">Where would you like to go?</p>
                  </div>
                </div>
                <Select 
                  value={formData.destination}
                  onValueChange={(value) => setFormData({...formData, destination: value})}
                >
                  <SelectTrigger className="w-full h-14 text-lg border-gray-300 focus:border-blue-500 bg-white">
                    <SelectValue placeholder="Choose your destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {indianDestinations.map((dest) => (
                      <SelectItem key={dest} value={dest}>{dest}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Budget - EaseMyTrip style */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">₹</span>
                  </div>
                  <div>
                    <Label className="text-lg font-semibold text-gray-800">
                      Budget: ₹{formData.budget[0].toLocaleString('en-IN')}
                    </Label>
                    <p className="text-sm text-gray-600">Set your travel budget</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <Slider
                    value={formData.budget}
                    onValueChange={(value) => setFormData({...formData, budget: value})}
                    max={100000}
                    min={5000}
                    step={2500}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-2">
                    <span>₹5,000</span>
                    <span>₹1,00,000</span>
                  </div>
                </div>
              </div>

              {/* Duration - EaseMyTrip style */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <Label className="text-lg font-semibold text-gray-800">Duration</Label>
                    <p className="text-sm text-gray-600">How many days?</p>
                  </div>
                </div>
                <Input
                  type="number"
                  min="1"
                  max="14"
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                  className="w-full h-14 text-lg border-gray-300 focus:border-blue-500 bg-white"
                  placeholder="Enter number of days"
                />
              </div>

              {/* Theme - EaseMyTrip style */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                    <Heart className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <Label className="text-lg font-semibold text-gray-800">Travel Theme</Label>
                    <p className="text-sm text-gray-600">What's your travel style?</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {themes.map((theme) => (
                    <Card
                      key={theme.value}
                      className={`cursor-pointer transition-all duration-200 easemytrip-card ${
                        formData.theme === theme.value 
                          ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200' 
                          : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                      }`}
                      onClick={() => setFormData({...formData, theme: theme.value})}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="text-3xl mb-2">{theme.icon}</div>
                        <p className={`font-medium ${
                          formData.theme === theme.value ? 'text-blue-700' : 'text-gray-700'
                        }`}>{theme.label}</p>
                        {formData.theme === theme.value && (
                          <div className="mt-2">
                            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Period-Friendly Option - EaseMyTrip style */}
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 rounded-lg border border-pink-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <Label className="text-lg font-semibold text-gray-800">
                        Period-Friendly Planning
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Include clean facilities, nearby pharmacies, and comfortable spaces
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.period_friendly}
                    onCheckedChange={(checked) => setFormData({...formData, period_friendly: checked})}
                    className="data-[state=checked]:bg-pink-500"
                  />
                </div>
              </div>

              {/* Special Preferences - EaseMyTrip style */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <Label className="text-lg font-semibold text-gray-800">
                      Special Preferences
                    </Label>
                    <p className="text-sm text-gray-600">Any specific requirements?</p>
                  </div>
                </div>
                <textarea
                  className="w-full p-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none bg-white"
                  rows="3"
                  placeholder="e.g., vegetarian food only, avoid crowded places, photography focus..."
                  value={formData.special_preferences}
                  onChange={(e) => setFormData({...formData, special_preferences: e.target.value})}
                />
              </div>
              
              {/* Submit Button - EaseMyTrip style */}
              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full btn-primary py-6 text-xl font-semibold rounded-xl shadow-xl hover:shadow-2xl"
                >
                  <MapPin className="mr-3 h-6 w-6" />
                  Generate My Perfect Itinerary
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ItineraryDisplay = ({ itinerary }) => {
  const [bookingStatus, setBookingStatus] = useState({
    hotels: false,
    transport: false,
    experiences: false,
    cabs: false,
    flights: false
  });

  const [showExperienceModal, setShowExperienceModal] = useState(false);

  // Option B: keep localStorage but clear it on load so booking resets after refresh
  useEffect(() => {
    localStorage.removeItem("yatra_booking_status");
    // if you want to keep a session-level cache you could implement sessionStorage instead
  }, []);

  useEffect(() => {
    const savedStatus = localStorage.getItem('yatra_booking_status');
    if (savedStatus) {
      try {
        setBookingStatus(JSON.parse(savedStatus));
      } catch (e) {
        // ignore parse errors
      }
    }
  }, []);

  const updateBookingStatus = (type) => {
    const newStatus = { ...bookingStatus, [type]: true };
    setBookingStatus(newStatus);
    localStorage.setItem('yatra_booking_status', JSON.stringify(newStatus));
  };

  const calculateDetailedCosts = () => {
    const accommodationCost = itinerary.days.reduce((total, day) => total + (day.accommodation?.cost || 0), 0);
    const experiencesCost = itinerary.days.reduce((total, day) =>
      total + day.activities.reduce((dayTotal, activity) => dayTotal + (activity.cost || 0), 0), 0
    );
    const foodCost = itinerary.days.reduce((total, day) =>
      total + day.meals.reduce((mealTotal, meal) => mealTotal + (meal.cost || 0), 0), 0
    );
    const transportCost = Math.max(1000, Math.round((itinerary.total_cost || 0) * 0.2));
    const totalCost = accommodationCost + experiencesCost + foodCost + transportCost;
    const communityBenefit = Math.round(totalCost * 0.6);
    return {
      accommodation: accommodationCost,
      experiences: experiencesCost,
      food: foodCost,
      transport: transportCost,
      total: totalCost,
      communityBenefit
    };
  };

  const costs = useAdaptiveBudget(itinerary, calculateDetailedCosts());
  const completedBookings = Object.values(bookingStatus).filter(Boolean).length;

  const generateBookingUrls = () => {
    // Option 1: open EaseMyTrip main pages (no prefill)
    return {
      hotels: "https://www.easemytrip.com/hotels/",
      flights: "https://www.easemytrip.com/flights.html",
      buses: "https://www.easemytrip.com/bus/",
      cabs: "https://www.easemytrip.com/cabs/",
      packages: "https://www.easemytrip.com/holidays.html"
    };
  };

  const bookingUrls = generateBookingUrls();

  const handleBooking = (type, url) => {
    try {
      if (!url) {
        alert(`Booking link not available for ${type}`);
        return;
      }
      const newTab = window.open(url, "_blank", "noopener,noreferrer");
      if (newTab) {
        updateBookingStatus(type);
      } else {
        alert("Please allow pop-ups in your browser to continue booking.");
      }
    } catch (error) {
      console.error("Error opening booking link:", error);
      alert("Something went wrong while opening booking page.");
    }
  };

  const generateWhatsAppMessage = (activity, date) => {
    return `Hi, I'm interested in booking "${activity}" on ${date} through Sanskriti app. Can you confirm availability and provide more details?`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* EaseMyTrip-style Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 rounded-t-2xl">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-2">
                Your Perfect Journey to {itinerary.destination}
              </h1>
              <p className="text-xl text-blue-100 mb-6">
                {itinerary.duration} days • ₹{costs.total.toLocaleString('en-IN')} • {itinerary.theme} theme
              </p>
              
              <div className="flex flex-wrap justify-center gap-3">
                <div className="bg-green-500 text-white px-4 py-2 rounded-full flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Safety: {itinerary.safety_score ?? 80}%</span>
                </div>
                {itinerary.period_friendly && (
                  <div className="bg-pink-500 text-white px-4 py-2 rounded-full flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    <span>Period-Friendly</span>
                  </div>
                )}
                <div className="bg-orange-500 text-white px-4 py-2 rounded-full flex items-center gap-2">
                  <span>Bookings: {completedBookings}/{Object.keys(bookingStatus).length}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-b-2xl shadow-lg border-t-4 border-blue-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="p-4">
                <div className="text-2xl font-bold text-blue-600">₹{costs.total.toLocaleString('en-IN')}</div>
                <div className="text-sm text-gray-600">Total Cost</div>
              </div>
              <div className="p-4">
                <div className="text-2xl font-bold text-green-600">{itinerary.duration}</div>
                <div className="text-sm text-gray-600">Days</div>
              </div>
              <div className="p-4">
                <div className="text-2xl font-bold text-orange-600">{itinerary.community_impact.families_benefited}</div>
                <div className="text-sm text-gray-600">Families Helped</div>
              </div>
              <div className="p-4">
                <div className="text-2xl font-bold text-purple-600">60%</div>
                <div className="text-sm text-gray-600">Community Impact</div>
              </div>
            </div>
          </div>
        </div>

        {/* EaseMyTrip-style Cost Breakdown */}
        <Card className="mb-8 easemytrip-card">
          <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-xl">
            <CardTitle className="text-2xl font-semibold flex items-center">
              <span className="mr-3">💰</span> Trip Cost Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="bg-gray-50 p-6 rounded-lg font-mono text-sm">
              <div className="border border-gray-300 rounded-lg p-4 bg-white">
                <div className="text-center text-lg font-bold text-gray-800 mb-4 pb-2 border-b">
                  💰 TRIP COST BREAKDOWN
                </div>

                <div className="mb-4">
                  <div className="font-semibold text-gray-700 mb-2">ACCOMMODATION ({itinerary.duration} nights)</div>
                  {itinerary.days.map((day, index) => (
                    <div key={index} className="ml-4 text-gray-600 flex justify-between">
                      <span>├─ Night {day.day}: {day.accommodation?.name || 'Hotel'}</span>
                      <span>₹{(day.accommodation?.cost || 0).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>

                <div className="mb-4">
                  <div className="font-semibold text-gray-700 mb-2">TRANSPORT</div>
                  <div className="ml-4 text-gray-600 flex justify-between">
                    <span>├─ To {itinerary.destination}</span>
                    <span>₹{Math.round(costs.transport * 0.4).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="ml-4 text-gray-600 flex justify-between">
                    <span>├─ Local Transport ({itinerary.duration} days)</span>
                    <span>₹{Math.round(costs.transport * 0.4).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="ml-4 text-gray-600 flex justify-between">
                    <span>└─ Return Journey</span>
                    <span>₹{Math.round(costs.transport * 0.2).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="font-semibold text-gray-700 mb-2">EXPERIENCES & ACTIVITIES</div>
                  {itinerary.days.slice(0, 3).map((day) =>
                    day.activities.map((activity, idx) => (
                      <div key={`${day.day}-${idx}`} className="ml-4 text-gray-600 flex justify-between">
                        <span>├─ {activity.activity}</span>
                        <span>₹{(activity.cost || 0).toLocaleString('en-IN')}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="mb-4">
                  <div className="font-semibold text-gray-700 mb-2">FOOD ({itinerary.duration} days)</div>
                  <div className="ml-4 text-gray-600 flex justify-between">
                    <span>├─ Breakfasts</span>
                    <span>₹{Math.round(costs.food * 0.3).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="ml-4 text-gray-600 flex justify-between">
                    <span>├─ Lunches</span>
                    <span>₹{Math.round(costs.food * 0.4).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="ml-4 text-gray-600 flex justify-between">
                    <span>└─ Dinners</span>
                    <span>₹{Math.round(costs.food * 0.3).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="border-t border-gray-300 pt-3 mt-4">
                  <div className="flex justify-between font-bold text-lg text-gray-800 mb-4">
                    <span>TOTAL TRIP COST:</span>
                    <span>₹{costs.total.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <div className="font-semibold text-green-800 mb-2">🏘️ COMMUNITY IMPACT:</div>
                    <div className="flex justify-between text-green-700 font-semibold mb-2">
                      <span>Direct to Local Hosts:</span>
                      <span>₹{costs.communityBenefit.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-sm text-green-600 mb-2">(60% of your spending)</div>

                    <div className="text-sm text-green-700">
                      <div className="font-medium mb-1">Your trip will benefit:</div>
                      <div>→ Local Homestay Families</div>
                      <div>→ Traditional Artisan Workshops</div>
                      <div>→ Local Transport Cooperatives</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </CardContent>
        </Card>

        {/* EaseMyTrip-style Booking Section */}
        <Card className="mb-8 easemytrip-card">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-xl">
            <CardTitle className="text-2xl font-semibold text-center flex items-center justify-center">
              <span className="mr-3">🎯</span> Book Your Trip Components
            </CardTitle>
            <CardDescription className="text-center text-lg text-blue-100">
              Book each component separately or all at once
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="space-y-3">
                <Button
                  onClick={() => handleBooking('hotels', bookingUrls.hotels)}
                  className="w-full h-16 btn-primary text-lg font-semibold rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                  disabled={bookingStatus.hotels}
                >
                  {bookingStatus.hotels ? '✅ Hotels Booked' : (
                    <>
                      🏨 BOOK HOTELS<br />
                      <span className="text-sm opacity-90">(₹{costs.accommodation.toLocaleString('en-IN')})</span>
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-600 text-center">Opens EaseMyTrip with your dates pre-filled</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Button
                    onClick={() => handleBooking('transport', bookingUrls.flights)}
                    className="w-full h-12 btn-secondary font-semibold rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105"
                    disabled={bookingStatus.transport}
                  >
                    {bookingStatus.transport ? '✅ Transport Booked' : '🚂 Book Train Tickets'}
                  </Button>
                  <Button
                    onClick={() => handleBooking('transport', bookingUrls.flights)}
                    className="w-full h-12 btn-secondary font-semibold rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105"
                    disabled={bookingStatus.transport}
                  >
                    ✈️ Book Flight Tickets
                  </Button>
                </div>
                <p className="text-xs text-gray-600 text-center">Total Transport: ₹{costs.transport.toLocaleString('en-IN')}</p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => setShowExperienceModal(true)}
                  className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-semibold rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  disabled={bookingStatus.experiences}
                >
                  {bookingStatus.experiences ? '✅ Experiences Booked' : (
                    <>
                      🎨 BOOK EXPERIENCES<br />
                      <span className="text-sm">(₹{costs.experiences.toLocaleString('en-IN')})</span>
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-600 text-center">Contact local hosts via WhatsApp</p>
              </div>
            </div>

            <div className="text-center mb-6">
              <Button
                onClick={() => {
                  handleBooking('hotels', bookingUrls.hotels);
                  setTimeout(() => handleBooking('transport', bookingUrls.flights), 2000);
                  setTimeout(() => setShowExperienceModal(true), 4000);
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white text-lg font-semibold px-8 py-4 rounded-lg shadow-lg"
                disabled={completedBookings === 3}
              >
                🚀 Book All Components
              </Button>
            </div>

                        <div className="border-t pt-6">
              <Button
                onClick={() => alert('Payment integration coming in next update! 🚧')}
                className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold rounded-lg shadow-xl transform transition-all duration-300 hover:scale-105"
              >
                💳 PROCEED TO CHECKOUT<br />
                <span className="text-lg">Total: ₹{costs.total.toLocaleString('en-IN')}</span>
              </Button>
            </div>
          </CardContent>
        </Card>  {/* <-- IMPORTANT: close the Booking Buttons card here */}

        {/* 🌦️ Weather Info */}
        <WeatherInfo destination={itinerary.destination} />

        {/* 🤖 AI Advisor */}
        <AIAdvisor itinerary={itinerary} />



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
                <h3 className="text-2xl font-bold text-green-700">{itinerary.community_impact?.families_benefited ?? 0}</h3>
                <p className="text-green-600">Local Families Supported</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="text-2xl font-bold text-blue-700">₹{costs.communityBenefit.toLocaleString('en-IN')}</h3>
                <p className="text-blue-600">Community Investment</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="text-2xl font-bold text-purple-700">60%</h3>
                <p className="text-purple-600">Stays with Community</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {itinerary.days.map((day, index) => (
            <Card key={index} className="bg-white/90 backdrop-blur-sm border-orange-200">
              <CardHeader>
                <CardTitle className="text-xl text-orange-800">Day {day.day} • ₹{(day.estimated_cost || 0).toLocaleString('en-IN')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
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

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <Home className="h-4 w-4 mr-2" />
                      Stay & Meals
                    </h4>

                    <div className="p-3 bg-blue-50 rounded-lg mb-4">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-gray-800">{day.accommodation?.name || "Hotel"}</h5>
                        <Badge variant="outline">₹{day.accommodation?.cost || 0}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{day.accommodation?.location}</p>
                      <div className="flex items-center gap-2">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs">Safety: {day.accommodation?.safety_rating || 4}/5</span>
                        {day.accommodation?.women_friendly && (
                          <Badge variant="secondary" className="text-xs bg-pink-100 text-pink-800">Women-Friendly</Badge>
                        )}
                      </div>
                    </div>

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

                {day.safety_tips && day.safety_tips.length > 0 && (
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

        {showExperienceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="text-2xl text-orange-800 flex items-center justify-between">
                  🎨 Book Experiences
                  <Button variant="ghost" onClick={() => setShowExperienceModal(false)} className="text-gray-500 hover:text-gray-700">✕</Button>
                </CardTitle>
                <CardDescription>Contact local hosts directly via WhatsApp</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {itinerary.days.map((day) =>
                    day.activities.map((activity, idx) => (
                      <div key={`${day.day}-${idx}`} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-orange-200 rounded-lg flex items-center justify-center">🎯</div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">{activity.activity}</h3>
                            <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                            <p className="text-sm text-gray-500">📍 {activity.location}</p>
                            <p className="text-sm text-gray-500">💰 ₹{activity.cost}</p>
                            <p className="text-sm text-gray-500">👩‍🏫 Local Host: Community Partner</p>
                          </div>
                          <Button
                            onClick={() => {
                              const message = generateWhatsAppMessage(activity.activity, `Day ${day.day}`);
                              window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                              updateBookingStatus('experiences');
                              setShowExperienceModal(false);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            💬 WhatsApp
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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


