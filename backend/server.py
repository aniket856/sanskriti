from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import json
import googlemaps
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Initialize LLM integration
from emergentintegrations.llm.chat import LlmChat, UserMessage

# Initialize Google Maps client
try:
    gmaps = googlemaps.Client(key=os.environ.get('GOOGLE_PLACES_API_KEY'))
    GOOGLE_PLACES_ENABLED = True
except Exception as e:
    logging.warning(f"Google Places API not available: {str(e)}")
    gmaps = None
    GOOGLE_PLACES_ENABLED = False

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Thread pool for external API calls
executor = ThreadPoolExecutor(max_workers=3)

# Pydantic Models
class TripRequest(BaseModel):
    destination: str
    budget: int
    duration: int
    theme: str
    travel_mode: str = "solo_female"
    period_friendly: Optional[bool] = False
    special_preferences: Optional[str] = ""

class ItineraryDay(BaseModel):
    day: int
    activities: List[dict]
    accommodation: dict
    meals: List[dict]
    estimated_cost: int
    safety_tips: List[str]

class Itinerary(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    destination: str  
    budget: int
    duration: int
    theme: str
    travel_mode: str
    period_friendly: bool
    days: List[ItineraryDay]
    total_cost: int
    community_impact: dict
    safety_score: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CommunityHost(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    location: str
    services: List[str]
    rating: float
    story: str
    photo_url: str

# Real Data Fetching Functions
def get_real_accommodations(destination: str, budget_per_night: int, is_solo_female: bool = True) -> List[Dict[str, Any]]:
    """Fetch real hotels from Google Places API with safety focus"""
    if not GOOGLE_PLACES_ENABLED:
        return get_fallback_accommodations(destination, budget_per_night, is_solo_female)
    
    try:
        # Search for hotels in the destination
        places_result = gmaps.places(
            query=f"hotels in {destination}",
            type='lodging'
        )
        
        hotels = []
        for place in places_result.get('results', [])[:5]:
            # Get detailed information
            place_details = gmaps.place(place['place_id'], fields=[
                'name', 'formatted_address', 'rating', 'price_level', 
                'reviews', 'types', 'photos', 'opening_hours'
            ])
            
            place_info = place_details.get('result', {})
            rating = place_info.get('rating', 0)
            
            # Filter for safety (especially for solo female travelers)
            if is_solo_female and rating < 4.0:
                continue
                
            # Estimate cost based on price level and budget
            price_level = place_info.get('price_level', 2)
            estimated_cost = 2000 + (price_level * 1500)  # Basic estimation
            
            if estimated_cost > budget_per_night * 1.5:  # Allow some flexibility
                continue
                
            hotel = {
                "name": place_info.get('name', 'Unknown Hotel'),
                "location": place_info.get('formatted_address', destination),
                "cost": min(estimated_cost, budget_per_night),
                "safety_rating": min(5, int(rating)),
                "women_friendly": rating >= 4.0 and 'hotel' in place_info.get('types', []),
                "amenities": get_hotel_amenities(place_info, is_solo_female),
                "rating": rating,
                "reviews_count": len(place_info.get('reviews', [])),
                "type": "hotel"
            }
            hotels.append(hotel)
            
        # Sort by rating and women-friendliness
        hotels.sort(key=lambda x: (x['women_friendly'], x['rating']), reverse=True)
        return hotels[:3]
        
    except Exception as e:
        logging.error(f"Error fetching real accommodations: {str(e)}")
        return get_fallback_accommodations(destination, budget_per_night, is_solo_female)

def get_real_restaurants(destination: str, meal_type: str = "restaurant", cuisine_preference: str = None) -> List[Dict[str, Any]]:
    """Fetch real restaurants from Google Places API"""
    if not GOOGLE_PLACES_ENABLED:
        return get_fallback_restaurants(destination, meal_type, cuisine_preference)
    
    try:
        query = f"{meal_type} in {destination}"
        if cuisine_preference:
            query += f" {cuisine_preference} cuisine"
            
        places_result = gmaps.places(query=query, type='restaurant')
        
        restaurants = []
        for place in places_result.get('results', [])[:8]:
            rating = place.get('rating', 0)
            if rating < 3.5:  # Filter for quality
                continue
                
            price_level = place.get('price_level', 2)
            estimated_cost = 300 + (price_level * 200)  # Basic meal cost estimation
            
            restaurant = {
                "name": place.get('name', 'Local Restaurant'),
                "location": place.get('vicinity', destination),
                "cuisine": cuisine_preference or determine_cuisine_type(place.get('name', ''), place.get('types', [])),
                "cost": estimated_cost,
                "rating": rating,
                "meal": meal_type,
                "women_safe": rating >= 4.0  # Basic safety indicator
            }
            restaurants.append(restaurant)
            
        return restaurants[:5]
        
    except Exception as e:
        logging.error(f"Error fetching real restaurants: {str(e)}")
        return get_fallback_restaurants(destination, meal_type, cuisine_preference)

def get_real_attractions(destination: str, theme: str) -> List[Dict[str, Any]]:
    """Fetch real tourist attractions from Google Places API"""
    if not GOOGLE_PLACES_ENABLED:
        return get_fallback_attractions(destination, theme)
    
    try:
        # Theme-based search queries
        theme_queries = {
            "heritage": f"historical places monuments in {destination}",
            "spiritual": f"temples churches religious places in {destination}",
            "adventure": f"adventure sports outdoor activities in {destination}",
            "wellness": f"yoga centers spas wellness in {destination}",
            "culinary": f"food markets cooking classes in {destination}"
        }
        
        query = theme_queries.get(theme, f"tourist attractions in {destination}")
        places_result = gmaps.places(query=query, type='tourist_attraction')
        
        attractions = []
        for place in places_result.get('results', [])[:10]:
            rating = place.get('rating', 0)
            if rating < 3.5:
                continue
                
            # Estimate entry cost based on place type and rating
            entry_cost = estimate_attraction_cost(place, theme)
            
            attraction = {
                "activity": f"Visit {place.get('name', 'Local Attraction')}",
                "description": generate_attraction_description(place, theme),
                "location": place.get('vicinity', destination),
                "cost": entry_cost,
                "safety_level": "high" if rating >= 4.0 else "medium",
                "duration": estimate_visit_duration(place, theme),
                "time": get_recommended_visit_time(place, theme),
                "rating": rating
            }
            attractions.append(attraction)
            
        return attractions[:6]
        
    except Exception as e:
        logging.error(f"Error fetching real attractions: {str(e)}")
        return get_fallback_attractions(destination, theme)

# Helper Functions
def get_hotel_amenities(place_info: Dict, is_solo_female: bool) -> List[str]:
    """Generate realistic amenities based on hotel info"""
    base_amenities = ["WiFi", "Room Service"]
    
    if is_solo_female:
        base_amenities.extend(["24/7 Security", "Women-Safe Environment"])
        
    if place_info.get('rating', 0) >= 4.0:
        base_amenities.extend(["Concierge", "Restaurant"])
        
    if place_info.get('price_level', 0) >= 3:
        base_amenities.extend(["Spa", "Fitness Center", "Swimming Pool"])
        
    return base_amenities

def determine_cuisine_type(name: str, types: List[str]) -> str:
    """Determine cuisine type from restaurant name and types"""
    name_lower = name.lower()
    
    if 'indian' in name_lower or 'punjabi' in name_lower or 'dal' in name_lower:
        return "North Indian"
    elif 'south' in name_lower or 'dosa' in name_lower or 'idli' in name_lower:
        return "South Indian"
    elif 'chinese' in name_lower or 'noodle' in name_lower:
        return "Chinese"
    elif 'cafe' in name_lower or 'coffee' in name_lower:
        return "Cafe"
    elif 'pizza' in name_lower or 'italian' in name_lower:
        return "Italian"
    else:
        return "Local Cuisine"

def estimate_attraction_cost(place: Dict, theme: str) -> int:
    """Estimate entry cost for attractions"""
    rating = place.get('rating', 3.0)
    
    theme_costs = {
        "heritage": 100 + int(rating * 50),  # Monuments usually have entry fees
        "spiritual": 20,  # Most temples are free or low cost
        "adventure": 800 + int(rating * 200),  # Adventure activities are expensive
        "wellness": 500 + int(rating * 150),  # Spa/yoga sessions
        "culinary": 300 + int(rating * 100)   # Food experiences
    }
    
    return theme_costs.get(theme, 200)

def estimate_visit_duration(place: Dict, theme: str) -> str:
    """Estimate visit duration based on place type and theme"""
    theme_durations = {
        "heritage": "2-3 hours",
        "spiritual": "1-2 hours", 
        "adventure": "4-5 hours",
        "wellness": "2-3 hours",
        "culinary": "1-2 hours"
    }
    
    return theme_durations.get(theme, "2 hours")

def get_recommended_visit_time(place: Dict, theme: str) -> str:
    """Get recommended visit time based on theme"""
    theme_times = {
        "heritage": "9:00 AM",
        "spiritual": "6:00 AM",
        "adventure": "8:00 AM", 
        "wellness": "10:00 AM",
        "culinary": "12:00 PM"
    }
    
    return theme_times.get(theme, "10:00 AM")

def generate_attraction_description(place: Dict, theme: str) -> str:
    """Generate themed description for attractions"""
    name = place.get('name', 'attraction')
    rating = place.get('rating', 3.0)
    
    descriptions = {
        "heritage": f"Explore the historical significance of {name}. A well-preserved monument showcasing architectural brilliance (Rating: {rating}/5)",
        "spiritual": f"Experience spiritual tranquility at {name}. A sacred place perfect for meditation and inner peace (Rating: {rating}/5)",
        "adventure": f"Get your adrenaline pumping at {name}. Exciting outdoor activities with professional safety measures (Rating: {rating}/5)",
        "wellness": f"Rejuvenate your mind and body at {name}. Professional wellness services in a serene environment (Rating: {rating}/5)",
        "culinary": f"Savor authentic flavors at {name}. A culinary journey through local tastes and traditions (Rating: {rating}/5)"
    }
    
    return descriptions.get(theme, f"Visit {name}, a popular local attraction (Rating: {rating}/5)")

# Fallback Functions (when Google Places API is not available)
def get_fallback_accommodations(destination: str, budget_per_night: int, is_solo_female: bool) -> List[Dict[str, Any]]:
    """Fallback accommodations with realistic names"""
    base_hotels = [
        {"name": f"Hotel Heritage {destination.split(',')[0]}", "type": "heritage hotel", "rating": 4.2},
        {"name": f"Safe Haven Guest House", "type": "guesthouse", "rating": 4.5},
        {"name": f"{destination.split(',')[0]} Palace Hotel", "type": "palace hotel", "rating": 4.0}
    ]
    
    hotels = []
    for hotel in base_hotels:
        hotels.append({
            "name": hotel["name"],
            "location": f"City Center, {destination}",
            "cost": min(budget_per_night, 3500),
            "safety_rating": 5 if is_solo_female else 4,
            "women_friendly": True,
            "amenities": ["WiFi", "24/7 Security", "Women-Safe Environment", "Room Service"],
            "type": hotel["type"]
        })
    
    return hotels

def get_fallback_restaurants(destination: str, meal_type: str, cuisine_preference: str) -> List[Dict[str, Any]]:
    """Fallback restaurants with realistic names"""
    base_restaurants = [
        {"name": f"Royal Kitchen {destination.split(',')[0]}", "cuisine": "North Indian"},
        {"name": f"Spice Garden Restaurant", "cuisine": "Local Cuisine"},
        {"name": f"Heritage Cafe", "cuisine": "Multi-cuisine"},
        {"name": f"Traditional Thali House", "cuisine": "Regional"},
        {"name": f"Women's Cooperative Restaurant", "cuisine": "Home-style"}
    ]
    
    restaurants = []
    for restaurant in base_restaurants:
        restaurants.append({
            "name": restaurant["name"],
            "location": f"Near City Center, {destination}",
            "cuisine": cuisine_preference or restaurant["cuisine"],
            "cost": 400 if meal_type == "breakfast" else 600,
            "meal": meal_type,
            "women_safe": True
        })
    
    return restaurants

def get_fallback_attractions(destination: str, theme: str) -> List[Dict[str, Any]]:
    """Fallback attractions with realistic activities"""
    theme_attractions = {
        "heritage": [
            {"activity": f"Explore {destination} Fort", "cost": 150},
            {"activity": f"Visit {destination} Palace", "cost": 200},
            {"activity": "Heritage Walking Tour", "cost": 300}
        ],
        "spiritual": [
            {"activity": f"Visit {destination} Temple", "cost": 50},
            {"activity": "Morning Prayer Session", "cost": 0},
            {"activity": "Spiritual Meditation Workshop", "cost": 200}
        ],
        "adventure": [
            {"activity": f"{destination} Trekking Experience", "cost": 800},
            {"activity": "Adventure Sports Activities", "cost": 1200},
            {"activity": "Nature Photography Walk", "cost": 400}
        ],
        "wellness": [
            {"activity": "Traditional Yoga Session", "cost": 500},
            {"activity": "Ayurvedic Spa Treatment", "cost": 800},
            {"activity": "Meditation Workshop", "cost": 300}
        ],
        "culinary": [
            {"activity": "Local Cooking Class", "cost": 600},
            {"activity": "Street Food Tour", "cost": 400},
            {"activity": "Traditional Market Visit", "cost": 200}
        ]
    }
    
    attractions = []
    for attraction in theme_attractions.get(theme, theme_attractions["heritage"]):
        attractions.append({
            "activity": attraction["activity"],
            "description": f"Experience authentic {theme} activities in {destination}",
            "location": destination,
            "cost": attraction["cost"],
            "safety_level": "high",
            "duration": "2-3 hours",
            "time": "10:00 AM"
        })
    
    return attractions

# Initialize LLM Chat
def get_llm_chat():
    return LlmChat(
        api_key=os.environ.get('EMERGENT_LLM_KEY'),
        session_id=str(uuid.uuid4()),
        system_message="""You are Sakhi, an AI travel assistant specialized in planning trips for Indian travelers, especially solo female travelers.
        
        CRITICAL INSTRUCTIONS:
        - You will receive REAL DATA about hotels, restaurants, and attractions
        - Use ONLY the real names provided in the data
        - DO NOT create placeholder names or generic suggestions
        - If real data is provided, use it exactly as given
        - Focus on safety, authenticity, and cultural sensitivity
        - Always provide responses in valid JSON format"""
    ).with_model("openai", "gpt-4o-mini")

async def get_real_travel_data(destination: str, budget: int, duration: int, theme: str, is_solo_female: bool) -> Dict[str, Any]:
    """Fetch all real travel data asynchronously"""
    loop = asyncio.get_event_loop()
    
    # Calculate budget per night for accommodation
    budget_per_night = int(budget * 0.4 / duration)  # 40% of budget for accommodation
    
    # Fetch real data concurrently
    accommodations_task = loop.run_in_executor(
        executor, get_real_accommodations, destination, budget_per_night, is_solo_female
    )
    restaurants_task = loop.run_in_executor(
        executor, get_real_restaurants, destination, "restaurant", None
    )
    attractions_task = loop.run_in_executor(
        executor, get_real_attractions, destination, theme
    )
    
    # Wait for all data to be fetched
    accommodations, restaurants, attractions = await asyncio.gather(
        accommodations_task, restaurants_task, attractions_task
    )
    
    return {
        "accommodations": accommodations,
        "restaurants": restaurants,
        "attractions": attractions
    }

def generate_enhanced_trip_prompt(request: TripRequest, real_data: Dict[str, Any]) -> str:
    """Generate AI prompt with real data integration"""
    
    accommodations = real_data.get("accommodations", [])
    restaurants = real_data.get("restaurants", [])
    attractions = real_data.get("attractions", [])
    
    base_prompt = f"""You are Sakhi, creating a {request.duration}-day itinerary for {request.destination} with budget ₹{request.budget:,} focusing on {request.theme} theme.

REAL DATA TO USE (MANDATORY):

REAL HOTELS (use these exact names):
{json.dumps(accommodations, indent=2)}

REAL RESTAURANTS (use these exact names):
{json.dumps(restaurants, indent=2)}

REAL ATTRACTIONS (use these exact names):
{json.dumps(attractions, indent=2)}

STRICT REQUIREMENTS FOR SOLO FEMALE TRAVELER:
- Prioritize women-safe accommodations with high ratings
- Include well-lit, populated areas for activities
- Provide emergency contacts and safety tips
{"- PERIOD-FRIENDLY: Include clean restrooms, nearby pharmacies, comfortable spaces" if request.period_friendly else ""}
- Use reliable transportation options
- Focus on empowering experiences

CRITICAL INSTRUCTIONS:
1. Use ONLY the real hotel names from the data above
2. Use ONLY the real restaurant names from the data above  
3. Use ONLY the real attraction names from the data above
4. NO placeholders or generic names allowed
5. Include actual ratings and costs from the data
6. Distribute activities across all {request.duration} days

RESPONSE FORMAT (JSON ONLY):
{{
    "days": [
        {{
            "day": 1,
            "activities": [
                {{
                    "time": "9:00 AM",
                    "activity": "[USE EXACT ATTRACTION NAME FROM DATA]",
                    "description": "[USE DESCRIPTION FROM DATA]",
                    "location": "[USE LOCATION FROM DATA]",
                    "cost": [USE COST FROM DATA],
                    "safety_level": "high",
                    "duration": "[USE DURATION FROM DATA]"
                }}
            ],
            "accommodation": {{
                "name": "[USE EXACT HOTEL NAME FROM DATA]",
                "type": "hotel",
                "location": "[USE LOCATION FROM DATA]",
                "cost": [USE COST FROM DATA],
                "safety_rating": [USE RATING FROM DATA],
                "women_friendly": true,
                "amenities": [USE AMENITIES FROM DATA]
            }},
            "meals": [
                {{
                    "meal": "breakfast",
                    "restaurant": "[USE EXACT RESTAURANT NAME FROM DATA]",
                    "cuisine": "[USE CUISINE FROM DATA]",
                    "cost": [USE COST FROM DATA],
                    "location": "[USE LOCATION FROM DATA]"
                }}
            ],
            "estimated_cost": [CALCULATE TOTAL DAY COST],
            "safety_tips": [
                "Use the hotel's recommended transportation",
                "Stay in groups in crowded areas",
                "Keep emergency contacts accessible",
                {"Locate clean restrooms and nearby pharmacies" if request.period_friendly else "Share your itinerary with hotel concierge"}
            ]
        }}
    ],
    "total_cost": [CALCULATE TOTAL ITINERARY COST],
    "safety_score": 88,
    "community_experiences": [
        {{
            "activity": "Local artisan workshop",
            "host": "Community partner",
            "cost": 800,
            "impact": "Supports local families and traditional crafts"
        }}
    ]
}}

Create exactly {request.duration} days using the real data provided. Keep total cost under ₹{request.budget:,}."""

    return base_prompt
def generate_trip_prompt(request: TripRequest) -> str:
    base_prompt = f"""You are Sakhi, an AI travel planner for solo female travelers in India. Create a detailed {request.duration}-day itinerary for {request.destination} with a budget of ₹{request.budget:,} focusing on {request.theme} experiences."""
    
    if request.travel_mode == "solo_female":
        base_prompt += f""" This is for a solo female traveler. IMPORTANT REQUIREMENTS:
        - Prioritize women-safe accommodations with good reviews and security
        - Include well-lit, populated areas for activities
        - Suggest reliable transportation options
        - Provide emergency contacts and safety tips for each day
        {"- Include period-friendly facilities (clean restrooms, nearby pharmacies, comfortable spaces)" if request.period_friendly else ""}
        - Focus on empowering and enriching experiences"""
    
    base_prompt += f"""

    CRITICAL: Respond ONLY with valid JSON. No additional text before or after the JSON.

    JSON Structure:
    {{
        "days": [
            {{
                "day": 1,
                "activities": [
                    {{
                        "time": "9:00 AM",
                        "activity": "Visit Amber Fort",
                        "description": "Explore the magnificent hilltop fort with stunning architecture",
                        "location": "Amber Fort, Jaipur",
                        "cost": 200,
                        "safety_level": "high",
                        "duration": "3 hours"
                    }},
                    {{
                        "time": "2:00 PM", 
                        "activity": "City Palace Tour",
                        "description": "Royal palace complex with museums and courtyards",
                        "location": "City Palace, Jaipur",
                        "cost": 300,
                        "safety_level": "high",
                        "duration": "2 hours"
                    }}
                ],
                "accommodation": {{
                    "name": "Hotel Pearl Palace",
                    "type": "heritage hotel",
                    "location": "Pink City, Jaipur",
                    "cost": 3500,
                    "safety_rating": 5,
                    "women_friendly": true,
                    "amenities": ["WiFi", "24/7 Security", "Women-only floors"]
                }},
                "meals": [
                    {{
                        "meal": "breakfast",
                        "restaurant": "Hotel Restaurant",
                        "cuisine": "Continental",
                        "cost": 500,
                        "location": "Hotel Pearl Palace"
                    }},
                    {{
                        "meal": "lunch",
                        "restaurant": "Chokhi Dhani",
                        "cuisine": "Rajasthani",
                        "cost": 800,
                        "location": "Near City Palace"
                    }},
                    {{
                        "meal": "dinner",
                        "restaurant": "Peacock Rooftop",
                        "cuisine": "North Indian",
                        "cost": 700,
                        "location": "Hawa Mahal area"
                    }}
                ],
                "estimated_cost": 6000,
                "safety_tips": ["Use prepaid taxis", "Stay in well-lit market areas", "Keep hotel contact card"]
            }}
        ],
        "total_cost": {min(request.budget, request.budget * 0.9)},
        "safety_score": 88,
        "community_experiences": [
            {{
                "activity": "Block printing workshop",
                "host": "Local artisan Sunita",
                "cost": 1200,
                "impact": "Supports traditional craftswomen"
            }}
        ]
    }}
    
    Create {request.duration} days. Keep total cost under ₹{request.budget:,}. Include realistic activities for {request.destination}."""
    
    return base_prompt

def calculate_community_impact(itinerary_data: dict, budget: int) -> dict:
    community_percentage = 0.4  # 40% goes to community
    community_experiences = itinerary_data.get('community_experiences', [])
    
    families_benefited = max(1, len(community_experiences))
    total_impact = budget * community_percentage
    
    return {
        "total_impact": int(total_impact),
        "families_benefited": families_benefited,
        "local_jobs_supported": len(community_experiences),
        "community_experiences": community_experiences,
        "impact_percentage": 40
    }

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Welcome to Sanskriti - AI Travel Planner for India"}

@api_router.post("/itinerary/generate", response_model=Itinerary)
async def generate_itinerary(request: TripRequest):
    try:
        # Fetch real travel data first
        is_solo_female = request.travel_mode == "solo_female"
        real_data = await get_real_travel_data(
            request.destination, 
            request.budget, 
            request.duration, 
            request.theme, 
            is_solo_female
        )
        
        # Generate AI itinerary with real data
        chat = get_llm_chat()
        prompt = generate_enhanced_trip_prompt(request, real_data)
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        logging.info(f"LLM Raw Response (first 500 chars): {response[:500]}")
        
        # Parse AI response with improved error handling
        itinerary_data = None
        try:
            # Try to extract JSON from response if it contains extra text
            response_text = response.strip()
            
            # Find JSON start and end
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            
            if json_start != -1 and json_end > json_start:
                json_text = response_text[json_start:json_end]
                itinerary_data = json.loads(json_text)
                logging.info("Successfully parsed JSON from LLM response")
            else:
                raise ValueError("No valid JSON found in response")
                
        except (json.JSONDecodeError, ValueError) as e:
            logging.error(f"JSON parsing failed: {str(e)}")
            logging.error(f"Raw response: {response}")
            
            # Create fallback itinerary with sample data
            itinerary_data = {
                "days": [
                    {
                        "day": i + 1,
                        "activities": [
                            {
                                "time": "10:00 AM",
                                "activity": f"Explore {request.destination} - Day {i + 1}",
                                "description": f"Discover the highlights of {request.destination}",
                                "location": request.destination,
                                "cost": 1000,
                                "safety_level": "high", 
                                "duration": "4 hours"
                            }
                        ],
                        "accommodation": {
                            "name": f"Safe Hotel in {request.destination}",
                            "type": "hotel",
                            "location": request.destination,
                            "cost": int(request.budget * 0.4 / request.duration),
                            "safety_rating": 5,
                            "women_friendly": True,
                            "amenities": ["WiFi", "24/7 Security", "Women-safe"]
                        },
                        "meals": [
                            {
                                "meal": "breakfast",
                                "restaurant": "Hotel Restaurant",
                                "cuisine": "Local",
                                "cost": 300,
                                "location": "Hotel"
                            },
                            {
                                "meal": "lunch", 
                                "restaurant": "Local Restaurant",
                                "cuisine": "Regional",
                                "cost": 500,
                                "location": "City Center"
                            },
                            {
                                "meal": "dinner",
                                "restaurant": "Women-Safe Restaurant", 
                                "cuisine": "Indian",
                                "cost": 600,
                                "location": "Near Hotel"
                            }
                        ],
                        "estimated_cost": int(request.budget * 0.6 / request.duration),
                        "safety_tips": [
                            "Use trusted transportation",
                            "Stay in well-lit areas",
                            "Keep emergency contacts handy",
                            "Inform hotel about your daily plans"
                        ]
                    } for i in range(request.duration)
                ],
                "total_cost": int(request.budget * 0.8),
                "safety_score": 85,
                "community_experiences": [
                    {
                        "activity": "Local craft workshop",
                        "host": f"Community partner in {request.destination}",
                        "cost": 800,
                        "impact": "Supports local artisans and families"
                    }
                ]
            }
        
        # Calculate community impact
        community_impact = calculate_community_impact(itinerary_data, request.budget)
        
        # Create itinerary object
        itinerary = Itinerary(
            destination=request.destination,
            budget=request.budget,
            duration=request.duration,
            theme=request.theme,
            travel_mode=request.travel_mode,
            period_friendly=request.period_friendly or False,
            days=[ItineraryDay(**day) for day in itinerary_data.get('days', [])],
            total_cost=itinerary_data.get('total_cost', request.budget),
            community_impact=community_impact,
            safety_score=itinerary_data.get('safety_score', 80)
        )
        
        # Save to database
        itinerary_dict = itinerary.dict()
        itinerary_dict['created_at'] = itinerary_dict['created_at'].isoformat()
        await db.itineraries.insert_one(itinerary_dict)
        
        logging.info(f"Successfully created itinerary with {len(itinerary.days)} days")
        return itinerary
        
    except Exception as e:
        logging.error(f"Error generating itinerary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating itinerary: {str(e)}")

@api_router.get("/itinerary/{itinerary_id}", response_model=Itinerary)
async def get_itinerary(itinerary_id: str):
    itinerary = await db.itineraries.find_one({"id": itinerary_id})
    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    
    # Parse datetime
    if isinstance(itinerary['created_at'], str):
        itinerary['created_at'] = datetime.fromisoformat(itinerary['created_at'])
    
    return Itinerary(**itinerary)

@api_router.get("/community/hosts", response_model=List[CommunityHost])
async def get_community_hosts():
    # Mock community hosts data
    mock_hosts = [
        {
            "name": "Meera Sharma",
            "location": "Jaipur, Rajasthan",
            "services": ["Pottery Workshop", "Traditional Cooking", "Henna Art"],
            "rating": 4.8,
            "story": "Local artisan preserving traditional Rajasthani pottery techniques for 15+ years",
            "photo_url": "https://images.unsplash.com/photo-1520466809213-7b9a56adcd45?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHRyYXZlbHxlbnwwfHx8fDE3NTgzNjU1ODV8MA&ixlib=rb-4.1.0&q=85"
        },
        {
            "name": "Ravi Kumar",
            "location": "Munnar, Kerala", 
            "services": ["Spice Farm Tour", "Tea Plantation Walk", "Ayurvedic Wellness"],
            "rating": 4.9,
            "story": "Third-generation spice farmer sharing Kerala's natural heritage with travelers",
            "photo_url": "https://images.unsplash.com/photo-1626964799839-aadc2fc1e738?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwyfHx3b21hbiUyMHRyYXZlbHxlbnwwfHx8fDE3NTgzNjU1ODV8MA&ixlib=rb-4.1.0&q=85"
        }
    ]
    
    return [CommunityHost(**host) for host in mock_hosts]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()