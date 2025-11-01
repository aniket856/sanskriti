import { useEffect, useState } from "react";

/**
 * Custom hook: Dynamically adjusts cost breakdown if budget < suggested.
 * Adds adaptive logic to existing cost sections.
 */
export default function useAdaptiveBudget(itinerary, baseCosts) {
  const [adjustedCosts, setAdjustedCosts] = useState(baseCosts);

  useEffect(() => {
    if (!itinerary || !baseCosts) return;

    const totalBudget = itinerary.budget || baseCosts.total;
    let modified = { ...baseCosts };

    if (totalBudget < baseCosts.total * 0.9) {
      modified = {
        ...baseCosts,
        accommodation: Math.round(baseCosts.accommodation * 0.85),
        food: Math.round(baseCosts.food * 0.9),
        experiences: Math.round(baseCosts.experiences * 0.8),
        total:
          Math.round(baseCosts.accommodation * 0.85) +
          Math.round(baseCosts.food * 0.9) +
          Math.round(baseCosts.experiences * 0.8) +
          baseCosts.transport,
      };
    }

    setAdjustedCosts(modified);
  }, [itinerary, baseCosts]);

  return adjustedCosts;
}
