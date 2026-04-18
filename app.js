import { generatePlanWithFallback } from "./modules/ai.js";
import { DEMO_RECEIPTS } from "./modules/demoData.js";
import { buildShoppingSuggestions, summarizeRisk } from "./modules/planner.js";
import { enrichWithAlias, parseReceiptText, toInventoryItems } from "./modules/receipt.js";
import { attachRouteSuggestions, normalizeRouteDecisions, summarizeRoutes } from "./modules/routing.js";
import {
  getAliasMap,
  getInventory,
  getSettings,
  saveInventory,
  saveSettings,
  upsertAlias,
} from "./modules/storage.js";

const state = {
  aliasReviewRows: [],
  inventory: getInventory(),
  settings: getSettings(),
  recipesGenerated: 0,
};

const els = {
  mockModeToggle: document.getElementById("mockModeToggle"),
  openrouterKey: document.getElementById("openrouterKey"),
  saveKeysBtn: document.getElementById("saveKeysBtn"),
  receiptFile: document.getElementById("receiptFile"),
  receiptText: document.getElementById("receiptText"),
  scanReceiptBtn: document.getElementById("scanReceiptBtn"),
  loadScenarioBtn: document.getElementById("loadScenarioBtn"),
  receiptStatus: document.getElementById("receiptStatus"),
  aliasReviewArea: document.getElementById("aliasReviewArea"),
  confirmImportBtn: document.getElementById("confirmImportBtn"),
  inventoryMeta: document.getElementById("inventoryMeta"),
  inventoryList: document.getElementById("inventoryList"),
  generateRecipesBtn: document.getElementById("generateRecipesBtn"),
  recipesList: document.getElementById("recipesList"),
  shoppingList: document.getElementById("shoppingList"),
  routingSummary: document.getElementById("routingSummary"),
  routingList: document.getElementById("routingList"),
  failureCountBadge: document.getElementById("failureCountBadge"),
  goToReceiptBtn: document.getElementById("goToReceiptBtn"),
  quickDemoBtn: document.getElementById("quickDemoBtn"),
  statItemsAtRisk: document.getElementById("statItemsAtRisk"),
  statMealsGenerated: document.getElementById("statMealsGenerated"),
  statItemsRescued: document.getElementById("statItemsRescued"),
  statFailureCount: document.getElementById("statFailureCount"),
  testKeysBtn: document.getElementById("testKeysBtn"),
  settingsStatus: document.getElementById("settingsStatus"),
};

init();

function init() {
  els.mockModeToggle.checked = state.settings.mockMode;
  els.openrouterKey.value = state.settings.openrouterKey || "";
  bindEvents();
  setupNav();
  renderInventory();
  renderFailureBadge(0);
}

