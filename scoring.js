/**
 * MoneyLens Scoring Engine
 * Transparent, preference-aware, never ranks purely on advertised rate.
 */

function clamp(val, min = 0, max = 100) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Score Return category (0-100)
 * Considers effective rate more than advertised, penalises purely promotional rates.
 */
function scoreReturn(product) {
  // Use effective rate as primary signal
  const rate = product.effectiveRate;
  
  // Map typical MY rates (1.5% - 5.0%) to 0-100
  // 1.5% → ~20, 2.5% → 40, 3.5% → 65, 4.0% → 80, 4.5%+ → 95
  let score = ((rate - 1.5) / 3.5) * 80 + 15;
  
  // Bonus for guaranteed rates
  if (product.rateType === "guaranteed") score += 8;
  if (product.rateType === "variable") score -= 5;
  
  // Heavy penalty for heavily conditional promotional rates
  if (product.rateType === "promotional" && product.rateConditions.length >= 3) {
    score -= 12;
  }
  
  return clamp(score);
}

/**
 * Score Risk & Capital Protection (0-100)
 * Higher = safer
 */
function scoreRisk(product) {
  let score = 50;
  
  if (product.capitalProtection === "protected") score = 95;
  else if (product.capitalProtection === "partial") score = 55;
  else score = 25;
  
  // Volatility penalty
  score -= product.volatility * 40;
  
  // Institution reliability influence
  score = score * 0.85 + (product.reliability * 0.15);
  
  return clamp(score);
}

/**
 * Score Liquidity (0-100)
 * Higher = more liquid
 */
function scoreLiquidity(product) {
  // Direct from 1-5 scale
  let score = product.liquidity * 20;
  
  if (product.earlyWithdrawalPenalty) score -= 15;
  if (product.lockInMonths > 6) score -= 10;
  if (product.lockInMonths > 12) score -= 10;
  
  return clamp(score);
}

/**
 * Score Fees & Requirements (0-100)
 * Higher = fewer fees / easier requirements
 */
function scoreFees(product) {
  let score = 90;
  
  // Min deposit penalty
  if (product.minDeposit >= 5000) score -= 25;
  else if (product.minDeposit >= 1000) score -= 12;
  else if (product.minDeposit >= 500) score -= 5;
  
  // Maintenance / management fee
  if (product.maintenanceFee > 0) score -= product.maintenanceFee * 40;
  
  // Number of rate conditions
  score -= product.rateConditions.length * 8;
  
  // Early withdrawal penalty
  if (product.earlyWithdrawalPenalty) score -= 10;
  
  return clamp(score);
}

/**
 * Score Reliability & Convenience (0-100)
 */
function scoreReliability(product) {
  let score = product.reliability * 0.6 + product.appScore * 0.4;
  
  if (product.branchAccess) score += 5;
  
  return clamp(score);
}

/**
 * Calculate full Money Fit Score for a product given weights and user context
 */
function calculateMoneyFitScore(product, weights = DEFAULT_WEIGHTS, userPrefs = {}) {
  const scores = {
    return: scoreReturn(product),
    risk: scoreRisk(product),
    liquidity: scoreLiquidity(product),
    fees: scoreFees(product),
    reliability: scoreReliability(product)
  };
  
  // Apply weights
  const total =
    scores.return * weights.return +
    scores.risk * weights.risk +
    scores.liquidity * weights.liquidity +
    scores.fees * weights.fees +
    scores.reliability * weights.reliability;
  
  // Decision confidence (how strongly it matches stated priorities)
  let confidence = 70;
  if (userPrefs.goal === "emergency" && product.liquidity >= 4 && product.capitalProtection === "protected") {
    confidence += 18;
  }
  if (userPrefs.goal === "max_return" && product.effectiveRate >= 3.6) {
    confidence += 12;
  }
  if (userPrefs.preferStability && product.capitalProtection === "protected" && product.rateType === "guaranteed") {
    confidence += 15;
  }
  
  return {
    overall: Math.round(clamp(total)),
    categories: scores,
    confidence: clamp(confidence),
    weightsUsed: { ...weights }
  };
}

