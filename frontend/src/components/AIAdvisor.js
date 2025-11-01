import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Sparkles } from "lucide-react";
import axios from "axios";

/**
 * AI Advisor: Suggests smart itinerary improvements and hidden gems.
 * - Reads itinerary props.
 * - Provides recommendations via backend AI API or mock.
 */

const AIAdvisor = ({ itinerary }) => {
  const [advice, setAdvice] = useState("Fetching smart suggestions...");

  useEffect(() => {
    const fetchAIAdvice = async () => {
      try {
        // 🧠 If your backend has an AI endpoint, connect here
        // Example: const res = await axios.post(`${API}/ai/advice`, { itinerary });

        // Mock suggestion logic
        const randomTips = [
          `🌿 Extend your stay in ${itinerary.destination} by a day to explore hidden local markets.`,
          `🍛 Try traditional thali restaurants — they’re rated highly by solo female travelers.`,
          `🌅 Visit during sunrise for fewer crowds and peaceful views.`,
          `💡 Your budget seems flexible — upgrade one night to a heritage stay for an unforgettable experience.`,
          `🧘‍♀️ Add a yoga retreat session nearby for rejuvenation.`,
        ];
        const suggestion =
          randomTips[Math.floor(Math.random() * randomTips.length)];
        setAdvice(suggestion);
      } catch (err) {
        setAdvice("AI could not generate suggestions at this moment.");
      }
    };

    if (itinerary) fetchAIAdvice();
  }, [itinerary]);

  return (
    <Card className="bg-orange-50 border-orange-200 shadow-md mt-8">
      <CardHeader>
        <CardTitle className="flex items-center text-orange-700">
          <Sparkles className="h-5 w-5 mr-2" /> AI Travel Advisor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 text-lg">{advice}</p>
      </CardContent>
    </Card>
  );
};

export default AIAdvisor;