function bindEvents() {
  els.saveKeysBtn.addEventListener("click", () => {
    state.settings.mockMode = els.mockModeToggle.checked;
    state.settings.openrouterKey = els.openrouterKey.value.trim();
    saveSettings(state.settings);
    showSettingsStatus("Saved", "success");
  });

  els.testKeysBtn.addEventListener("click", async () => {
    const key = els.openrouterKey.value.trim();
    if (!key) {
      showSettingsStatus("Enter your OpenRouter API key first", "error");
      return;
    }
    showSettingsStatus("Testing...", "neutral");
    try {
      const res = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { "Authorization": "Bearer " + key },
      });
      if (res.ok) {
        showSettingsStatus("OpenRouter OK", "success");
      } else {
        const data = await res.json().catch(() => ({}));
        const detail = data?.error?.message || `status ${res.status}`;
        showSettingsStatus(`OpenRouter: ${detail}`, "error");
      }
    } catch (e) {
      showSettingsStatus(`OpenRouter unreachable: ${e.message}`, "error");
    }
  });

  els.loadScenarioBtn.addEventListener("click", () => {
    const sample = DEMO_RECEIPTS[Math.floor(Math.random() * DEMO_RECEIPTS.length)];
    els.receiptText.value = sample;
    setStatus("Loaded a demo receipt scenario.");
  });

  els.scanReceiptBtn.addEventListener("click", async () => {
    setStatus("Scanning receipt...");
    const text = await readInputReceipt();
    if (!text) {
      setStatus("No receipt text found. Upload a file or paste lines.");
      return;
    }
    const parsed = parseReceiptText(text);
    const enriched = enrichWithAlias(parsed, getAliasMap());
    state.aliasReviewRows = enriched;
    renderAliasCards();
    setStatus(`Parsed ${enriched.length} lines. Review low-confidence items and import.`);
  });

  els.confirmImportBtn.addEventListener("click", () => {
    const rows = collectAliasRows();
    rows.forEach((row) => {
      if (row.remember && row.rawLabel && row.canonicalFoodName) {
        upsertAlias(row.rawLabel, row.canonicalFoodName);
      }
    });
    const imported = toInventoryItems(rows);
    state.inventory = [...state.inventory, ...imported];
    saveInventory(state.inventory);
    renderInventory();
    setStatus(`Imported ${imported.length} inventory items.`);
  });

  els.generateRecipesBtn.addEventListener("click", async () => {
    if (!state.inventory.length) {
      setStatus("Import food items first before generating recipes.");
      return;
    }
    setStatus("Generating recipes and sustainability routing...");
    try {
      const result = await generatePlanWithFallback(state.inventory, {
        ...state.settings,
        mockMode: els.mockModeToggle.checked,
      });
      const recipes = result.recipes || [];
      const shopping = buildShoppingSuggestions(recipes);
      const decisions = normalizeRouteDecisions(result.routeDecisions || [], state.inventory);
      const summary = summarizeRoutes(decisions);

      state.recipesGenerated += recipes.length;
      renderRecipes(recipes, result.provider);
      renderShopping(shopping);
      renderRouting(decisions, summary);
      renderFailureBadge(summary.failure || 0);
      updateDashboard(decisions, summary);
      setStatus(`Generated ${recipes.length} recipes using provider: ${result.provider}`);
    } catch {
      setStatus("Recipe generation failed. Try again or switch providers.");
    }
  });

  els.goToReceiptBtn.addEventListener("click", () => scrollToSection("section-receipt"));

  els.quickDemoBtn.addEventListener("click", () => {
    const sample = DEMO_RECEIPTS[Math.floor(Math.random() * DEMO_RECEIPTS.length)];
    els.receiptText.value = sample;
    setStatus("Demo loaded. Running scan...");
    setTimeout(() => {
      els.scanReceiptBtn.click();
      setTimeout(() => {
        els.confirmImportBtn.click();
        setTimeout(() => {
          els.generateRecipesBtn.click();
          setTimeout(() => scrollToSection("section-recipes"), 300);
        }, 300);
      }, 300);
    }, 300);
  });
}

function setupNav() {
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      scrollToSection(link.dataset.section);
    });
  });

  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-link");
  const activeClasses = ["bg-surface-container-lowest", "text-primary", "shadow-sm", "font-semibold"];

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((link) => {
          if (link.dataset.section === entry.target.id) {
            link.classList.add(...activeClasses);
          } else {
            link.classList.remove(...activeClasses);
          }
        });
      }
    });
  }, { threshold: 0.3 });

  sections.forEach((s) => observer.observe(s));
}

async function readInputReceipt() {
  if (els.receiptText.value.trim()) return els.receiptText.value.trim();
  const file = els.receiptFile.files?.[0];
  if (!file) return "";
  return file.text();
}