/**
 * Rank all products for a given user profile
 */
function rankProducts(userProfile) {
  // Determine weights from goal + risk preference
  let weights = { ...DEFAULT_WEIGHTS };
  
  if (userProfile.goal && GOAL_WEIGHTS[userProfile.goal]) {
    weights = { ...GOAL_WEIGHTS[userProfile.goal] };
  }
  
  // Further tweak based on risk preference
  if (userProfile.riskPreference === "very_low") {
    weights.risk += 0.10;
    weights.return -= 0.05;
    weights.liquidity -= 0.05;
  } else if (userProfile.riskPreference === "higher") {
    weights.return += 0.10;
    weights.risk -= 0.08;
  }
  
  // Liquidity preference
  if (userProfile.needAccess === "anytime") {
    weights.liquidity += 0.10;
    weights.return -= 0.05;
    weights.risk -= 0.05;
  } else if (userProfile.needAccess === "locked_ok") {
    weights.return += 0.08;
    weights.liquidity -= 0.08;
  }
  
  // Normalise weights to sum to 1
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  Object.keys(weights).forEach(k => weights[k] = weights[k] / sum);
  
  // Score everything
  const ranked = PRODUCTS.map(p => {
    const result = calculateMoneyFitScore(p, weights, userProfile);
    return {
      product: p,
      score: result.overall,
      categories: result.categories,
      confidence: result.confidence,
      weights: result.weightsUsed
    };
  });
  
  // Sort by overall score descending
  ranked.sort((a, b) => b.score - a.score);
  
  // Assign "Best For" dynamically
  ranked.forEach((item, idx) => {
    item.rank = idx + 1;
    item.whyNotFirst = null;
    if (idx === 0) {
      // Find what it sacrifices
      const second = ranked[1];
      if (second && item.categories.liquidity < second.categories.liquidity - 10) {
        item.whyNotFirst = "Highest overall match, but not the most liquid option.";
      } else if (second && item.categories.return < second.categories.return - 8) {
        item.whyNotFirst = "Strongest overall fit, but not the highest return.";
      }
    }
  });
  
  return ranked;
}

/**
 * Estimate earnings for What-If simulator
 */
function estimateEarnings(product, amount, months) {
  const rate = product.effectiveRate / 100;
  const years = months / 12;
  
  // Simple compound for demo
  const finalValue = amount * Math.pow(1 + rate, years);
  const earnings = finalValue - amount;
  
  return {
    starting: amount,
    earnings: Math.round(earnings),
    finalValue: Math.round(finalValue),
    effectiveReturn: product.effectiveRate,
    isGuaranteed: product.rateType === "guaranteed",
    rateType: product.rateType
  };
}

/**
 * Money Personality classifier
 */
function getMoneyPersonality(profile) {
  if (profile.goal === "emergency" || (profile.needAccess === "anytime" && profile.riskPreference === "very_low")) {
    return {
      id: "safety_first",
      label: "Safety First",
      description: "You prioritise capital protection and instant access over maximising returns."
    };
  }
  if (profile.goal === "max_return" || profile.riskPreference === "higher") {
    return {
      id: "return_seeker",
      label: "Return Seeker",
      description: "You're comfortable trading some flexibility or conditions for higher potential yield."
    };
  }
  if (profile.needAccess === "anytime") {
    return {
      id: "flexibility_first",
      label: "Flexibility First",
      description: "Easy access to your money is non-negotiable. You prefer liquid options."
    };
  }
  if (profile.goal === "retirement" || profile.goal === "house") {
    return {
      id: "goal_focused",
      label: "Goal-Focused Saver",
      description: "Your ranking is shaped by a specific life goal with a defined timeline."
    };
  }
  return {
    id: "balanced_builder",
    label: "Balanced Builder",
    description: "You want a sensible mix of return, safety and accessibility."
  };
}
