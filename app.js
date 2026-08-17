/**
 * MoneyLens Application Logic
 */

// State
let currentPage = "home";
let simpleMode = false;
let quizStep = 0;
let userProfile = {
  amount: 50000,
  duration: 12,
  goal: "emergency",
  needAccess: "anytime",
  riskPreference: "very_low",
  capitalProtectionImportant: true,
  priority: "stability"
};
let selectedForCompare = [];
let currentRanked = [];

// Quiz questions
const QUIZ = [
  {
    id: "amount",
    question: "How much money do you want to place?",
    type: "amount",
    options: [
      { value: 10000, label: "RM 10,000" },
      { value: 30000, label: "RM 30,000" },
      { value: 50000, label: "RM 50,000" },
      { value: 100000, label: "RM 100,000" },
      { value: 200000, label: "RM 200,000+" }
    ]
  },
  {
    id: "duration",
    question: "How long can you leave this money?",
    type: "duration",
    options: [
      { value: 3, label: "3 months or less" },
      { value: 6, label: "Around 6 months" },
      { value: 12, label: "1 year" },
      { value: 36, label: "2–3 years" },
      { value: 60, label: "5 years or more" }
    ]
  },
  {
    id: "goal",
    question: "What is your main goal?",
    type: "goal",
    options: [
      { value: "emergency", label: "Emergency Fund", desc: "Safety net I can access anytime" },
      { value: "house", label: "House / Property Deposit", desc: "Saving towards a down payment" },
      { value: "education", label: "Education", desc: "Future education costs" },
      { value: "vacation", label: "Vacation / Short-term", desc: "Trip or purchase within 1–2 years" },
      { value: "retirement", label: "Long-term / Retirement", desc: "Growing money over many years" },
      { value: "general", label: "General Savings", desc: "No specific goal yet" },
      { value: "max_return", label: "Maximum Possible Return", desc: "I want the highest yield I can get" }
    ]
  },
  {
    id: "needAccess",
    question: "How quickly might you need this money?",
    type: "needAccess",
    options: [
      { value: "anytime", label: "I need instant access", desc: "Can withdraw same day or next day" },
      { value: "few_weeks", label: "Within a few weeks is fine", desc: "T+1 to T+7 is acceptable" },
      { value: "locked_ok", label: "I can lock it for the period", desc: "Happy to lock for the full duration" }
    ]
  },
  {
    id: "riskPreference",
    question: "How do you feel about risk?",
    type: "riskPreference",
    options: [
      { value: "very_low", label: "I want zero chance of losing principal", desc: "Capital protection is critical" },
      { value: "low", label: "Very low risk is preferred", desc: "Small fluctuations are okay if rare" },
      { value: "balanced", label: "Balanced is fine", desc: "Some risk for better return is acceptable" },
      { value: "higher", label: "I’m open to higher risk for higher return", desc: "I understand returns can vary" }
    ]
  },
  {
    id: "capitalProtectionImportant",
    question: "Is capital protection important to you?",
    type: "capitalProtectionImportant",
    options: [
      { value: true, label: "Yes — I only want protected products", desc: "PIDM or equivalent protection required" },
      { value: false, label: "Not strictly required", desc: "I’m okay with money market / unit trust risk" }
    ]
  },
  {
    id: "priority",
    question: "What matters more to you right now?",
    type: "priority",
    options: [
      { value: "stability", label: "Stability & Peace of Mind", desc: "I sleep better knowing the money is safe" },
      { value: "return", label: "Maximum Return", desc: "I want every ringgit to work harder" },
      { value: "flexibility", label: "Flexibility & Access", desc: "I need to be able to move money easily" },
      { value: "balance", label: "A Sensible Balance", desc: "Good mix of all factors" }
    ]
  }
];

