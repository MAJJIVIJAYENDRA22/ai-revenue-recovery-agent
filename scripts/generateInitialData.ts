import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 1. Generate 50 Customers
const customerNames = [
  'Rahul Sharma', 'Priya Rao', 'Arjun Mehta', 'Neha Singh', 'Vikram Jha',
  'Anjali Roy', 'Devendra Patel', 'Sneha Kulkarni', 'Kabir Varma', 'Pooja Hegde',
  'Rohan Gupta', 'Meera Nambiar', 'Tanmay Joshi', 'Aditi Deshmukh', 'Karthik Raman',
  'Deepika Iyer', 'Gautam Singhania', 'Sunita Reddy', 'Aman Verma', 'Divya Nair',
  'Rajesh Bhatt', 'Swati Sen', 'Manish Tiwari', 'Kavita Das', 'Siddharth Kapoor',
  'Ritu Malhotra', 'Alok Saxena', 'Shilpa Menon', 'Harsh Vardhan', 'Preeti Bajaj',
  'Nitin Chopra', 'Ananya Mukherjee', 'Varun Chawla', 'Shreya Bose', 'Tarun Mathur',
  'Rashi Jain', 'Kunal Aggarwal', 'Pallavi Ghosh', 'Nikhil Mishra', 'Bhavna Seth',
  'Sameer Goyal', 'Ishita Sengupta', 'Mohit Rawat', 'Sangeeta Pillai', 'Abhishek Kaushik',
  'Radhika Lal', 'Yash Singhal', 'Nidhi Pandey', 'Chirag Parekh', 'Lavanya Sundaram',
  'Akash Narang', 'Zoya Khan'
];

const subscriptions = ['Pro', 'Enterprise', 'Growth', 'Starter', 'Scale'];
const tiers = ['Premium', 'Enterprise', 'Standard', 'VIP', 'Growth'];

const customers = customerNames.slice(0, 50).map((name, idx) => {
  const numStr = String(idx + 1).padStart(3, '0');
  const id = `CUST${numStr}`;
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '.');
  const email = `${slug}.demo@example.com`;
  const subscription = subscriptions[idx % subscriptions.length];
  const customer_tier = tiers[idx % tiers.length];

  return {
    id,
    name,
    email,
    subscription,
    customer_tier,
    // Complementary fields for UI compatibility
    tier: customer_tier === 'Enterprise' ? 'ENTERPRISE' : customer_tier === 'Premium' ? 'PRO' : customer_tier === 'VIP' ? 'ENTERPRISE' : 'GROWTH',
    subscriptionPlan: `${subscription} Annual`,
    phone: `+91 98${String(10000000 + idx * 13579).substring(0, 8)}`,
    successfulPaymentsCount: 4 + (idx * 3) % 20,
    optedOut: idx === 7, // CUST008 opted out
    disputeActive: idx === 2 || idx === 5, // CUST003 / CUST006
    createdAt: '2025-01-15T08:00:00Z'
  };
});

// 2. Generate 50+ Payments
const failureReasons = [
  'EXPIRED_CARD',
  'INSUFFICIENT_FUNDS',
  'BANK_DECLINE',
  'GATEWAY_ERROR',
  'TEMPORARY_FAILURE',
  'CUSTOMER_DISPUTE'
];

const amounts = [
  12999, 28500, 8999, 2999, 5499, 18200, 3499, 45000, 6999, 14500,
  21000, 3999, 11500, 26000, 8200, 4999, 17500, 31000, 7200, 19999,
  2499, 9999, 15999, 32000, 6499, 13200, 27500, 4200, 18999, 5200,
  33000, 22500, 7800, 16400, 29000, 8500, 41000, 6100, 12400, 23500,
  3600, 19500, 28000, 9200, 14900, 35000, 5800, 17200, 24000, 8800,
  10500, 37000
];