function renderAliasCards() {
  clearElement(els.aliasReviewArea);
  state.aliasReviewRows.forEach((row, idx) => {
    const score = row.confidenceScore;
    let confidenceClass, dotClass;
    if (score >= 0.9) {
      confidenceClass = "bg-primary-fixed text-primary";
      dotClass = "bg-primary";
    } else if (score >= 0.5) {
      confidenceClass = "bg-tertiary-fixed text-on-tertiary-fixed";
      dotClass = "bg-tertiary";
    } else {
      confidenceClass = "bg-error-container text-on-error-container";
      dotClass = "bg-error";
    }

    const card = document.createElement("div");
    card.className = "bg-surface-container-low rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center";

    const labelCol = document.createElement("div");
    labelCol.className = "flex items-center gap-3 min-w-[140px]";
    const icon = document.createElement("span");
    icon.className = "material-symbols-outlined text-outline-variant";
    icon.textContent = "receipt";
    const rawSpan = document.createElement("span");
    rawSpan.className = "font-headline font-bold text-base";
    rawSpan.textContent = row.rawLabel;
    labelCol.appendChild(icon);
    labelCol.appendChild(rawSpan);

    const fieldsCol = document.createElement("div");
    fieldsCol.className = "flex-1 flex flex-col sm:flex-row gap-3 w-full";

    const canonicalInput = document.createElement("input");
    canonicalInput.dataset.field = "canonicalFoodName";
    canonicalInput.dataset.idx = String(idx);
    canonicalInput.value = row.canonicalFoodName;
    canonicalInput.className = "flex-1 bg-surface-container-high border-none rounded-xl px-3 py-2 font-body text-sm";

    const expiresInput = document.createElement("input");
    expiresInput.dataset.field = "expiresInDays";
    expiresInput.dataset.idx = String(idx);
    expiresInput.type = "number";
    expiresInput.min = "1";
    expiresInput.max = "60";
    expiresInput.value = "";
    expiresInput.placeholder = "auto";
    expiresInput.className = "w-20 bg-surface-container-high border-none rounded-xl px-3 py-2 font-body text-sm";

    const confidenceBadge = document.createElement("span");
    confidenceBadge.className = `inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${confidenceClass}`;
    const dot = document.createElement("span");
    dot.className = `w-1.5 h-1.5 rounded-full ${dotClass}`;
    confidenceBadge.appendChild(dot);
    confidenceBadge.appendChild(document.createTextNode(`${Math.round(score * 100)}%`));

    const rememberLabel = document.createElement("label");
    rememberLabel.className = "flex items-center gap-2 cursor-pointer shrink-0";
    const toggleDiv = document.createElement("div");
    toggleDiv.className = "toggle-switch";
    const rememberInput = document.createElement("input");
    rememberInput.dataset.field = "remember";
    rememberInput.dataset.idx = String(idx);
    rememberInput.type = "checkbox";
    rememberInput.checked = score < 0.95;
    const slider = document.createElement("span");
    slider.className = "slider";
    toggleDiv.appendChild(rememberInput);
    toggleDiv.appendChild(slider);
    const rememberText = document.createElement("span");
    rememberText.className = "font-label text-xs text-on-surface-variant";
    rememberText.textContent = "Remember";
    rememberLabel.appendChild(toggleDiv);
    rememberLabel.appendChild(rememberText);

    fieldsCol.appendChild(canonicalInput);
    fieldsCol.appendChild(expiresInput);
    fieldsCol.appendChild(confidenceBadge);
    fieldsCol.appendChild(rememberLabel);

    card.appendChild(labelCol);
    card.appendChild(fieldsCol);
    els.aliasReviewArea.appendChild(card);
  });
}

function collectAliasRows() {
  return state.aliasReviewRows.map((row, idx) => {
    const canonicalInput = document.querySelector(`input[data-field="canonicalFoodName"][data-idx="${idx}"]`);
    const expiresInput = document.querySelector(`input[data-field="expiresInDays"][data-idx="${idx}"]`);
    const rememberInput = document.querySelector(`input[data-field="remember"][data-idx="${idx}"]`);
    return {
      ...row,
      canonicalFoodName: canonicalInput?.value?.trim() || row.canonicalFoodName,
      expiresInDays: parseInt(expiresInput?.value, 10) || 0,
      remember: Boolean(rememberInput?.checked),
    };
  });
}

