# AI Revenue Recovery Agent

An autonomous AI agent platform designed for **Track 03 – AI Revenue Recovery**. The system detects revenue at risk, diagnoses root causes, executes bounded recovery workflows, verifies payment settlements, and enforces deterministic policy guardrails.

---

## 🚀 Key Features

- **Revenue Risk Detection**: Continuous evaluation of failed subscription payments, expired cards, insufficient funds, and network timeouts.
- **AI Root Cause Diagnosis**: Powered by Google Gemini 2.5 Flash (with automatic deterministic fallback engine).
- **Bounded Recovery Execution**: Bounded retry workflows, secure payment update link generation, and automated settlement verification.
- **Strict Policy Guardrails**: Enforces 8 immutable business rules (e.g. stop on payment success, stop immediately on dispute, max 3 attempts before human escalation).
- **Real-Time Audit Trail**: Comprehensive ledger of every AI decision, policy check, and gateway event.
- **Dynamic Analytics**: Live cohort analysis, recovery rates, and root cause distributions computed directly from data files.

---

## 📁 Demo Data Storage (Zero Database Architecture)

To ensure zero setup friction, instant portability, and easy inspection on GitHub, **all demo data is stored exclusively in local JSON files**.

> **Important**: This application requires **NO external database** (no SQLite, PostgreSQL, MongoDB, Firebase, or Supabase).

### Directory Structure

```
/data
  ├── customers.json          # 50+ synthetic customer profiles (Tier, Contact, History)
  ├── payments.json           # 50+ payment transaction records with gateway status
  ├── recovery_cases.json     # Revenue risk cases with status, attempts, and root causes
  ├── recovery_actions.json   # Ledger of executed recovery actions and interventions
  ├── audit_logs.json         # Timestamped chronological audit trail of all operations
  └── recovery_policies.json  # Active guardrail rules, attempt thresholds, and cooling periods
```

### JSON Files Description

1. **`customers.json`**: 50+ synthetic customers with enterprise, pro, and growth subscription tiers.
2. **`payments.json`**: 50+ payment transactions with invoice IDs, amounts in INR (₹), currency, payment method, failure reasons, and timestamps.
3. **`recovery_cases.json`**: Detailed recovery cases linking payments to customers, tracking automated attempts, risk levels, and current statuses.
4. **`recovery_actions.json`**: Action history documenting each intervention dispatched (`REQUEST_PAYMENT_UPDATE`, `SMART_RETRY`, `ESCALATE_TO_HUMAN`, `STOP_RECOVERY`).
5. **`audit_logs.json`**: Immutable audit records capturing event descriptions, AI reasoning, policy determinations, and amounts recovered.
6. **`recovery_policies.json`**: Configurable system rules including `max_automated_attempts`, `cooling_period_hours`, `dispute_halt_required`, and `idempotency_check`.

---

## 🔄 Dynamic Metrics Calculation

All dashboard KPIs and metrics are **dynamically computed** from the JSON files on each request:
- **Revenue at Risk**: Sum of amounts from failed/active recovery cases.
- **Revenue Recovered**: Sum of recovered amounts from cases with status `RECOVERED`.
- **Recovery Rate**: `(Revenue Recovered / Total Revenue at Risk) * 100%`.
- **Active Cases & Escalations**: Calculated dynamically from current statuses in `recovery_cases.json`.

---

## 🔁 Demo Data Reset

The platform includes a 1-click **Reset Demo Data** action with confirmation:
- Restores all 6 JSON files in `/data/` to their original synthetic dataset.
- Clears temporary recovery action history and resets attempts.
- Recalculates all dashboard metrics dynamically.

---

## 🧪 Interactive Demo Scenarios

Four pre-configured deterministic scenarios demonstrate end-to-end recovery loops:

1. **Scenario 1: Successful Recovery (`INV1001`)**
   - Expired card diagnosed → AI issues secure update link → Customer updates credentials → ₹12,999 recovered → Auto-stop enforced.
2. **Scenario 2: Repeated Failure / Human Escalation (`INV1002`)**
   - Attempt 1-3 fail → Max attempts exceeded → Policy Rule 2 triggers → Automated retries locked → Routed to tier-2 human operator.
3. **Scenario 3: Customer Dispute Interception (`INV1003`)**
   - Cardholder dispute detected → Policy Rule 3 halts dunning immediately → Prevents chargeback penalties.
4. **Scenario 4: Idempotency / Already Paid (`INV1004`)**
   - Payment already confirmed → Policy Rule 1 halts dunning → Prevents duplicate billing.

---

## 🔌 API Endpoints

### File-Based Data Endpoints
- `GET /data/customers` – Retrieve synthetic customers
- `GET /data/payments` – Retrieve synthetic payments
- `GET /data/recovery-cases` – Retrieve recovery cases with filters
- `GET /data/recovery-actions` – Retrieve executed recovery actions
- `GET /data/audit-logs` – Retrieve audit logs
- `GET /data/recovery-policies` – Retrieve active policy guardrails
- `POST /data/recovery-policies` – Update guardrail settings

### Recovery Action Endpoints
- `POST /recovery-cases/:id/execute` – Execute AI diagnosis, policy validation, and recovery action
- `POST /recovery-cases/:id/retry` – Trigger smart payment retry
- `POST /recovery-cases/:id/escalate` – Manual human escalation
- `POST /recovery-cases/:id/stop` – Halt recovery workflow
- `POST /api/reset-demo` – Restore demo dataset from initial state
- `POST /api/payments/retry` – Banking gateway simulator

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts
- **Backend**: Node.js, Express, TypeScript (`server.ts`)
- **Persistence**: Local JSON Filesystem (`/data/*.json`)
- **AI Engine**: Google Gemini API (`gemini-2.5-flash`) with deterministic rule-based fallback

---

## ⚠️ Demo Disclaimer

All customer names, emails, phone numbers, invoice references, and financial amounts shown in this application are completely **fictional and synthetic**. No real personal data or payment credentials are used or stored.
