import requests
import json

def test_llm_response():
    """Test what the LLM is actually returning"""
    url = "https://yatra-ai.preview.emergentagent.com/api/itinerary/generate"
    
    test_data = {
        "destination": "Jaipur, Rajasthan",
        "budget": 25000,
        "duration": 3,
        "theme": "heritage",
        "travel_mode": "solo_female",
        "period_friendly": True,
        "special_preferences": "Vegetarian food only"
    }
    
    print("🔍 Testing LLM Response Details...")
    print(f"Request: {json.dumps(test_data, indent=2)}")
    
    try:
        response = requests.post(url, json=test_data, timeout=60)
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\nFull Response:")
            print(json.dumps(data, indent=2))
            
            # Check specific fields
            print(f"\nAnalysis:")
            print(f"- ID: {data.get('id')}")
            print(f"- Destination: {data.get('destination')}")
            print(f"- Days array length: {len(data.get('days', []))}")
            print(f"- Total cost: {data.get('total_cost')}")
            print(f"- Safety score: {data.get('safety_score')}")
            
            days = data.get('days', [])
            if len(days) == 0:
                print("❌ ISSUE: Empty days array - AI parsing failed")
            else:
                print(f"✅ Generated {len(days)} days")
                for i, day in enumerate(days):
                    print(f"  Day {i+1}: {len(day.get('activities', []))} activities")
        else:
            print(f"❌ Request failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    test_llm_response()