function renderInventory() {
  clearElement(els.inventoryMeta);
  clearElement(els.inventoryList);

  const risk = summarizeRisk(state.inventory);
  const meta = document.createElement("div");
  meta.className = "flex gap-4 mb-2 font-label text-sm text-on-surface-variant";
  const totalSpan = document.createElement("span");
  const totalStrong = document.createElement("strong");
  totalStrong.textContent = risk.total;
  totalSpan.appendChild(document.createTextNode("Total: "));
  totalSpan.appendChild(totalStrong);
  const riskSpan = document.createElement("span");
  const riskStrong = document.createElement("strong");
  riskStrong.className = "text-error";
  riskStrong.textContent = risk.highRisk;
  riskSpan.appendChild(document.createTextNode("High Risk (\u22643 days): "));
  riskSpan.appendChild(riskStrong);
  meta.appendChild(totalSpan);
  meta.appendChild(riskSpan);
  els.inventoryMeta.appendChild(meta);

  updateDashboard(null, null);

  state.inventory.forEach((item) => {
    const days = item.expiresInDays;
    let riskBarClass, expiryBadgeClass;
    if (days <= 3) {
      riskBarClass = "risk-bar-high";
      expiryBadgeClass = "bg-error-container text-on-error-container";
    } else if (days <= 7) {
      riskBarClass = "risk-bar-medium";
      expiryBadgeClass = "bg-secondary-fixed text-on-secondary-fixed";
    } else {
      riskBarClass = "risk-bar-low";
      expiryBadgeClass = "bg-surface-container text-on-surface-variant";
    }

    const card = document.createElement("div");
    card.className = "bg-surface-container-lowest rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden";

    const riskBar = document.createElement("div");
    riskBar.className = `absolute left-0 top-0 bottom-0 w-1 ${riskBarClass}`;

    const iconBox = document.createElement("div");
    iconBox.className = "w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0";
    const iconSpan = document.createElement("span");
    iconSpan.className = "material-symbols-outlined text-on-surface-variant";
    iconSpan.textContent = foodIcon(item.canonicalName);
    iconBox.appendChild(iconSpan);

    const info = document.createElement("div");
    info.className = "flex-1";

    const topRow = document.createElement("div");
    topRow.className = "flex justify-between items-start";
    const nameEl = document.createElement("h3");
    nameEl.className = "font-headline font-bold text-sm text-on-surface";
    nameEl.textContent = toTitleCase(item.canonicalName);
    const expiryBadge = document.createElement("span");
    expiryBadge.className = `${expiryBadgeClass} px-2 py-0.5 rounded-full font-label text-[10px] font-bold uppercase`;
    expiryBadge.textContent = `${days} Days`;
    topRow.appendChild(nameEl);
    topRow.appendChild(expiryBadge);

    const subRow = document.createElement("div");
    subRow.className = "flex gap-4 mt-1";
    const qtySpan = document.createElement("span");
    qtySpan.className = "font-body text-xs text-on-surface-variant";
    qtySpan.textContent = `Qty: ${item.quantity}`;
    const rawSpan = document.createElement("span");
    rawSpan.className = "font-body text-xs text-on-surface-variant";
    rawSpan.textContent = `Raw: ${item.rawLabel}`;
    subRow.appendChild(qtySpan);
    subRow.appendChild(rawSpan);

    info.appendChild(topRow);
    info.appendChild(subRow);
    card.appendChild(riskBar);
    card.appendChild(iconBox);
    card.appendChild(info);
    els.inventoryList.appendChild(card);
  });
}

