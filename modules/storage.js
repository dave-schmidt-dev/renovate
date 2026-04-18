const KEYS = {
  aliasMap: "leftoverLens.aliasMap",
  inventory: "leftoverLens.inventory",
  settings: "leftoverLens.settings",
};

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getAliasMap() {
  return loadJson(KEYS.aliasMap, {});
}

export function upsertAlias(rawToken, canonicalName) {
  const aliasMap = getAliasMap();
  aliasMap[rawToken.trim().toUpperCase()] = canonicalName.trim().toLowerCase();
  saveJson(KEYS.aliasMap, aliasMap);
}

export function getInventory() {
  return loadJson(KEYS.inventory, []);
}

export function saveInventory(items) {
  saveJson(KEYS.inventory, items);
}

export function getSettings() {
  return loadJson(KEYS.settings, {
    mockMode: true,
    openrouterKey: "",
    emailjsPublicKey: "",
    emailjsServiceId: "",
    emailjsTemplateId: "",
    emailRecipient: "",
  });
}

export function saveSettings(settings) {
  saveJson(KEYS.settings, settings);
}
