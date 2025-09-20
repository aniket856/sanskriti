import requests
import sys
import json
from datetime import datetime

class SanskritiAPITester:
    def __init__(self, base_url="https://yatra-ai.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=30):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Non-dict response'}")
                    return True, response_data
                except:
                    return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timed out after {timeout} seconds")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )

    def test_community_hosts(self):
        """Test community hosts endpoint"""
        return self.run_test(
            "Community Hosts",
            "GET", 
            "community/hosts",
            200
        )

    def test_itinerary_generation(self):
        """Test itinerary generation with realistic data"""
        test_data = {
            "destination": "Jaipur, Rajasthan",
            "budget": 25000,
            "duration": 3,
            "theme": "heritage",
            "travel_mode": "solo_female",
            "period_friendly": True,
            "special_preferences": "Vegetarian food only, photography focus"
        }
        
        print(f"   Request data: {json.dumps(test_data, indent=2)}")
        
        success, response = self.run_test(
            "Itinerary Generation",
            "POST",
            "itinerary/generate",
            200,
            data=test_data,
            timeout=60  # Longer timeout for AI generation
        )
        
        if success and isinstance(response, dict):
            # Validate response structure
            required_fields = ['id', 'destination', 'budget', 'duration', 'theme', 'days', 'community_impact']
            missing_fields = [field for field in required_fields if field not in response]
            
            if missing_fields:
                print(f"⚠️  Missing required fields: {missing_fields}")
            else:
                print(f"✅ All required fields present")
                
            # Check if days array is populated
            days = response.get('days', [])
            print(f"   Generated {len(days)} days of itinerary")
            
            if len(days) == 0:
                print(f"⚠️  WARNING: Empty days array - possible AI parsing issue")
            else:
                # Check first day structure
                first_day = days[0]
                day_fields = ['day', 'activities', 'accommodation', 'meals', 'estimated_cost']
                day_missing = [field for field in day_fields if field not in first_day]
                if day_missing:
                    print(f"⚠️  Day structure missing fields: {day_missing}")
                else:
                    print(f"✅ Day structure complete")
                    print(f"   Day 1 has {len(first_day.get('activities', []))} activities")
            
            # Check community impact
            community_impact = response.get('community_impact', {})
            impact_fields = ['total_impact', 'families_benefited', 'impact_percentage']
            impact_missing = [field for field in impact_fields if field not in community_impact]
            if impact_missing:
                print(f"⚠️  Community impact missing fields: {impact_missing}")
            else:
                print(f"✅ Community impact structure complete")
                print(f"   Families benefited: {community_impact.get('families_benefited')}")
                print(f"   Total impact: ₹{community_impact.get('total_impact')}")
            
            return success, response
        
        return success, response

    def test_itinerary_retrieval(self, itinerary_id):
        """Test retrieving a specific itinerary"""
        return self.run_test(
            f"Get Itinerary {itinerary_id}",
            "GET",
            f"itinerary/{itinerary_id}",
            200
        )

    def test_invalid_itinerary_generation(self):
        """Test itinerary generation with invalid data"""
        invalid_data = {
            "destination": "",  # Empty destination
            "budget": -1000,    # Negative budget
            "duration": 0,      # Zero duration
            "theme": "invalid_theme"
        }
        
        return self.run_test(
            "Invalid Itinerary Generation",
            "POST",
            "itinerary/generate", 
            422,  # Expecting validation error
            data=invalid_data
        )

def main():
    print("🚀 Starting Sanskriti Travel Planner API Tests")
    print("=" * 60)
    
    tester = SanskritiAPITester()
    
    # Test 1: Root endpoint
    tester.test_root_endpoint()
    
    # Test 2: Community hosts
    tester.test_community_hosts()
    
    # Test 3: Valid itinerary generation (main functionality)
    success, itinerary_response = tester.test_itinerary_generation()
    itinerary_id = None
    if success and isinstance(itinerary_response, dict):
        itinerary_id = itinerary_response.get('id')
    
    # Test 4: Retrieve generated itinerary (if we got an ID)
    if itinerary_id:
        tester.test_itinerary_retrieval(itinerary_id)
    else:
        print("\n⚠️  Skipping itinerary retrieval test - no valid ID from generation")
    
    # Test 5: Invalid data handling
    tester.test_invalid_itinerary_generation()
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 FINAL RESULTS")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("❌ Some tests failed - check logs above")
        return 1

if __name__ == "__main__":
    sys.exit(main())