function renderRecipes(recipes, provider) {
  clearElement(els.recipesList);
  const providerNote = document.createElement("p");
  providerNote.className = "font-label text-xs text-on-surface-variant mb-3";
  providerNote.textContent = `Provider: ${provider}`;
  els.recipesList.appendChild(providerNote);

  recipes.forEach((recipe) => {
    const card = document.createElement("div");
    card.className = "bg-surface-container-lowest rounded-3xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]";

    const title = document.createElement("h4");
    title.className = "font-headline font-bold text-lg text-on-surface mb-3";
    title.textContent = recipe.recipeName;

    const badges = document.createElement("div");
    badges.className = "flex flex-wrap gap-2 mb-3";
    (recipe.usesItems || []).forEach((name) => {
      const b = document.createElement("span");
      b.className = "bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full text-xs font-medium";
      b.textContent = name;
      badges.appendChild(b);
    });
    (recipe.missingItems || []).forEach((name) => {
      const b = document.createElement("span");
      b.className = "bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full text-xs font-medium";
      b.textContent = name;
      badges.appendChild(b);
    });

    const steps = document.createElement("ol");
    steps.className = "list-decimal list-inside space-y-1 font-body text-sm text-on-surface-variant";
    (recipe.steps || []).forEach((step) => {
      const li = document.createElement("li");
      li.textContent = step;
      steps.appendChild(li);
    });

    card.appendChild(title);
    card.appendChild(badges);
    card.appendChild(steps);
    els.recipesList.appendChild(card);
  });
}

function renderShopping(items) {
  clearElement(els.shoppingList);
  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "bg-surface-container-lowest rounded-2xl p-4 flex items-center gap-3";

    const inner = document.createElement("div");
    inner.className = "flex-1";

    const topRow = document.createElement("div");
    topRow.className = "flex items-center gap-2";
    const nameEl = document.createElement("span");
    nameEl.className = "font-headline font-bold text-sm text-on-surface";
    nameEl.textContent = item.name;
    const badge = document.createElement("span");
    badge.className = item.required
      ? "bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-label text-xs font-medium"
      : "bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full font-label text-xs font-medium";
    badge.textContent = item.required ? "required" : "optional";
    topRow.appendChild(nameEl);
    topRow.appendChild(badge);

    const usedBy = document.createElement("p");
    usedBy.className = "font-body text-xs text-on-surface-variant mt-1";
    usedBy.textContent = `Used by: ${(item.recipes || []).join(", ")}`;

    inner.appendChild(topRow);
    inner.appendChild(usedBy);
    card.appendChild(inner);
    els.shoppingList.appendChild(card);
  });
}