const payments = customers.map((c, idx) => {
  const numStr = String(idx + 1).padStart(3, '0');
  const payId = `PAY${numStr}`;
  const invId = `INV${1000 + idx + 1}`;
  const amount = amounts[idx % amounts.length];

  // Distribution: First 4 are the 4 benchmark demo scenarios:
  // Scenario 1: idx === 0 -> FAILED, EXPIRED_CARD (will recover 12,999)
  // Scenario 2: idx === 1 -> FAILED, BANK_DECLINE, attempt 3 (repeated failure -> escalation)
  // Scenario 3: idx === 2 -> FAILED, CUSTOMER_DISPUTE (dispute interception)
  // Scenario 4: idx === 3 -> SUCCESS (already paid idempotency)
  // Then a mix of already recovered historical payments and active failure cases
  let status = 'FAILED';
  let failure_reason = failureReasons[idx % failureReasons.length];
  let attempt_count = 1;
  let days_overdue = 1 + (idx % 14);

  if (idx === 0) {
    // Scenario 1: INV1001 (or INV1042 alias)
    status = 'FAILED';
    failure_reason = 'EXPIRED_CARD';
    attempt_count = 1;
    days_overdue = 2;
  } else if (idx === 1) {
    // Scenario 2: INV1002
    status = 'FAILED';
    failure_reason = 'BANK_DECLINE';
    attempt_count = 3;
    days_overdue = 7;
  } else if (idx === 2) {
    // Scenario 3: INV1003
    status = 'FAILED';
    failure_reason = 'CUSTOMER_DISPUTE';
    attempt_count = 1;
    days_overdue = 5;
  } else if (idx === 3) {
    // Scenario 4: INV1004 - Already Paid
    status = 'SUCCESS';
    failure_reason = 'NONE';
    attempt_count = 1;
    days_overdue = 0;
  } else if (idx % 3 === 0) {
    // Some already recovered historical payments
    status = 'SUCCESS';
    failure_reason = 'TEMPORARY_FAILURE';
    attempt_count = 1;
    days_overdue = 0;
  } else {
    // Active failures
    status = 'FAILED';
    attempt_count = 1 + (idx % 2);
  }

  return {
    id: payId,
    customer_id: c.id,
    invoice_id: invId,
    amount,
    currency: 'INR',
    status,
    failure_reason,
    attempt_count,
    days_overdue,
    created_at: `2026-09-${String(Math.max(1, 4 - Math.floor(idx / 5))).padStart(2, '0')}T10:00:00`,
    // Compatibility fields
    invoiceNumber: invId,
    customerId: c.id,
    customerName: c.name,
    paidAt: status === 'SUCCESS' ? '2026-09-03T16:00:00' : undefined
  };
});

// 3. Generate Recovery Cases
// Map each failed payment (and the historical recovered ones) into recovery cases
const recoveryCases = payments.map((p, idx) => {
  const numStr = String(idx + 1).padStart(3, '0');
  const caseId = `CASE${numStr}`;
  const c = customers[idx];

  let status = 'ACTIVE';
  let recommended_action = 'SMART_RETRY';
  let root_cause = 'Temporary liquidity constraint';
  let risk_score = 75;
  let risk_level = 'MEDIUM';
  let confidence = 0.88;
  let amount_recovered = 0;

  if (idx === 0) {
    // Scenario 1: Expired Card recovery
    status = 'ACTIVE';
    recommended_action = 'REQUEST_PAYMENT_UPDATE';
    root_cause = 'Expired payment method';
    risk_score = 91;
    risk_level = 'HIGH';
    confidence = 0.94;
    amount_recovered = 0;
  } else if (idx === 1) {
    // Scenario 2: Repeated failure / Bank decline -> ESCALATED
    status = 'ESCALATED';
    recommended_action = 'HUMAN_ESCALATION';
    root_cause = 'Issuing bank security hold / Do Not Honor';
    risk_score = 94;
    risk_level = 'HIGH';
    confidence = 0.96;
    amount_recovered = 0;
  } else if (idx === 2) {
    // Scenario 3: Customer dispute -> STOPPED
    status = 'STOPPED';
    recommended_action = 'DISPUTE_HOLD';
    root_cause = 'Cardholder filed formal payment dispute with issuer';
    risk_score = 98;
    risk_level = 'HIGH';
    confidence = 0.99;
    amount_recovered = 0;
  } else if (idx === 3) {
    // Scenario 4: Already Paid -> RECOVERED
    status = 'RECOVERED';
    recommended_action = 'REQUEST_PAYMENT_UPDATE';
    root_cause = 'Expired card updated and verified';
    risk_score = 60;
    risk_level = 'LOW';
    confidence = 0.99;
    amount_recovered = p.amount;
  } else if (p.status === 'SUCCESS') {
    status = 'RECOVERED';
    recommended_action = 'SMART_RETRY';
    root_cause = 'Resolved via secondary gateway switch';
    risk_score = 55;
    risk_level = 'LOW';
    confidence = 0.95;
    amount_recovered = p.amount;
  } else {
    // Other cases
    if (p.failure_reason === 'EXPIRED_CARD') {
      recommended_action = 'REQUEST_PAYMENT_UPDATE';
      root_cause = 'Expired credit card credentials';
      risk_score = 88;
      risk_level = 'HIGH';
      confidence = 0.92;
      status = idx % 2 === 0 ? 'ACTIVE' : 'AWAITING_CUSTOMER';
    } else if (p.failure_reason === 'INSUFFICIENT_FUNDS') {
      recommended_action = 'SMART_RETRY';
      root_cause = 'Temporary balance shortfall during billing cycle';
      risk_score = 76;
      risk_level = 'MEDIUM';
      confidence = 0.89;
      status = 'RETRY';
    } else if (p.failure_reason === 'BANK_DECLINE') {
      recommended_action = p.attempt_count >= 2 ? 'HUMAN_ESCALATION' : 'SMART_RETRY';
      root_cause = 'Issuing bank risk block or daily transaction limit';
      risk_score = 92;
      risk_level = 'HIGH';
      confidence = 0.93;
      status = p.attempt_count >= 3 ? 'ESCALATED' : 'RETRY';
    } else if (p.failure_reason === 'GATEWAY_ERROR') {
      recommended_action = 'SMART_RETRY';
      root_cause = 'Transient gateway webhook timeout / network latency';
      risk_score = 62;
      risk_level = 'LOW';
      confidence = 0.97;
      status = 'RETRY';
    } else {
      recommended_action = 'SMART_RETRY';
      root_cause = 'Transient network handshake error';
      risk_score = 68;
      risk_level = 'MEDIUM';
      confidence = 0.85;
      status = 'ACTIVE';
    }
  }

  return {
    id: caseId,
    payment_id: p.id,
    customer_id: c.id,
    invoice_id: p.invoice_id,
    amount: p.amount,
    risk_score,
    risk_level,
    root_cause,
    recommended_action,
    confidence,
    status,
    attempt_count: p.attempt_count,
    max_attempts: 3,
    amount_recovered,
    // Compatibility fields for existing UI components
    invoiceNumber: p.invoice_id,
    customerId: c.id,
    customerName: c.name,
    customerEmail: c.email,
    failureReason: p.failure_reason.replace(/_/g, ' '),
    riskScore: risk_score,
    riskLevel: risk_level,
    attempts: p.attempt_count,
    maxAttempts: 3,
    recommendedAction: recommended_action,
    paymentStatus: p.status,
    daysOverdue: p.days_overdue,
    amountRecovered: amount_recovered,
    lastUpdated: '2026-09-04 10:04:21',
    createdAt: p.created_at.replace('T', ' '),
    disputeDetected: idx === 2,
    optedOut: c.optedOut,
    aiDiagnosis: {
      rootCause: root_cause,
      confidence,
      recommendedAction: recommended_action,
      reasoning: `AI diagnosed ${p.failure_reason.replace(/_/g, ' ')} with ${(confidence * 100).toFixed(0)}% confidence based on customer transaction telemetry.`,
      riskScore: risk_score,
      riskLevel: risk_level,
      modelUsed: 'gemini-2.5-flash'
    },
    recoveryPlan: [
      `Analyze gateway failure telemetry (${p.failure_reason})`,
      'Verify customer eligibility via policy guardrails',
      `Dispatch intervention (${recommended_action.replace(/_/g, ' ')})`,
      'Verify transaction settlement via payment gateway webhook',
      'Auto-stop recovery workflow and record immutable audit trail'
    ]
  };
});