// ---------- Navigation ----------
function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const el = document.getElementById("page-" + pageId);
  if (el) {
    el.classList.add("active");
    currentPage = pageId;
  }
  
  // Update nav active state
  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.toggle("active", link.dataset.page === pageId);
  });
  
  // Page-specific init
  if (pageId === "home") renderDemoCards();
  if (pageId === "find") {
    quizStep = 0;
    renderQuizStep();
  }
  if (pageId === "compare") renderProductGrid();
  if (pageId === "learn") renderLearn();
  
  window.scrollTo({ top: 0, behavior: "smooth" });
  closeMobile();
  lucide.createIcons();
}

function closeMobile() {
  document.getElementById("mobileMenu").classList.add("hidden");
}

document.getElementById("mobileMenuBtn")?.addEventListener("click", () => {
  document.getElementById("mobileMenu").classList.toggle("hidden");
});

// ---------- Simple Mode ----------
function toggleSimpleMode() {
  simpleMode = !simpleMode;
  const btn = document.getElementById("simpleModeBtn");
  const label = document.getElementById("simpleModeLabel");
  const icon = document.getElementById("simpleModeIcon");
  if (simpleMode) {
    label.textContent = "Advanced View";
    icon.textContent = "📊";
    btn.classList.add("bg-brand-50", "border-brand-200");
  } else {
    label.textContent = "Simple Mode";
    icon.textContent = "🎓";
    btn.classList.remove("bg-brand-50", "border-brand-200");
  }
  // Re-render current views if needed
  if (currentPage === "results") renderResults();
  if (currentPage === "compare") renderProductGrid();
}

// ---------- Quiz ----------
function renderQuizStep() {
  const q = QUIZ[quizStep];
  const container = document.getElementById("quizContainer");
  const progress = ((quizStep + 1) / QUIZ.length) * 100;
  
  document.getElementById("stepLabel").textContent = `Step ${quizStep + 1} of ${QUIZ.length}`;
  document.getElementById("progressPct").textContent = Math.round(progress) + "%";
  document.getElementById("progressBar").style.width = progress + "%";
  
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  
  if (quizStep === 0) {
    prevBtn.classList.add("opacity-0", "pointer-events-none");
  } else {
    prevBtn.classList.remove("opacity-0", "pointer-events-none");
  }
  
  if (quizStep === QUIZ.length - 1) {
    nextBtn.textContent = "See My Ranking →";
  } else {
    nextBtn.textContent = "Continue";
  }
  
  let html = `<h2 class="text-2xl font-bold text-slate-900 mb-2">${q.question}</h2>`;
  if (simpleMode) {
    html += `<p class="text-sm text-slate-500 mb-6">This helps us weight the five factors correctly for you.</p>`;
  } else {
    html += `<p class="text-sm text-slate-500 mb-6">Your answer changes how we score Return, Risk, Liquidity, Fees and Reliability.</p>`;
  }
  
  html += `<div class="space-y-3">`;
  q.options.forEach(opt => {
    const selected = userProfile[q.type] === opt.value ? "selected" : "";
    html += `
      <button class="quiz-option ${selected}" onclick="selectQuizOption('${q.type}', ${typeof opt.value === 'string' ? `'${opt.value}'` : opt.value})">
        <div class="font-semibold text-slate-900">${opt.label}</div>
        ${opt.desc ? `<div class="text-sm text-slate-500 mt-0.5">${opt.desc}</div>` : ""}
      </button>
    `;
  });
  html += `</div>`;
  
  container.innerHTML = html;
}

function selectQuizOption(key, value) {
  userProfile[key] = value;
  renderQuizStep();
}

function nextStep() {
  if (quizStep < QUIZ.length - 1) {
    quizStep++;
    renderQuizStep();
  } else {
    // Generate results
    currentRanked = rankProducts(userProfile);
    showPage("results");
    renderResults();
  }
}

function prevStep() {
  if (quizStep > 0) {
    quizStep--;
    renderQuizStep();
  }
}

