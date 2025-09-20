from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import json

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Initialize LLM integration
from emergentintegrations.llm.chat import LlmChat, UserMessage

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

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

# Initialize LLM Chat
def get_llm_chat():
    return LlmChat(
        api_key=os.environ.get('EMERGENT_LLM_KEY'),
        session_id=str(uuid.uuid4()),
        system_message="""You are Sakhi, an AI travel assistant specialized in planning trips for Indian travelers. 
        You excel at creating detailed, culturally sensitive itineraries that prioritize safety, especially for solo female travelers.
        Always provide responses in valid JSON format with proper structure for itineraries."""
    ).with_model("openai", "gpt-4o-mini")

# Helper Functions
def generate_trip_prompt(request: TripRequest) -> str:
    base_prompt = f"""Create a detailed {request.duration}-day itinerary for {request.destination} with a budget of ₹{request.budget:,} focusing on {request.theme} experiences."""
    
    if request.travel_mode == "solo_female":
        base_prompt += f""" This is for a solo female traveler. IMPORTANT REQUIREMENTS:
        - Prioritize women-safe accommodations with good reviews and security
        - Include well-lit, populated areas for activities
        - Suggest reliable transportation options
        - Provide emergency contacts and safety tips for each day
        {"- Include period-friendly facilities (clean restrooms, nearby pharmacies, comfortable spaces)" if request.period_friendly else ""}
        - Focus on empowering and enriching experiences"""
    
    base_prompt += f"""

    Return a JSON response with this exact structure:
    {{
        "days": [
            {{
                "day": 1,
                "activities": [
                    {{
                        "time": "10:00 AM",
                        "activity": "Visit Red Fort",
                        "description": "Explore the historic Mughal architecture",
                        "location": "Red Fort, Delhi",
                        "cost": 50,
                        "safety_level": "high",
                        "duration": "2 hours"
                    }}
                ],
                "accommodation": {{
                    "name": "Hotel Name",
                    "type": "hotel/guesthouse",
                    "location": "Area name",
                    "cost": 2500,
                    "safety_rating": 5,
                    "women_friendly": true,
                    "amenities": ["WiFi", "24/7 Security"]
                }},
                "meals": [
                    {{
                        "meal": "breakfast/lunch/dinner",
                        "restaurant": "Restaurant name",
                        "cuisine": "North Indian",
                        "cost": 400,
                        "location": "Near hotel/attraction"
                    }}
                ],
                "estimated_cost": 3000,
                "safety_tips": ["Stay in groups after 8 PM", "Keep emergency contacts handy"]
            }}
        ],
        "total_cost": 15000,
        "safety_score": 85,
        "community_experiences": [
            {{
                "activity": "Village pottery workshop",
                "host": "Local artisan Meera",
                "cost": 800,
                "impact": "Supports local craftswoman"
            }}
        ]
    }}
    
    Ensure all costs are in Indian Rupees and realistic for {request.destination}. Total cost should not exceed the budget of ₹{request.budget:,}."""
    
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
        # Generate AI itinerary
        chat = get_llm_chat()
        prompt = generate_trip_prompt(request)
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse AI response
        try:
            itinerary_data = json.loads(response)
        except json.JSONDecodeError:
            # If JSON parsing fails, create a basic itinerary
            itinerary_data = {
                "days": [],
                "total_cost": request.budget,
                "safety_score": 80,
                "community_experiences": []
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