// 4. Generate Recovery Actions
// Start with actions corresponding to already recovered / escalated payments
const recoveryActions: any[] = [];
let actionIdx = 1;

recoveryCases.forEach((c) => {
  if (c.status === 'RECOVERED') {
    recoveryActions.push({
      id: `ACTION${String(actionIdx++).padStart(3, '0')}`,
      case_id: c.id,
      action_type: c.recommended_action === 'REQUEST_PAYMENT_UPDATE' ? 'REQUEST_PAYMENT_UPDATE' : 'RETRY_PAYMENT',
      attempt_number: 1,
      result: 'SUCCESS',
      amount_recovered: c.amount,
      timestamp: '2026-09-03T16:05:00'
    });
  } else if (c.status === 'ESCALATED') {
    recoveryActions.push({
      id: `ACTION${String(actionIdx++).padStart(3, '0')}`,
      case_id: c.id,
      action_type: 'ESCALATE_TO_HUMAN',
      attempt_number: c.attempt_count,
      result: 'ESCALATED',
      amount_recovered: 0,
      timestamp: '2026-09-04T08:22:15'
    });
  } else if (c.status === 'STOPPED') {
    recoveryActions.push({
      id: `ACTION${String(actionIdx++).padStart(3, '0')}`,
      case_id: c.id,
      action_type: 'STOP_RECOVERY',
      attempt_number: 1,
      result: 'STOPPED',
      amount_recovered: 0,
      timestamp: '2026-09-03T18:45:00'
    });
  }
});

