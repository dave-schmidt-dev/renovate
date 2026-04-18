import { COMPOST_LOCATIONS, DONATION_LOCATIONS } from "./demoData.js";
import { daysLeft } from "./receipt.js";

export function normalizeRouteDecisions(routeDecisions, inventory) {
  const byItem = new Map(routeDecisions.map((d) => [d.item.toLowerCase(), d]));
  return inventory.map((item) => {
    const known = byItem.get(item.canonicalName.toLowerCase());
    if (known) return known;

    const days = daysLeft(item);
    if (days <= 0) {
      return { item: item.canonicalName, route: "compost", reason: "Expired — compost if possible, otherwise discard." };
    }
    if (days <= 2) {
      return { item: item.canonicalName, route: "donate", reason: "Expiring very soon — donate to a local food pantry if you can't eat it today." };
    }
    if (days <= 5) {
      return { item: item.canonicalName, route: "eat", reason: `Use soon — ${days} days left. Prioritize in meals this week.` };
    }
    return { item: item.canonicalName, route: "eat", reason: `Good for ${days} more days. No rush.` };
  });
}

export function summarizeRoutes(decisions) {
  const summary = { eat: 0, donate: 0, compost: 0, failure: 0 };
  decisions.forEach((d) => {
    summary[d.route] = (summary[d.route] ?? 0) + 1;
  });
  return summary;
}

let donateIdx = 0;
let compostIdx = 0;

export function attachRouteSuggestions(route) {
  if (route === "donate") {
    const loc = DONATION_LOCATIONS[donateIdx % DONATION_LOCATIONS.length];
    donateIdx++;
    return loc;
  }
  if (route === "compost") {
    const loc = COMPOST_LOCATIONS[compostIdx % COMPOST_LOCATIONS.length];
    compostIdx++;
    return loc;
  }
  return "";
}
