import { COMPOST_LOCATIONS, DONATION_LOCATIONS } from "./demoData.js";

export function normalizeRouteDecisions(routeDecisions, inventory) {
  const byItem = new Map(routeDecisions.map((d) => [d.item.toLowerCase(), d]));
  return inventory.map((item) => {
    const known = byItem.get(item.canonicalName.toLowerCase());
    if (known) return known;

    if (item.expiresInDays <= 2) {
      return { item: item.canonicalName, route: "donate", reason: "Urgent but not in selected recipes." };
    }
    if (item.expiresInDays <= 6) {
      return { item: item.canonicalName, route: "compost", reason: "Moderate urgency and not selected." };
    }
    return { item: item.canonicalName, route: "eat", reason: "Still within useful shelf window." };
  });
}

export function summarizeRoutes(decisions) {
  const summary = { eat: 0, donate: 0, compost: 0, failure: 0 };
  decisions.forEach((d) => {
    summary[d.route] = (summary[d.route] ?? 0) + 1;
  });
  return summary;
}

export function attachRouteSuggestions(route) {
  if (route === "donate") return DONATION_LOCATIONS[0];
  if (route === "compost") return COMPOST_LOCATIONS[0];
  return "";
}