// 5. Generate Audit Logs
const auditLogs: any[] = [
  {
    id: 'AUDIT001',
    case_id: 'CASE001',
    event: 'PAYMENT_FAILURE_DETECTED',
    decision: 'HIGH_RISK',
    action: 'ANALYZE_ROOT_CAUSE',
    result: 'COMPLETED',
    timestamp: '2026-09-04T10:02:01'
  },
  {
    id: 'AUDIT002',
    case_id: 'CASE001',
    event: 'REVENUE_RISK_CALCULATED',
    decision: 'RISK_SCORE_91',
    action: 'POLICY_CHECK',
    result: 'APPROVED',
    timestamp: '2026-09-04T10:02:05'
  },
  {
    id: 'AUDIT003',
    case_id: 'CASE002',
    event: 'MAXIMUM_ATTEMPTS_REACHED',
    decision: 'POLICY_RULE_2_TRIGGERED',
    action: 'ESCALATE_TO_HUMAN',
    result: 'ESCALATED',
    timestamp: '2026-09-04T08:22:15'
  },
  {
    id: 'AUDIT004',
    case_id: 'CASE003',
    event: 'CUSTOMER_DISPUTE_DETECTED',
    decision: 'POLICY_RULE_3_TRIGGERED',
    action: 'STOP_RECOVERY',
    result: 'WORKFLOW_STOPPED',
    timestamp: '2026-09-03T18:45:00'
  },
  {
    id: 'AUDIT005',
    case_id: 'CASE004',
    event: 'PAYMENT_RECOVERED',
    decision: 'SETTLEMENT_VERIFIED',
    action: 'AUTO_STOP_WORKFLOW',
    result: 'COMPLETED',
    timestamp: '2026-09-03T16:30:10'
  }
];

// Add additional audit trail events for realism
recoveryCases.slice(0, 15).forEach((c, i) => {
  auditLogs.push({
    id: `AUDIT${String(i + 6).padStart(3, '0')}`,
    case_id: c.id,
    event: c.status === 'RECOVERED' ? 'PAYMENT_RECOVERED' : 'REVENUE_RISK_CALCULATED',
    decision: c.status === 'RECOVERED' ? 'SETTLEMENT_CONFIRMED' : `RISK_LEVEL_${c.risk_level}`,
    action: c.recommended_action,
    result: c.status === 'RECOVERED' ? 'SUCCESS' : 'PENDING_CUSTOMER_OR_RETRY',
    timestamp: `2026-09-04T0${Math.max(1, 9 - (i % 8))}:15:${String((i * 7) % 60).padStart(2, '0')}`
  });
});

// 6. Recovery Policies
const recoveryPolicies = {
  max_automated_attempts: 3,
  max_recovery_messages: 3,
  stop_when_payment_recovered: true,
  stop_on_customer_dispute: true,
  stop_on_customer_opt_out: true,
  escalate_after_max_attempts: true
};

// Write files to /data
fs.writeFileSync(path.join(DATA_DIR, 'customers.json'), JSON.stringify(customers, null, 2), 'utf-8');
fs.writeFileSync(path.join(DATA_DIR, 'payments.json'), JSON.stringify(payments, null, 2), 'utf-8');
fs.writeFileSync(path.join(DATA_DIR, 'recovery_cases.json'), JSON.stringify(recoveryCases, null, 2), 'utf-8');
fs.writeFileSync(path.join(DATA_DIR, 'recovery_actions.json'), JSON.stringify(recoveryActions, null, 2), 'utf-8');
fs.writeFileSync(path.join(DATA_DIR, 'audit_logs.json'), JSON.stringify(auditLogs, null, 2), 'utf-8');
fs.writeFileSync(path.join(DATA_DIR, 'recovery_policies.json'), JSON.stringify(recoveryPolicies, null, 2), 'utf-8');

// Also create defaults directory so reset-demo can always restore exact copies
const DEFAULTS_DIR = path.join(DATA_DIR, 'defaults');
if (!fs.existsSync(DEFAULTS_DIR)) {
  fs.mkdirSync(DEFAULTS_DIR, { recursive: true });
}
fs.writeFileSync(path.join(DEFAULTS_DIR, 'customers.json'), JSON.stringify(customers, null, 2), 'utf-8');
fs.writeFileSync(path.join(DEFAULTS_DIR, 'payments.json'), JSON.stringify(payments, null, 2), 'utf-8');
fs.writeFileSync(path.join(DEFAULTS_DIR, 'recovery_cases.json'), JSON.stringify(recoveryCases, null, 2), 'utf-8');
fs.writeFileSync(path.join(DEFAULTS_DIR, 'recovery_actions.json'), JSON.stringify(recoveryActions, null, 2), 'utf-8');
fs.writeFileSync(path.join(DEFAULTS_DIR, 'audit_logs.json'), JSON.stringify(auditLogs, null, 2), 'utf-8');
fs.writeFileSync(path.join(DEFAULTS_DIR, 'recovery_policies.json'), JSON.stringify(recoveryPolicies, null, 2), 'utf-8');

console.log('Successfully created all 6 JSON files in /data with 50+ customers and payments!');
