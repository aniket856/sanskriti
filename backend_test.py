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
        """CRITICAL TEST: Test itinerary generation with realistic data - VERIFY AI FIX"""
        test_data = {
            "destination": "Jaipur, Rajasthan",
            "budget": 25000,
            "duration": 3,
            "theme": "heritage",
            "travel_mode": "solo_female",
            "period_friendly": True,
            "special_preferences": "Focus on women-safe areas and period-friendly facilities"
        }
        
        print(f"   🎯 CRITICAL AI FIX TEST - Request data: {json.dumps(test_data, indent=2)}")
        
        success, response = self.run_test(
            "🔥 CRITICAL: AI Itinerary Generation",
            "POST",
            "itinerary/generate",
            200,
            data=test_data,
            timeout=60  # Longer timeout for AI generation
        )
        
        if success and isinstance(response, dict):
            print(f"\n🔍 DETAILED RESPONSE VALIDATION:")
            
            # CRITICAL CHECK 1: Validate response structure
            required_fields = ['id', 'destination', 'budget', 'duration', 'theme', 'days', 'community_impact']
            missing_fields = [field for field in required_fields if field not in response]
            
            if missing_fields:
                print(f"❌ CRITICAL: Missing required fields: {missing_fields}")
                return False, response
            else:
                print(f"✅ All required fields present")
                
            # CRITICAL CHECK 2: Days array must NOT be empty (main fix verification)
            days = response.get('days', [])
            print(f"   📅 Generated {len(days)} days of itinerary (Expected: {test_data['duration']})")
            
            if len(days) == 0:
                print(f"❌ CRITICAL FAILURE: Empty days array - AI parsing still broken!")
                return False, response
            elif len(days) != test_data['duration']:
                print(f"⚠️  WARNING: Expected {test_data['duration']} days, got {len(days)}")
            else:
                print(f"✅ CRITICAL SUCCESS: Days array populated correctly!")
                
            # CRITICAL CHECK 3: Validate each day structure
            for i, day in enumerate(days):
                day_num = day.get('day', 0)
                activities = day.get('activities', [])
                accommodation = day.get('accommodation', {})
                meals = day.get('meals', [])
                safety_tips = day.get('safety_tips', [])
                
                print(f"   Day {day_num}: {len(activities)} activities, {len(meals)} meals, {len(safety_tips)} safety tips")
                
                # Check for empty critical sections
                if not activities:
                    print(f"❌ CRITICAL: Day {day_num} has no activities")
                    return False, response
                if not accommodation:
                    print(f"❌ CRITICAL: Day {day_num} has no accommodation")
                    return False, response
                if not meals:
                    print(f"❌ CRITICAL: Day {day_num} has no meals")
                    return False, response
                    
                # Validate activity structure
                first_activity = activities[0] if activities else {}
                activity_fields = ['time', 'activity', 'description', 'location', 'cost']
                activity_missing = [field for field in activity_fields if field not in first_activity]
                if activity_missing:
                    print(f"⚠️  Day {day_num} activity missing fields: {activity_missing}")
                else:
                    print(f"✅ Day {day_num} activity structure complete")
            
            # CRITICAL CHECK 4: Period-friendly features verification
            if test_data['period_friendly']:
                period_friendly = response.get('period_friendly', False)
                if not period_friendly:
                    print(f"❌ CRITICAL: Period-friendly flag not set despite request")
                    return False, response
                else:
                    print(f"✅ Period-friendly features enabled")
            
            # CRITICAL CHECK 5: Safety score for solo female travel
            safety_score = response.get('safety_score', 0)
            if safety_score < 70:  # Minimum for solo female travel
                print(f"⚠️  WARNING: Low safety score for solo female travel: {safety_score}%")
            else:
                print(f"✅ Good safety score: {safety_score}%")
            
            # CRITICAL CHECK 6: Community impact calculation
            community_impact = response.get('community_impact', {})
            impact_fields = ['total_impact', 'families_benefited', 'impact_percentage']
            impact_missing = [field for field in impact_fields if field not in community_impact]
            if impact_missing:
                print(f"❌ CRITICAL: Community impact missing fields: {impact_missing}")
                return False, response
            else:
                print(f"✅ Community impact structure complete")
                families = community_impact.get('families_benefited', 0)
                impact = community_impact.get('total_impact', 0)
                percentage = community_impact.get('impact_percentage', 0)
                print(f"   👥 Families benefited: {families}")
                print(f"   💰 Total impact: ₹{impact:,}")
                print(f"   📊 Impact percentage: {percentage}%")
            
            print(f"\n🎉 CRITICAL TEST PASSED: AI itinerary generation is working correctly!")
            return success, response
        else:
            print(f"❌ CRITICAL FAILURE: Invalid response format or API error")
            return False, response

    def test_itinerary_retrieval(self, itinerary_id):
        """Test retrieving a specific itinerary"""
        return self.run_test(
            f"Get Itinerary {itinerary_id}",
            "GET",
            f"itinerary/{itinerary_id}",
            200
        )

    def test_ai_content_quality(self):
        """Test AI content quality with different themes and scenarios"""
        test_scenarios = [
            {
                "name": "Spiritual Journey - Rishikesh",
                "data": {
                    "destination": "Rishikesh, Uttarakhand",
                    "budget": 15000,
                    "duration": 2,
                    "theme": "spiritual",
                    "travel_mode": "solo_female",
                    "period_friendly": False,
                    "special_preferences": "Focus on yoga and meditation"
                }
            },
            {
                "name": "Adventure Theme - Manali",
                "data": {
                    "destination": "Manali, Himachal Pradesh",
                    "budget": 35000,
                    "duration": 4,
                    "theme": "adventure",
                    "travel_mode": "solo_female",
                    "period_friendly": True,
                    "special_preferences": "Mountain activities and trekking"
                }
            }
        ]
        
        for scenario in test_scenarios:
            print(f"\n🔍 Testing AI Quality: {scenario['name']}")
            success, response = self.run_test(
                f"AI Quality - {scenario['name']}",
                "POST",
                "itinerary/generate",
                200,
                data=scenario['data'],
                timeout=60
            )
            
            if success and isinstance(response, dict):
                days = response.get('days', [])
                if len(days) > 0:
                    print(f"✅ Generated {len(days)} days for {scenario['name']}")
                    # Check theme relevance in activities
                    first_day = days[0]
                    activities = first_day.get('activities', [])
                    if activities:
                        first_activity = activities[0].get('activity', '').lower()
                        theme = scenario['data']['theme']
                        print(f"   First activity: {activities[0].get('activity', 'N/A')}")
                        if theme in ['spiritual'] and any(word in first_activity for word in ['yoga', 'meditation', 'temple', 'ganga']):
                            print(f"✅ Theme-relevant activity detected")
                        elif theme in ['adventure'] and any(word in first_activity for word in ['trek', 'adventure', 'mountain', 'hiking']):
                            print(f"✅ Theme-relevant activity detected")
                else:
                    print(f"❌ Empty days array for {scenario['name']}")
            else:
                print(f"❌ Failed to generate itinerary for {scenario['name']}")

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