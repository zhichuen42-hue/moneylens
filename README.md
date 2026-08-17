# MoneyLens

**Don’t Chase the Highest Rate. Find the Right Rate for You.**

MoneyLens is a modern, transparent personal finance comparison platform that ranks savings accounts, fixed deposits, money market products and digital banks using a personalised **Money Fit Score** — not just the advertised interest rate.

## Core Innovation

Instead of asking “Which product has the highest rate?”, MoneyLens asks:

> “Which product gives **this specific person** the best combination of return, risk, liquidity, cost and convenience?”

### Five Scoring Factors

| Factor | Default Weight | What it measures |
|--------|----------------|------------------|
| Return / Interest Rate | 30% | Effective rate, promotional vs guaranteed, estimated earnings |
| Risk & Capital Protection | 30% | PIDM protection, volatility, principal risk |
| Liquidity | 20% | Access speed, lock-in, early withdrawal penalties |
| Fees & Requirements | 10% | Min deposit, conditions, hidden requirements |
| Reliability & Convenience | 10% | Institution reputation, app quality, usability |

Weights dynamically adjust based on the user’s goal (Emergency Fund, House Deposit, Max Return, etc.).

## Features Implemented

- Personalisation questionnaire (7 steps)
- Money Fit Score engine with transparent breakdown
- “Why this score?” explanations
- Rate Reality Check for conditional promotional rates
- What-If Simulator
- Product comparison (select up to 3)
- Product Scorecard detail pages
- Safety vs Return thinking (via category scores)
- Explain Like I’m New / Advanced toggle foundation
- Money Personality profiles
- Learn section
- Methodology page with clear disclaimers
- Mobile-first premium fintech UI

## Demo Data

All products are **fictional** and clearly labelled as demo data. They are inspired by typical Malaysian digital banks, conventional banks and money market products for illustration only.

## How to Run

Simply open `index.html` in a modern browser.

No build step required. Uses:
- Tailwind CSS (CDN)
- Lucide Icons
- Chart.js (available for future charts)
- Vanilla JS modules

## Project Structure

```
moneylens/
├── index.html          # Main application shell
├── css/styles.css      # Design system
├── data/products.js    # Demo product database + weight configs
├── js/scoring.js       # Transparent scoring engine
├── js/app.js           # UI logic, quiz, rendering
└── README.md
```

## Disclaimer

MoneyLens scores are **decision-support tools**, not financial advice.  
Projected returns are illustrative and not guaranteed.  
Always verify current terms, rates and conditions directly with the financial institution before placing any money.

---

Built with clarity and transparency in mind.