// ---------- Results ----------
function renderResults() {
  const personality = getMoneyPersonality(userProfile);
  const top = currentRanked[0];
  
  document.getElementById("resultsTitle").textContent = 
    `Best matches for your ${formatGoal(userProfile.goal)} goal`;
  
  document.getElementById("resultsSubtitle").textContent = 
    `RM ${userProfile.amount.toLocaleString()} • ${userProfile.duration} months • ${personality.label}`;
  
  document.getElementById("personalityBadges").innerHTML = `
    <span class="badge badge-best">${personality.label}</span>
    <span class="badge bg-slate-100 text-slate-600">${top.confidence}% Match confidence</span>
  `;
  
  const container = document.getElementById("rankedProducts");
  container.innerHTML = currentRanked.slice(0, 5).map((item, idx) => {
    const p = item.product;
    const isTop = idx === 0;
    
    return `
      <div class="bg-white rounded-2xl border ${isTop ? 'border-brand-300 shadow-glow' : 'border-slate-100 shadow-soft'} p-6 animate-in" style="animation-delay:${idx * 0.08}s">
        <div class="flex flex-col lg:flex-row lg:items-start gap-6">
          <!-- Rank + Score -->
          <div class="flex items-center gap-4 lg:flex-col lg:items-center lg:w-24">
            <div class="rank-badge ${isTop ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600'}">
              ${item.rank}
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-slate-900">${item.score}</div>
              <div class="text-xs text-slate-500">Money Fit</div>
            </div>
          </div>
          
          <!-- Main info -->
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div>
                <h3 class="text-xl font-bold text-slate-900">${p.name}</h3>
                <p class="text-sm text-slate-500">${p.institution} • ${p.typeLabel}</p>
              </div>
              <div class="flex flex-wrap gap-2">
                ${p.bestFor.slice(0, 2).map(b => `<span class="badge badge-best">${b}</span>`).join("")}
                ${renderProtectionBadge(p.capitalProtection)}
              </div>
            </div>
            
            <!-- 5 category meters -->
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
              ${renderCategoryMeter("Return", item.categories.return, "emerald")}
              ${renderCategoryMeter("Risk", item.categories.risk, "rose")}
              ${renderCategoryMeter("Liquidity", item.categories.liquidity, "sky")}
              ${renderCategoryMeter("Fees", item.categories.fees, "amber")}
              ${renderCategoryMeter("Reliability", item.categories.reliability, "violet")}
            </div>
            
            <!-- Why this score -->
            <details class="group">
              <summary class="text-sm font-medium text-brand-600 cursor-pointer hover:text-brand-700">
                Why this score?
              </summary>
              <div class="mt-3 p-4 bg-slate-50 rounded-xl text-sm text-slate-600 space-y-2">
                <p>${generateWhyScore(item, userProfile)}</p>
                ${item.whyNotFirst ? `<p class="text-amber-700 font-medium">⚠️ ${item.whyNotFirst}</p>` : ""}
                <p class="text-xs text-slate-400 pt-2 border-t border-slate-200">
                  Weights used: Return ${(item.weights.return*100).toFixed(0)}% • Risk ${(item.weights.risk*100).toFixed(0)}% • Liquidity ${(item.weights.liquidity*100).toFixed(0)}% • Fees ${(item.weights.fees*100).toFixed(0)}% • Reliability ${(item.weights.reliability*100).toFixed(0)}%
                </p>
              </div>
            </details>
            
            <!-- Key facts -->
            <div class="flex flex-wrap gap-4 mt-4 text-sm">
              <div>
                <span class="text-slate-500">Effective rate</span>
                <span class="font-semibold ml-1">${p.effectiveRate.toFixed(2)}% p.a.</span>
                ${p.rateType === "promotional" ? `<span class="text-amber-600 text-xs ml-1">(promo)</span>` : ""}
              </div>
              <div>
                <span class="text-slate-500">Liquidity</span>
                <span class="font-semibold ml-1">${p.liquidityLabel}</span>
              </div>
              <div>
                <span class="text-slate-500">Min deposit</span>
                <span class="font-semibold ml-1">RM ${p.minDeposit.toLocaleString()}</span>
              </div>
            </div>
            
            ${p.rateConditions.length > 0 ? `
              <div class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div class="text-xs font-semibold text-amber-800 mb-1">⚠️ Rate Reality Check</div>
                <div class="text-sm text-amber-900">
                  Headline: ${p.advertisedRate.toFixed(2)}% — requires ${p.rateConditions.length} condition${p.rateConditions.length > 1 ? "s" : ""}
                </div>
                <ul class="mt-2 text-xs text-amber-800 list-disc list-inside">
                  ${p.rateConditions.map(c => `<li>${c}</li>`).join("")}
                </ul>
              </div>
            ` : ""}
          </div>
          
          <!-- Actions -->
          <div class="flex lg:flex-col gap-2">
            <button onclick="viewProduct('${p.id}')" class="btn-secondary text-sm px-4 py-2">View Details</button>
            <button onclick="toggleCompare('${p.id}')" class="btn-primary text-sm px-4 py-2">
              ${selectedForCompare.includes(p.id) ? "✓ Selected" : "Compare"}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");
  
  lucide.createIcons();
}

function renderCategoryMeter(label, score, color) {
  const colors = {
    emerald: "bg-emerald-500",
    rose: "bg-rose-500",
    sky: "bg-sky-500",
    amber: "bg-amber-500",
    violet: "bg-violet-500"
  };
  return `
    <div>
      <div class="flex justify-between text-xs mb-1">
        <span class="text-slate-500">${label}</span>
        <span class="font-medium">${Math.round(score)}</span>
      </div>
      <div class="score-bar">
        <div class="score-fill ${colors[color]}" style="width:${score}%"></div>
      </div>
    </div>
  `;
}

function renderProtectionBadge(level) {
  if (level === "protected") return `<span class="badge badge-protected">Protected</span>`;
  if (level === "partial") return `<span class="badge badge-partial">Partially Protected</span>`;
  return `<span class="badge badge-risk">Market Risk</span>`;
}

function generateWhyScore(item, profile) {
  const p = item.product;
  const parts = [];
  
  if (item.categories.risk >= 85) {
    parts.push(`Strong capital protection (${p.protectionScheme}).`);
  }
  if (item.categories.liquidity >= 80) {
    parts.push(`Excellent liquidity — ${p.liquidityLabel.toLowerCase()}.`);
  }
  if (item.categories.return >= 70) {
    parts.push(`Competitive effective return of ${p.effectiveRate}% p.a.`);
  }
  if (item.categories.fees >= 80) {
    parts.push(`Low barriers — min deposit only RM ${p.minDeposit}.`);
  }
  if (p.rateType === "promotional" && p.rateConditions.length > 2) {
    parts.push(`Promotional rate has multiple conditions, which reduced the Fees score.`);
  }
  
  if (parts.length === 0) {
    return `This product offers a balanced profile across the five factors given your preferences.`;
  }
  return parts.join(" ");
}

function formatGoal(goal) {
  const map = {
    emergency: "Emergency Fund",
    house: "House Deposit",
    education: "Education",
    vacation: "Vacation",
    retirement: "Retirement",
    general: "General Savings",
    max_return: "Maximum Return"
  };
  return map[goal] || goal;
}

// ---------- Demo cards on homepage ----------
function renderDemoCards() {
  // Simulate an emergency fund ranking
  const demoProfile = {
    amount: 50000,
    duration: 12,
    goal: "emergency",
    needAccess: "anytime",
    riskPreference: "very_low",
    capitalProtectionImportant: true,
    priority: "stability"
  };
  const ranked = rankProducts(demoProfile).slice(0, 3);
  
  const container = document.getElementById("demo-cards");
  if (!container) return;
  
  container.innerHTML = ranked.map((item, idx) => {
    const p = item.product;
    const medals = ["🥇", "🥈", "🥉"];
    return `
      <div class="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 backdrop-blur">
        <div class="flex items-center justify-between mb-4">
          <span class="text-2xl">${medals[idx]}</span>
          <div class="text-right">
            <div class="text-2xl font-bold text-white">${item.score}</div>
            <div class="text-xs text-slate-400">Money Fit</div>
          </div>
        </div>
        <h3 class="font-semibold text-white mb-1">${p.name}</h3>
        <p class="text-sm text-slate-400 mb-4">${p.institution}</p>
        
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-slate-400">Effective rate</span>
            <span class="text-white font-medium">${p.effectiveRate}%</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Liquidity</span>
            <span class="text-white font-medium">${p.liquidityLabel}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Protection</span>
            <span class="text-emerald-400 font-medium">${p.capitalProtection === "protected" ? "PIDM" : "Partial"}</span>
          </div>
        </div>
        
        ${idx === 0 ? `<div class="mt-4 text-xs text-brand-300 font-medium">Best overall match for Emergency Fund</div>` : ""}
      </div>
    `;
  }).join("");
}

// ---------- Compare page ----------
function renderProductGrid() {
  let list = [...PRODUCTS];
  
  // Filters
  const type = document.getElementById("filterType")?.value || "all";
  const risk = document.getElementById("filterRisk")?.value || "all";
  const sort = document.getElementById("sortBy")?.value || "fit";
  
  if (type !== "all") list = list.filter(p => p.type === type);
  if (risk === "protected") list = list.filter(p => p.capitalProtection === "protected");
  if (risk === "low") list = list.filter(p => p.riskLevel === "very_low" || p.riskLevel === "low");
  
  // Score them with default emergency-ish weights for display
  const scored = list.map(p => {
    const result = calculateMoneyFitScore(p, DEFAULT_WEIGHTS, {});
    return { product: p, score: result.overall, categories: result.categories };
  });
  
  if (sort === "return") scored.sort((a, b) => b.product.effectiveRate - a.product.effectiveRate);
  else if (sort === "risk") scored.sort((a, b) => b.categories.risk - a.categories.risk);
  else if (sort === "liquidity") scored.sort((a, b) => b.categories.liquidity - a.categories.liquidity);
  else if (sort === "min_deposit") scored.sort((a, b) => a.product.minDeposit - b.product.minDeposit);
  else scored.sort((a, b) => b.score - a.score);
  
  document.getElementById("productCount").textContent = scored.length;
  
  const grid = document.getElementById("productGrid");
  grid.innerHTML = scored.map(item => {
    const p = item.product;
    const selected = selectedForCompare.includes(p.id);
    return `
      <div class="product-card ${selected ? 'selected' : ''}" onclick="toggleCompare('${p.id}')">
        <div class="flex justify-between items-start mb-3">
          <div>
            <h3 class="font-semibold text-slate-900 leading-tight">${p.name}</h3>
            <p class="text-xs text-slate-500 mt-0.5">${p.institution}</p>
          </div>
          <div class="text-right">
            <div class="text-xl font-bold text-slate-900">${item.score}</div>
            <div class="text-[10px] text-slate-400 uppercase tracking-wide">Fit Score</div>
          </div>
        </div>
        
        <div class="flex flex-wrap gap-1.5 mb-3">
          ${renderProtectionBadge(p.capitalProtection)}
          <span class="badge bg-slate-100 text-slate-600">${p.typeLabel}</span>
        </div>
        
        <div class="space-y-1.5 text-sm mb-4">
          <div class="flex justify-between">
            <span class="text-slate-500">Effective</span>
            <span class="font-medium">${p.effectiveRate}% p.a.</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Liquidity</span>
            <span class="font-medium">${p.liquidityLabel}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Min deposit</span>
            <span class="font-medium">RM ${p.minDeposit.toLocaleString()}</span>
          </div>
        </div>
        
        ${p.rateConditions.length > 0 ? `
          <div class="text-xs text-amber-700 bg-amber-50 rounded-lg px-2 py-1.5 mb-3">
            ⚠️ ${p.rateConditions.length} condition${p.rateConditions.length > 1 ? "s" : ""} for full rate
          </div>
        ` : ""}
        
        <div class="flex gap-2">
          <button onclick="event.stopPropagation(); viewProduct('${p.id}')" class="flex-1 text-xs font-medium py-2 rounded-lg border border-slate-200 hover:bg-slate-50">
            Details
          </button>
          <button onclick="event.stopPropagation(); toggleCompare('${p.id}')" class="flex-1 text-xs font-medium py-2 rounded-lg ${selected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
            ${selected ? "✓ Selected" : "Compare"}
          </button>
        </div>
      </div>
    `;
  }).join("");
  
  updateCompareBar();
}

function applyFilters() {
  renderProductGrid();
}

function toggleCompare(id) {
  const idx = selectedForCompare.indexOf(id);
  if (idx >= 0) {
    selectedForCompare.splice(idx, 1);
  } else {
    if (selectedForCompare.length >= 3) {
      alert("You can compare up to 3 products at a time.");
      return;
    }
    selectedForCompare.push(id);
  }
  renderProductGrid();
  updateCompareBar();
}

function updateCompareBar() {
  const bar = document.getElementById("compareBar");
  const slots = document.getElementById("compareSlots");
  const btn = document.getElementById("compareBtn");
  
  if (selectedForCompare.length === 0) {
    bar.classList.add("translate-y-full");
    return;
  }
  
  bar.classList.remove("translate-y-full");
  
  slots.innerHTML = selectedForCompare.map(id => {
    const p = PRODUCTS.find(x => x.id === id);
    return `
      <div class="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5 text-sm">
        <span class="font-medium truncate max-w-[120px]">${p.name}</span>
        <button onclick="toggleCompare('${id}')" class="text-slate-400 hover:text-slate-700">×</button>
      </div>
    `;
  }).join("");
  
  if (selectedForCompare.length >= 2) {
    btn.classList.remove("opacity-50", "pointer-events-none");
  } else {
    btn.classList.add("opacity-50", "pointer-events-none");
  }
}

function runCompare() {
  if (selectedForCompare.length < 2) return;
  // For now, just show an alert with trade-off style message
  const products = selectedForCompare.map(id => PRODUCTS.find(p => p.id === id));
  const a = products[0];
  const b = products[1];
  
  const earnA = estimateEarnings(a, 50000, 12).earnings;
  const earnB = estimateEarnings(b, 50000, 12).earnings;
  const diff = Math.abs(earnA - earnB);
  
  let msg = `Trade-Off Finder\n\n`;
  if (earnA > earnB) {
    msg += `${a.name} may earn approximately RM ${diff.toLocaleString()} more over one year, but ${b.name} offers ${b.liquidityLabel.toLowerCase()} access.\n\n`;
  } else {
    msg += `${b.name} may earn approximately RM ${diff.toLocaleString()} more over one year, but ${a.name} offers ${a.liquidityLabel.toLowerCase()} access.\n\n`;
  }
  msg += `Full side-by-side comparison table coming in next iteration.`;
  alert(msg);
}

// ---------- Product Detail ----------
function viewProduct(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  
  const scored = calculateMoneyFitScore(p, DEFAULT_WEIGHTS, {});
  
  showPage("product");
  
  document.getElementById("productDetail").innerHTML = `
    <div class="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
      <!-- Header -->
      <div class="p-6 sm:p-8 border-b border-slate-100">
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div class="text-sm text-brand-600 font-medium mb-1">${p.typeLabel}</div>
            <h1 class="text-2xl sm:text-3xl font-bold text-slate-900">${p.name}</h1>
            <p class="text-slate-500 mt-1">${p.institution}</p>
            <div class="flex flex-wrap gap-2 mt-3">
              ${p.bestFor.map(b => `<span class="badge badge-best">${b}</span>`).join("")}
              ${renderProtectionBadge(p.capitalProtection)}
            </div>
          </div>
          <div class="text-center bg-slate-50 rounded-2xl px-6 py-4">
            <div class="text-4xl font-bold text-slate-900">${scored.overall}</div>
            <div class="text-sm text-slate-500">Money Fit Score</div>
            <div class="text-xs text-slate-400 mt-1">${p.dataFreshness}</div>
          </div>
        </div>
        <p class="mt-4 text-slate-600">${p.summary}</p>
      </div>
      
      <!-- 5 Factor Scores -->
      <div class="p-6 sm:p-8 border-b border-slate-100">
        <h2 class="font-bold text-lg mb-4">Five-Factor Scorecard</h2>
        <div class="grid sm:grid-cols-5 gap-4">
          ${renderCategoryMeter("Return", scored.categories.return, "emerald")}
          ${renderCategoryMeter("Risk & Protection", scored.categories.risk, "rose")}
          ${renderCategoryMeter("Liquidity", scored.categories.liquidity, "sky")}
          ${renderCategoryMeter("Fees & Requirements", scored.categories.fees, "amber")}
          ${renderCategoryMeter("Reliability", scored.categories.reliability, "violet")}
        </div>
      </div>
      
      <!-- Details grid -->
      <div class="p-6 sm:p-8 grid sm:grid-cols-2 gap-8">
        <div>
          <h3 class="font-semibold mb-3">Return Details</h3>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between"><dt class="text-slate-500">Advertised rate</dt><dd class="font-medium">${p.advertisedRate}% p.a.</dd></div>
            <div class="flex justify-between"><dt class="text-slate-500">Effective / True rate</dt><dd class="font-medium">${p.effectiveRate}% p.a.</dd></div>
            <div class="flex justify-between"><dt class="text-slate-500">Rate type</dt><dd class="font-medium capitalize">${p.rateType}</dd></div>
          </dl>
          
          ${p.rateConditions.length > 0 ? `
            <div class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <div class="text-xs font-semibold text-amber-800 mb-1">Rate Reality Check</div>
              <ul class="text-xs text-amber-900 list-disc list-inside space-y-1">
                ${p.rateConditions.map(c => `<li>${c}</li>`).join("")}
              </ul>
            </div>
          ` : ""}
        </div>
        
        <div>
          <h3 class="font-semibold mb-3">Risk & Liquidity</h3>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between"><dt class="text-slate-500">Capital protection</dt><dd class="font-medium capitalize">${p.capitalProtection}</dd></div>
            <div class="flex justify-between"><dt class="text-slate-500">Scheme</dt><dd class="font-medium text-right max-w-[180px]">${p.protectionScheme}</dd></div>
            <div class="flex justify-between"><dt class="text-slate-500">Liquidity</dt><dd class="font-medium">${p.liquidityLabel}</dd></div>
            <div class="flex justify-between"><dt class="text-slate-500">Lock-in</dt><dd class="font-medium">${p.lockInMonths ? p.lockInMonths + " months" : "None"}</dd></div>
          </dl>
        </div>
        
        <div>
          <h3 class="font-semibold mb-3">Who this is suitable for</h3>
          <p class="text-sm text-slate-600">${p.suitableFor}</p>
        </div>
        
        <div>
          <h3 class="font-semibold mb-3">Who should avoid it</h3>
          <p class="text-sm text-slate-600">${p.avoidIf}</p>
        </div>
        
        <div class="sm:col-span-2">
          <h3 class="font-semibold mb-3">What could go wrong</h3>
          <p class="text-sm text-slate-600">${p.whatCouldGoWrong}</p>
        </div>
        
        <div class="sm:col-span-2">
          <h3 class="font-semibold mb-3">Questions you should ask</h3>
          <ul class="text-sm text-slate-600 list-disc list-inside space-y-1">
            <li>Is the rate still valid today? (Check data freshness)</li>
            <li>What happens if I miss a condition for the promotional rate?</li>
            <li>How long does withdrawal actually take in practice?</li>
            <li>Are there any upcoming changes to the terms?</li>
            <li>Is this product PIDM protected for my full amount?</li>
          </ul>
        </div>
      </div>
      
      <div class="p-6 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
        Demo data only. Not a real financial product. Always verify current terms with the institution. MoneyLens scores are decision-support tools, not advice.
      </div>
    </div>
  `;
  
  lucide.createIcons();
}

// ---------- Calculator ----------
function runSimulator() {
  const amount = parseFloat(document.getElementById("simAmount").value) || 50000;
  const months = parseInt(document.getElementById("simPeriod").value) || 12;
  
  // Take top 4 by default ranking
  const ranked = rankProducts({ goal: "general", needAccess: "anytime", riskPreference: "low" }).slice(0, 4);
  
  const results = ranked.map(item => {
    const est = estimateEarnings(item.product, amount, months);
    return { ...item, est };
  });
  
  document.getElementById("simResults").innerHTML = results.map(r => `
    <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
      <div>
        <div class="font-medium text-sm">${r.product.name}</div>
        <div class="text-xs text-slate-500">${r.est.isGuaranteed ? "Guaranteed" : "Estimated"} • ${r.product.effectiveRate}%</div>
      </div>
      <div class="text-right">
        <div class="font-bold text-emerald-600">+RM ${r.est.earnings.toLocaleString()}</div>
        <div class="text-xs text-slate-500">→ RM ${r.est.finalValue.toLocaleString()}</div>
      </div>
    </div>
  `).join("") + `
    <p class="text-xs text-slate-400 mt-3">Projections are illustrative only and not guaranteed. Variable/promotional rates may change.</p>
  `;
}

function calcFutureValue() {
  const principal = parseFloat(document.getElementById("fvPrincipal").value) || 0;
  const rate = parseFloat(document.getElementById("fvRate").value) / 100 || 0;
  const years = parseFloat(document.getElementById("fvYears").value) || 0;
  
  const fv = principal * Math.pow(1 + rate, years);
  const interest = fv - principal;
  
  document.getElementById("fvResult").classList.remove("hidden");
  document.getElementById("fvValue").textContent = "RM " + Math.round(fv).toLocaleString();
  document.getElementById("fvInterest").textContent = "Interest: RM " + Math.round(interest).toLocaleString();
}

// ---------- Learn ----------
function renderLearn() {
  const articles = [
    {
      title: "What is an Effective Interest Rate?",
      body: "The advertised rate is often a headline. The effective rate (or true return) accounts for fees, conditions and how interest is calculated. Always compare effective rates when possible."
    },
    {
      title: "PIDM Protection Explained",
      body: "PIDM (Perbadanan Insurans Deposit Malaysia) protects deposits up to RM250,000 per depositor per member bank. Fixed deposits and savings accounts at member banks are typically covered. Unit trusts and money market funds are usually not."
    },
    {
      title: "Why Promotional Rates Can Mislead",
      body: "A 5% promotional rate that requires salary credit, 8 transactions, a minimum balance and only lasts 3 months is very different from a 3.5% rate with no conditions. MoneyLens flags these conditions automatically."
    },
    {
      title: "Liquidity vs Return Trade-off",
      body: "Higher returns often require locking your money or accepting conditions. For emergency funds, liquidity should usually rank higher than a small rate difference."
    },
    {
      title: "How Money Fit Score Works",
      body: "We score five dimensions (Return, Risk, Liquidity, Fees, Reliability), apply weights based on your goal, and produce a 0–100 score. There is no universal #1 — the best product depends on your situation."
    }
  ];
  
  document.getElementById("learnArticles").innerHTML = articles.map(a => `
    <div class="bg-white rounded-xl border border-slate-100 p-5 shadow-soft">
      <h3 class="font-semibold text-slate-900 mb-2">${a.title}</h3>
      <p class="text-sm text-slate-600 leading-relaxed">${a.body}</p>
    </div>
  `).join("");
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  showPage("home");
  renderDemoCards();
  lucide.createIcons();
});