function renderRouting(decisions, summary) {
  clearElement(els.routingSummary);
  clearElement(els.routingList);

  const routeConfig = {
    eat: { icon: "restaurant", badgeClass: "bg-secondary-container text-on-secondary-container" },
    donate: { icon: "volunteer_activism", badgeClass: "bg-primary-fixed text-primary" },
    compost: { icon: "compost", badgeClass: "bg-tertiary-fixed text-on-tertiary-fixed" },
    failure: { icon: "delete", badgeClass: "bg-error-container text-on-error-container" },
  };

  ["eat", "donate", "compost", "failure"].forEach((key) => {
    const cfg = routeConfig[key];
    const stat = document.createElement("div");
    stat.className = "bg-surface-container-lowest rounded-2xl p-4 flex items-center gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)]";
    const iconEl = document.createElement("span");
    iconEl.className = "material-symbols-outlined text-[20px] text-on-surface-variant";
    iconEl.textContent = cfg.icon;
    const textBox = document.createElement("div");
    const countEl = document.createElement("p");
    countEl.className = "font-headline font-bold text-xl text-on-surface";
    countEl.textContent = String(summary[key] || 0);
    const labelEl = document.createElement("p");
    labelEl.className = "font-label text-xs text-on-surface-variant";
    labelEl.textContent = `${key[0].toUpperCase()}${key.slice(1)}`;
    textBox.appendChild(countEl);
    textBox.appendChild(labelEl);
    stat.appendChild(iconEl);
    stat.appendChild(textBox);
    els.routingSummary.appendChild(stat);
  });

  decisions.forEach((d) => {
    const cfg = routeConfig[d.route] || routeConfig.failure;
    const suggest = attachRouteSuggestions(d.route);

    const card = document.createElement("div");
    card.className = "bg-surface-container-lowest rounded-2xl p-4 flex items-start gap-3";

    const iconEl = document.createElement("span");
    iconEl.className = "material-symbols-outlined text-[20px] text-on-surface-variant mt-0.5";
    iconEl.textContent = cfg.icon;

    const body = document.createElement("div");
    body.className = "flex-1";

    const topRow = document.createElement("div");
    topRow.className = "flex items-center gap-2 mb-1";

    if (d.route === "failure") {
      const s = document.createElement("s");
      s.className = "font-headline font-bold text-sm text-on-surface-variant";
      s.textContent = d.item;
      topRow.appendChild(s);
    } else {
      const nameEl = document.createElement("span");
      nameEl.className = "font-headline font-bold text-sm text-on-surface";
      nameEl.textContent = d.item;
      topRow.appendChild(nameEl);
    }

    const routeBadge = document.createElement("span");
    routeBadge.className = `${cfg.badgeClass} px-2 py-0.5 rounded-full font-label text-xs font-medium`;
    routeBadge.textContent = d.route;
    topRow.appendChild(routeBadge);

    const reason = document.createElement("p");
    reason.className = "font-body text-xs text-on-surface-variant";
    reason.textContent = d.reason || "";

    body.appendChild(topRow);
    body.appendChild(reason);

    if (suggest) {
      const rec = document.createElement("p");
      rec.className = "font-body text-xs text-on-surface-variant mt-1";
      rec.textContent = `Suggestion: ${suggest}`;
      body.appendChild(rec);
    }

    card.appendChild(iconEl);
    card.appendChild(body);
    els.routingList.appendChild(card);
  });
}

function updateDashboard(decisions, summary) {
  const atRisk = state.inventory.filter((i) => i.expiresInDays <= 3).length;
  setStatCard(els.statItemsAtRisk, atRisk);
  setStatCard(els.statMealsGenerated, state.recipesGenerated);
  if (decisions && summary) {
    setStatCard(els.statItemsRescued, (summary.eat || 0) + (summary.donate || 0));
    setStatCard(els.statFailureCount, summary.failure || 0);
  }
}

function setStatCard(cardEl, value) {
  if (!cardEl) return;
  const p = cardEl.querySelector("p.font-headline");
  if (p) p.textContent = String(value);
}

function renderFailureBadge(count) {
  els.failureCountBadge.textContent = `${count} Failures`;
}

function setStatus(msg) {
  els.receiptStatus.textContent = msg;
}

function showSettingsStatus(msg, type) {
  const el = els.settingsStatus;
  el.textContent = msg;
  el.className = "font-body text-sm";
  if (type === "success") el.classList.add("text-primary");
  else if (type === "error") el.classList.add("text-error");
  else el.classList.add("text-on-surface-variant");
}

function clearElement(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function toTitleCase(str) {
  return String(str).replace(/\b\w/g, (c) => c.toUpperCase());
}

function foodIcon(name) {
  const n = String(name).toLowerCase();
  if (/milk|dairy|cheese|yogurt/.test(n)) return "water_drop";
  if (/chicken|beef|pork|meat|fish|salmon|tuna/.test(n)) return "kebab_dining";
  if (/bread|bagel|muffin|roll/.test(n)) return "bakery_dining";
  if (/apple|banana|orange|fruit|berry|grape/.test(n)) return "nutrition";
  if (/carrot|broccoli|spinach|lettuce|vegetable|veggie/.test(n)) return "eco";
  if (/egg/.test(n)) return "egg";
  return "nutrition";
}
