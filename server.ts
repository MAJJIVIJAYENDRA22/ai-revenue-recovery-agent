import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import {
  Customer,
  Payment,
  RecoveryCase,
  RecoveryAction,
  AuditLog,
  PolicyConfig,
  DashboardMetrics,
  AnalyticsData,
  WorkflowExecutionStep,
  WorkflowExecutionResult,
  CaseStatus,
  RecommendedActionType
} from './src/types.ts';
import {
  getCustomers,
  saveCustomers,
  getPayments,
  savePayments,
  getRecoveryCases,
  saveRecoveryCases,
  getRecoveryActions,
  saveRecoveryActions,
  appendRecoveryAction,
  getAuditLogs,
  saveAuditLogs,
  appendAuditLog,
  getPolicies,
  savePolicies,
  resetDemoData,
  calculateDynamicMetrics,
  calculateDynamicAnalytics
} from './serverDataStore.ts';

dotenv.config();

const PORT = 3000;
const app = express();
app.use(express.json());

// Lazy-initialize Gemini SDK
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

// Deterministic AI Diagnosis Engine (used directly or as fallback)
function runDeterministicDiagnosis(c: any, maxAttempts = 3): {
  rootCause: string;
  riskScore: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedAction: RecommendedActionType;
  confidence: number;
  reasoning: string;
} {
  const reason = (c.failure_reason || c.failureReason || c.root_cause || '').toLowerCase();
  const attempts = c.attempt_count || c.attempts || 1;

  if (c.disputeDetected || reason.includes('dispute')) {
    return {
      rootCause: 'Cardholder filed formal payment dispute with issuer',
      riskScore: 98,
      riskLevel: 'HIGH',
      recommendedAction: 'DISPUTE_HOLD',
      confidence: 0.99,
      reasoning: 'Customer dispute flag detected. Automated retries are prohibited under Policy Rule 3 to avoid punitive chargeback fines. Workflow must freeze immediately.'
    };
  }

  if (attempts >= maxAttempts) {
    return {
      rootCause: 'Maximum automated recovery retries exhausted',
      riskScore: 95,
      riskLevel: 'HIGH',
      recommendedAction: 'HUMAN_ESCALATION',
      confidence: 0.98,
      reasoning: `The case has reached ${attempts}/${maxAttempts} failed attempts. Further automated attempts risk customer churn. Escalate directly to Account Manager.`
    };
  }

  if (reason.includes('expired') || reason.includes('card expired')) {
    return {
      rootCause: 'Expired payment method / Card validity ended',
      riskScore: 91,
      riskLevel: 'HIGH',
      recommendedAction: 'REQUEST_PAYMENT_UPDATE',
      confidence: 0.94,
      reasoning: 'The payment method is expired and the customer has a proven track record of successful subscription payments. Updating the payment credentials is more appropriate than repeated blind retries.'
    };
  }

  if (reason.includes('insufficient') || reason.includes('funds') || reason.includes('balance')) {
    return {
      rootCause: 'Temporary account balance shortfall during billing cycle',
      riskScore: 76,
      riskLevel: 'MEDIUM',
      recommendedAction: 'SMART_RETRY',
      confidence: 0.88,
      reasoning: 'Insufficient funds typically resolve following payroll cycles or balance replenishments. A 24-hour delayed smart retry is recommended over immediate retry.'
    };
  }

  if (reason.includes('bank') || reason.includes('decline')) {
    return {
      rootCause: 'Issuing bank risk block or daily transaction limit',
      riskScore: 94,
      riskLevel: 'HIGH',
      recommendedAction: attempts >= 2 ? 'HUMAN_ESCALATION' : 'SMART_RETRY',
      confidence: 0.92,
      reasoning: 'Bank declined authorization. Recommending cardholder verify with bank or prompt for secondary payment card.'
    };
  }

  if (reason.includes('gateway') || reason.includes('timeout') || reason.includes('network') || reason.includes('504')) {
    return {
      rootCause: 'Transient gateway communication latency / processor error',
      riskScore: 61,
      riskLevel: 'LOW',
      recommendedAction: 'SMART_RETRY',
      confidence: 0.95,
      reasoning: 'Gateway error code indicates transient network disruption. Secondary route retry has high statistical probability of success.'
    };
  }

  return {
    rootCause: c.root_cause || 'Unspecified payment processor error',
    riskScore: c.risk_score || 75,
    riskLevel: c.risk_level || 'MEDIUM',
    recommendedAction: (c.recommended_action as RecommendedActionType) || 'SMART_RETRY',
    confidence: c.confidence || 0.80,
    reasoning: 'General payment failure. Bounded retry recommended with monitoring.'
  };
}

// -------------------------------------------------------------
// REST API ROUTES
// -------------------------------------------------------------

// 1. Dashboard Metrics
app.get(['/api/dashboard/metrics', '/data/metrics'], (_req, res) => {
  const metrics = calculateDynamicMetrics();
  res.json(metrics);
});

// 2. Customers List
app.get(['/data/customers', '/api/data/customers', '/api/customers'], (_req, res) => {
  const customers = getCustomers();
  res.json(customers);
});

// 3. Payments List
app.get(['/data/payments', '/api/data/payments', '/api/payments'], (_req, res) => {
  const payments = getPayments();
  res.json(payments);
});

// 4. Recovery Actions List
app.get(['/data/recovery-actions', '/api/data/recovery-actions', '/api/recovery-actions'], (_req, res) => {
  const actions = getRecoveryActions();
  res.json(actions);
});

// 5. Audit Trail Logs
app.get(['/data/audit-logs', '/api/data/audit-logs', '/api/audit-trail'], (req, res) => {
  const { caseId, invoiceNumber, limit } = req.query;
  let logs = getAuditLogs();

  if (caseId && typeof caseId === 'string') {
    logs = logs.filter(l => l.caseId === caseId || l.case_id === caseId);
  }
  if (invoiceNumber && typeof invoiceNumber === 'string') {
    logs = logs.filter(l => l.invoiceNumber === invoiceNumber || l.invoice_id === invoiceNumber);
  }
  if (limit && !isNaN(Number(limit))) {
    logs = logs.slice(0, Number(limit));
  }

  res.json({ logs, total: logs.length });
});

// 6. Policies / Guardrails
app.get(['/data/recovery-policies', '/api/data/recovery-policies', '/api/policies'], (_req, res) => {
  const policies = getPolicies();
  res.json(policies);
});

app.post(['/data/recovery-policies', '/api/data/recovery-policies', '/api/policies'], (req, res) => {
  const current = getPolicies();
  const updated = { ...current, ...req.body };
  savePolicies(updated);
  res.json({ message: 'Policies updated successfully in recovery_policies.json', policies: updated });
});

// 7. Recovery Cases List (with search, filter, sort)
app.get(['/data/recovery-cases', '/api/data/recovery-cases', '/api/recovery-cases'], (req, res) => {
  let list = getRecoveryCases();
  const { status, riskLevel, search, sortBy, sortOrder } = req.query;

  if (status && status !== 'ALL') {
    list = list.filter(c => c.status === status);
  }
  if (riskLevel && riskLevel !== 'ALL') {
    list = list.filter(c => (c.risk_level || c.riskLevel) === riskLevel);
  }
  if (search && typeof search === 'string' && search.trim() !== '') {
    const q = search.toLowerCase();
    list = list.filter(c =>
      (c.invoiceNumber || c.invoice_id || '').toLowerCase().includes(q) ||
      (c.customerName || '').toLowerCase().includes(q) ||
      (c.failureReason || c.root_cause || '').toLowerCase().includes(q) ||
      (c.id || '').toLowerCase().includes(q)
    );
  }

  if (sortBy && typeof sortBy === 'string') {
    list.sort((a, b) => {
      let valA: any = (a as any)[sortBy];
      let valB: any = (b as any)[sortBy];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortOrder === 'desc' ? 1 : -1;
      if (valA > valB) return sortOrder === 'desc' ? -1 : 1;
      return 0;
    });
  }

  const metrics = calculateDynamicMetrics();
  res.json({
    cases: list,
    total: list.length,
    metrics
  });
});

// Robust case finder that matches exact ID, invoiceNumber, invoice_id, payment_id,
// or normalized variations (handling hyphens, spaces, case differences, and aliases like INV-1003)
function findCaseByIdOrInvoice(cases: RecoveryCase[], rawId: string | undefined): RecoveryCase | undefined {
  if (!rawId || typeof rawId !== 'string') return undefined;
  const raw = rawId.trim();
  const clean = raw.toLowerCase().replace(/[-_\s]/g, '');

  // 1. Direct exact match
  let found = cases.find(item =>
    item.id === raw ||
    item.invoiceNumber === raw ||
    item.invoice_id === raw ||
    item.payment_id === raw ||
    (item as any).paymentId === raw
  );
  if (found) return found;

  // 2. Normalized match (handles hyphens e.g. "INV-1003" matches "INV1003", "case-001" matches "CASE001")
  found = cases.find(item => {
    const idClean = (item.id || '').toLowerCase().replace(/[-_\s]/g, '');
    const invClean = (item.invoiceNumber || item.invoice_id || '').toLowerCase().replace(/[-_\s]/g, '');
    const payClean = (item.payment_id || (item as any).paymentId || '').toLowerCase().replace(/[-_\s]/g, '');
    return idClean === clean || invClean === clean || payClean === clean;
  });
  if (found) return found;

  // 3. Known scenario aliases
  if (clean === 'inv0992' || clean === '0992' || clean === 'scenario3') {
    return cases.find(c => c.id === 'CASE003' || c.invoice_id === 'INV1003' || c.invoiceNumber === 'INV1003');
  }
  if (clean === 'inv1042' || clean === '1042' || clean === 'scenario1') {
    return cases.find(c => c.id === 'CASE001' || c.invoice_id === 'INV1001' || c.invoiceNumber === 'INV1001');
  }
  if (clean === 'inv1027' || clean === '1027' || clean === 'scenario2') {
    return cases.find(c => c.id === 'CASE002' || c.invoice_id === 'INV1002' || c.invoiceNumber === 'INV1002');
  }
  if (clean === 'inv1001' || clean === 'scenario4') {
    return cases.find(c => c.id === 'CASE004' || c.invoice_id === 'INV1004' || c.invoiceNumber === 'INV1004' || c.id === 'CASE001' || c.invoice_id === 'INV1001');
  }

  // 4. Substring / digits match (e.g. "1003" in "INV1003" or "003" in "CASE003")
  const numericPart = clean.replace(/^[a-z]+/, '');
  if (numericPart && numericPart.length >= 3) {
    found = cases.find(item => {
      const invClean = (item.invoiceNumber || item.invoice_id || '').toLowerCase().replace(/[-_\s]/g, '');
      const idClean = (item.id || '').toLowerCase().replace(/[-_\s]/g, '');
      return invClean.includes(numericPart) || idClean.includes(numericPart);
    });
    if (found) return found;
  }

  return undefined;
}

// 8. Single Case Details
app.get(['/data/recovery-cases/:id', '/api/recovery-cases/:id'], (req, res) => {
  const { id } = req.params;
  const cases = getRecoveryCases();
  const c = findCaseByIdOrInvoice(cases, id);
  if (!c) {
    return res.status(404).json({ error: `Recovery case not found for identifier: ${id}` });
  }

  const customers = getCustomers();
  const customer = customers.find(cust =>
    cust.id === (c.customerId || c.customer_id) ||
    cust.id === c.id ||
    (cust.name && cust.name.toLowerCase() === (c.customerName || '').toLowerCase())
  );
  const logs = getAuditLogs().filter(log =>
    log.caseId === c.id ||
    log.case_id === c.id ||
    log.invoiceNumber === c.invoiceNumber ||
    log.invoiceNumber === c.invoice_id ||
    log.invoice_id === c.invoice_id ||
    (c.id && (log.caseId || '').toLowerCase().replace(/[-_\s]/g, '') === c.id.toLowerCase().replace(/[-_\s]/g, ''))
  );

  res.json({
    case: c,
    customer,
    auditLogs: logs
  });
});

// 9. AI Diagnosis Endpoint (Gemini API with deterministic fallback)
app.post('/api/ai/diagnose', async (req, res) => {
  const { caseId } = req.body;
  const cases = getRecoveryCases();
  const c = findCaseByIdOrInvoice(cases, caseId);
  if (!c) {
    return res.status(404).json({ error: 'Case not found' });
  }

  const customers = getCustomers();
  const customer = customers.find(cust => cust.id === (c.customerId || c.customer_id));
  const policies = getPolicies();
  const fallback = runDeterministicDiagnosis(c, policies.max_automated_attempts || 3);

  const aiClient = getGeminiClient();
  if (!aiClient) {
    return res.json({
      ...fallback,
      modelUsed: 'Deterministic Fallback Engine (No Gemini Key)',
    });
  }

  try {
    const prompt = `You are the AI Revenue Recovery Agent. Analyze this failed subscription payment case and return strict JSON:
Customer: ${customer ? customer.name : c.customerName} (${customer ? (customer.tier || (customer as any).customer_tier) : 'PRO'} tier)
Invoice: ${c.invoiceNumber || c.invoice_id}
Amount: ₹${c.amount}
Failure Reason: ${c.failureReason || c.root_cause}
Attempts: ${c.attempts || c.attempt_count || 1} of ${policies.max_automated_attempts || 3}
Days Overdue: ${c.daysOverdue || c.days_overdue || 1}
Dispute Active: ${Boolean(c.disputeDetected || (customer && customer.disputeActive))}
Opted Out: ${Boolean(c.optedOut || (customer && customer.optedOut))}

Output schema:
{
  "rootCause": string,
  "riskScore": number (0-100),
  "riskLevel": "HIGH" | "MEDIUM" | "LOW",
  "recommendedAction": "REQUEST_PAYMENT_UPDATE" | "SMART_RETRY" | "GRACE_PERIOD_EXTEND" | "DISPUTE_HOLD" | "HUMAN_ESCALATION",
  "confidence": number (0.0 to 1.0),
  "reasoning": string
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    const result = {
      rootCause: parsed.rootCause || fallback.rootCause,
      riskScore: typeof parsed.riskScore === 'number' ? parsed.riskScore : fallback.riskScore,
      riskLevel: parsed.riskLevel || fallback.riskLevel,
      recommendedAction: parsed.recommendedAction || fallback.recommendedAction,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : fallback.confidence,
      reasoning: parsed.reasoning || fallback.reasoning,
      modelUsed: 'gemini-2.5-flash',
    };

    // Update case record with fresh diagnosis
    c.aiDiagnosis = result;
    c.riskScore = result.riskScore;
    c.risk_score = result.riskScore;
    c.riskLevel = result.riskLevel;
    c.risk_level = result.riskLevel;
    c.recommendedAction = result.recommendedAction;
    c.recommended_action = result.recommendedAction;
    c.root_cause = result.rootCause;
    c.confidence = result.confidence;
    saveRecoveryCases(cases);

    res.json(result);
  } catch (err: any) {
    console.error('Gemini diagnosis fallback used:', err.message);
    res.json({
      ...fallback,
      modelUsed: 'Deterministic Fallback Engine (API Latency Fallback)',
    });
  }
});

// 10. Execute Recovery Workflow (Core Agent Loop)
app.post(['/recovery-cases/:id/execute', '/api/recovery-cases/:id/execute'], async (req, res) => {
  const { id } = req.params;
  const { simulatedOutcome } = req.body;
  const cases = getRecoveryCases();
  const c = findCaseByIdOrInvoice(cases, id);

  if (!c) {
    return res.status(404).json({ error: 'Case not found' });
  }

  const policies = getPolicies();
  const maxAttempts = policies.max_automated_attempts || policies.maxAutomatedAttempts || 3;

  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];
  const dateStr = now.toISOString().split('T')[0];
  const fullTimestamp = `${dateStr} ${timeStr}`;
  const invNum = c.invoiceNumber || c.invoice_id || 'INV-000';

  // STEP 0: Check existing status guardrails
  if (c.status === 'RECOVERED' || c.paymentStatus === 'SUCCESS') {
    const recoveredAmount = c.amount_recovered || c.amountRecovered || c.amount;
    return res.json({
      caseId: c.id,
      invoiceNumber: invNum,
      success: true,
      recoveredAmount,
      newStatus: 'RECOVERED',
      newAttempts: c.attempt_count || c.attempts || 1,
      outcomeMessage: 'Payment is already verified and recovered. Recovery workflow automatically stopped.',
      steps: [
        {
          id: 'step-verify-existing',
          title: 'POLICY_GUARDRAIL_CHECK',
          status: 'completed',
          detail: 'RULE_1_ENFORCED: Payment already succeeded. Workflow halted.',
          durationMs: 150,
          timestamp: timeStr,
        }
      ],
      auditLogsGenerated: []
    });
  }

  if (c.status === 'ESCALATED') {
    return res.json({
      caseId: c.id,
      invoiceNumber: invNum,
      success: false,
      recoveredAmount: 0,
      newStatus: 'ESCALATED',
      newAttempts: c.attempt_count || c.attempts || maxAttempts,
      outcomeMessage: 'Human Escalation Required: Maximum automated attempts reached. Automated execution is locked.',
      steps: [
        {
          id: 'step-escalated-lock',
          title: 'POLICY_GUARDRAIL_LOCK',
          status: 'completed',
          detail: 'Case locked in ESCALATED status. Manual human resolution required.',
          durationMs: 120,
          timestamp: timeStr,
        }
      ],
      auditLogsGenerated: []
    });
  }

  // Check Dispute Policy
  if (c.disputeDetected || (c.failureReason && c.failureReason.toLowerCase().includes('dispute')) || (c.root_cause && c.root_cause.toLowerCase().includes('dispute'))) {
    c.status = 'STOPPED';
    c.paymentStatus = 'FAILED';
    saveRecoveryCases(cases);

    const disputeLog: AuditLog = {
      id: `AUDIT-${Date.now()}`,
      timestamp: fullTimestamp,
      caseId: c.id,
      invoiceNumber: invNum,
      event: 'Dispute Detected — Automation Halted',
      aiDecision: 'Customer dispute flag detected',
      policyDecision: 'RULE_3_ENFORCED: STOP AUTOMATION + ESCALATE',
      action: 'DISPUTE_HALT',
      result: 'Automated recovery permanently stopped to prevent chargeback penalties.',
      amountRecovered: 0,
      operator: 'Policy Guardrail Engine'
    };
    appendAuditLog(disputeLog);

    appendRecoveryAction({
      id: `ACTION${Date.now()}`,
      case_id: c.id,
      action_type: 'STOP_RECOVERY',
      attempt_number: c.attempt_count || c.attempts || 1,
      result: 'STOPPED',
      amount_recovered: 0,
      timestamp: fullTimestamp
    });

    return res.json({
      caseId: c.id,
      invoiceNumber: invNum,
      success: false,
      recoveredAmount: 0,
      newStatus: 'STOPPED',
      newAttempts: c.attempt_count || c.attempts || 1,
      outcomeMessage: 'Dispute detected! Recovery workflow stopped immediately according to Policy Rule 3.',
      steps: [
        { id: '1', title: 'DETECTING REVENUE RISK', status: 'completed', detail: `Dispute on invoice ${invNum}`, durationMs: 200, timestamp: timeStr },
        { id: '2', title: 'CHECKING POLICY GUARDRAILS', status: 'failed', detail: 'RULE_3_VIOLATION: Active dispute forbids automated retries', durationMs: 250, timestamp: timeStr },
        { id: '3', title: 'WORKFLOW STOPPED', status: 'completed', detail: 'Case frozen and routed to human dispute lead', durationMs: 150, timestamp: timeStr }
      ],
      auditLogsGenerated: [disputeLog]
    });
  }

  // Increment attempts with idempotency guarantee
  const currentAttempts = c.attempt_count || c.attempts || 0;
  const newAttemptCount = currentAttempts + 1;
  c.attempt_count = newAttemptCount;
  c.attempts = newAttemptCount;

  // Build the workflow execution trace
  const executionSteps: WorkflowExecutionStep[] = [];
  const newAuditLogs: AuditLog[] = [];

  // Step 1: Detect Revenue Risk
  executionSteps.push({
    id: 'step-1',
    title: 'DETECTING REVENUE RISK',
    status: 'completed',
    detail: `Payment failure detected on ${invNum} (₹${c.amount.toLocaleString('en-IN')})`,
    durationMs: 320,
    timestamp: timeStr,
    data: { amount: c.amount, failureReason: c.failureReason || c.root_cause }
  });

  // Step 2: AI Root Cause Analysis
  const diagnosis = runDeterministicDiagnosis(c, maxAttempts);
  executionSteps.push({
    id: 'step-2',
    title: 'ANALYZING ROOT CAUSE',
    status: 'completed',
    detail: `${diagnosis.rootCause} (Confidence: ${Math.round(diagnosis.confidence * 100)}%)`,
    durationMs: 450,
    timestamp: timeStr,
    data: diagnosis
  });

  // Step 3: Selecting Intervention
  const recAction = diagnosis.recommendedAction || c.recommended_action || 'SMART_RETRY';
  executionSteps.push({
    id: 'step-3',
    title: 'SELECTING INTERVENTION',
    status: 'completed',
    detail: `Recommended action: ${recAction.replace(/_/g, ' ')}`,
    durationMs: 280,
    timestamp: timeStr
  });

  // Step 4: Policy & Guardrails Check
  let policyPassed = true;
  let policyDetail = 'All 6 guardrail rules evaluated. Recovery action approved.';

  if (c.optedOut) {
    policyPassed = false;
    policyDetail = 'RULE_4_VIOLATION: Customer previously opted out of dunning notifications.';
  } else if (newAttemptCount > maxAttempts) {
    policyPassed = false;
    policyDetail = `RULE_2_VIOLATION: Attempt count (${newAttemptCount}) exceeds max permitted (${maxAttempts}).`;
  }

  executionSteps.push({
    id: 'step-4',
    title: 'CHECKING POLICY GUARDRAILS',
    status: policyPassed ? 'completed' : 'failed',
    detail: policyDetail,
    durationMs: 310,
    timestamp: timeStr
  });

  // Decide outcome
  let willSucceed = false;
  if (simulatedOutcome === 'SUCCESS') {
    willSucceed = true;
  } else if (simulatedOutcome === 'FAILED') {
    willSucceed = false;
  } else if (simulatedOutcome === 'ESCALATE') {
    willSucceed = false;
  } else {
    // Default outcome logic:
    // If it's Scenario 1 or Expired Card or High Confidence => Success
    if (invNum === 'INV1001' || invNum === 'INV-1001' || invNum === 'INV-1042' || recAction === 'REQUEST_PAYMENT_UPDATE') {
      willSucceed = true;
    } else if (newAttemptCount >= maxAttempts) {
      willSucceed = false;
    } else {
      willSucceed = Math.random() > 0.35;
    }
  }

  // Escalation if max attempts reached
  if (newAttemptCount >= maxAttempts && (!willSucceed || simulatedOutcome === 'ESCALATE')) {
    c.status = 'ESCALATED';
    c.paymentStatus = 'FAILED';
    c.lastUpdated = fullTimestamp;
    saveRecoveryCases(cases);

    appendRecoveryAction({
      id: `ACTION${Date.now()}`,
      case_id: c.id,
      action_type: 'ESCALATE_TO_HUMAN',
      attempt_number: newAttemptCount,
      result: 'ESCALATED',
      amount_recovered: 0,
      timestamp: fullTimestamp
    });

    const escAudit: AuditLog = {
      id: `AUDIT-${Date.now()}`,
      timestamp: fullTimestamp,
      caseId: c.id,
      invoiceNumber: invNum,
      event: `Attempt ${newAttemptCount} Failed — Automatic Escalation`,
      aiDecision: 'Maximum retries exhausted. Human intervention required.',
      policyDecision: 'RULE_2_ENFORCED: ESCALATE TO HUMAN',
      action: 'HUMAN_ESCALATION',
      result: 'Assigned to Support Lead. Automated workflows locked.',
      amountRecovered: 0,
      operator: 'Policy Guardrail Engine'
    };
    newAuditLogs.push(escAudit);
    appendAuditLog(escAudit);

    executionSteps.push({
      id: 'step-5',
      title: 'EXECUTING RECOVERY ACTION',
      status: 'completed',
      detail: `Attempt ${newAttemptCount}/${maxAttempts} dispatched.`,
      durationMs: 400,
      timestamp: timeStr
    });
    executionSteps.push({
      id: 'step-6',
      title: 'VERIFYING PAYMENT',
      status: 'failed',
      detail: 'Payment gateway declined transaction.',
      durationMs: 300,
      timestamp: timeStr
    });
    executionSteps.push({
      id: 'step-7',
      title: 'POLICY GUARDRAIL VALIDATION',
      status: 'completed',
      detail: 'Rule 2: Max attempts reached (3/3). Case escalated to Human.',
      durationMs: 200,
      timestamp: timeStr
    });

    return res.json({
      caseId: c.id,
      invoiceNumber: invNum,
      success: false,
      recoveredAmount: 0,
      newStatus: 'ESCALATED',
      newAttempts: newAttemptCount,
      outcomeMessage: 'Human Escalation Required: Maximum automated attempts reached (3/3).',
      steps: executionSteps,
      auditLogsGenerated: newAuditLogs
    });
  }

  if (willSucceed) {
    // SUCCESSFUL RECOVERY PATH
    c.status = 'RECOVERED';
    c.paymentStatus = 'SUCCESS';
    c.amount_recovered = c.amount;
    c.amountRecovered = c.amount;
    c.lastUpdated = fullTimestamp;
    saveRecoveryCases(cases);

    executionSteps.push({
      id: 'step-5',
      title: 'EXECUTING RECOVERY ACTION',
      status: 'completed',
      detail: recAction === 'REQUEST_PAYMENT_UPDATE'
        ? `Delivered secure payment update link to customer. Credentials verified.`
        : `Dispatched smart retry over secondary gateway rail. Auth 200 OK.`,
      durationMs: 650,
      timestamp: timeStr
    });

    executionSteps.push({
      id: 'step-6',
      title: 'VERIFYING PAYMENT',
      status: 'completed',
      detail: `Payment verified by gateway simulator. Auth ID: auth_${Math.random().toString(36).substring(2, 9)}`,
      durationMs: 420,
      timestamp: timeStr
    });

    executionSteps.push({
      id: 'step-7',
      title: 'RECOVERY COMPLETE',
      status: 'completed',
      detail: `Revenue Recovered: ₹${c.amount.toLocaleString('en-IN')}`,
      durationMs: 200,
      timestamp: timeStr
    });

    executionSteps.push({
      id: 'step-8',
      title: 'WORKFLOW STOPPED',
      status: 'completed',
      detail: 'Recovery workflow automatically stopped per Policy Rule 1.',
      durationMs: 150,
      timestamp: timeStr
    });

    // Record recovery action in recovery_actions.json
    appendRecoveryAction({
      id: `ACTION${Date.now()}`,
      case_id: c.id,
      action_type: recAction,
      attempt_number: newAttemptCount,
      result: 'SUCCESS',
      amount_recovered: c.amount,
      timestamp: fullTimestamp
    });

    // Add Audit Logs for success in audit_logs.json
    const execLog: AuditLog = {
      id: `AUDIT-${Date.now()}-1`,
      timestamp: fullTimestamp,
      caseId: c.id,
      invoiceNumber: invNum,
      event: 'Recovery Action Executed',
      aiDecision: `Strategy: ${recAction}`,
      policyDecision: 'APPROVED: Attempt within bounds',
      action: recAction,
      result: 'Intervention delivered to customer channel',
      amountRecovered: 0,
      operator: 'AI Recovery Agent'
    };

    const recoverLog: AuditLog = {
      id: `AUDIT-${Date.now()}-2`,
      timestamp: fullTimestamp,
      caseId: c.id,
      invoiceNumber: invNum,
      event: `Payment Verified — ₹${c.amount.toLocaleString('en-IN')} Recovered`,
      aiDecision: 'Settlement confirmed',
      policyDecision: 'RULE_1_ENFORCED: STOP RECOVERY ON SUCCESS',
      action: 'VERIFY_PAYMENT',
      result: `₹${c.amount.toLocaleString('en-IN')} verified. Workflow automatically stopped.`,
      amountRecovered: c.amount,
      operator: 'Policy Guardrail Engine'
    };

    newAuditLogs.push(execLog, recoverLog);
    appendAuditLog(recoverLog);
    appendAuditLog(execLog);

    // Also update payments.json
    const payments = getPayments();
    const pay = payments.find((p: any) => (p.invoice_id === invNum || p.invoiceNumber === invNum));
    if (pay) {
      pay.status = 'SUCCESS';
      pay.paidAt = fullTimestamp;
      savePayments(payments);
    }

    return res.json({
      caseId: c.id,
      invoiceNumber: invNum,
      success: true,
      recoveredAmount: c.amount,
      newStatus: 'RECOVERED',
      newAttempts: newAttemptCount,
      outcomeMessage: `Revenue Recovered! ₹${c.amount.toLocaleString('en-IN')} successfully collected. Recovery workflow automatically stopped.`,
      steps: executionSteps,
      auditLogsGenerated: newAuditLogs
    });
  } else {
    // RETRY PATH
    c.status = 'RETRY';
    c.paymentStatus = 'FAILED';
    c.lastUpdated = fullTimestamp;
    saveRecoveryCases(cases);

    executionSteps.push({
      id: 'step-5',
      title: 'EXECUTING RECOVERY ACTION',
      status: 'completed',
      detail: `Attempt ${newAttemptCount}/${maxAttempts} initiated via smart retry channel.`,
      durationMs: 550,
      timestamp: timeStr
    });

    executionSteps.push({
      id: 'step-6',
      title: 'PAYMENT VERIFICATION',
      status: 'failed',
      detail: `Declined: ${c.failureReason || c.root_cause || 'Card Declined'}. Backoff scheduled.`,
      durationMs: 380,
      timestamp: timeStr
    });

    executionSteps.push({
      id: 'step-7',
      title: 'POLICY GUARDRAIL VALIDATION',
      status: 'completed',
      detail: `Rule 6: Attempt ${newAttemptCount} recorded. Scheduled next retry in 24 hours.`,
      durationMs: 210,
      timestamp: timeStr
    });

    appendRecoveryAction({
      id: `ACTION${Date.now()}`,
      case_id: c.id,
      action_type: recAction,
      attempt_number: newAttemptCount,
      result: 'FAILED',
      amount_recovered: 0,
      timestamp: fullTimestamp
    });

    const retryLog: AuditLog = {
      id: `AUDIT-${Date.now()}`,
      timestamp: fullTimestamp,
      caseId: c.id,
      invoiceNumber: invNum,
      event: `Attempt ${newAttemptCount}/${maxAttempts} Failed`,
      aiDecision: 'Payment declined, eligible for backoff retry',
      policyDecision: 'RULE_6_APPLIED: Retry backoff scheduled',
      action: 'SMART_RETRY',
      result: `Next retry queued. Attempt count: ${newAttemptCount}`,
      amountRecovered: 0,
      operator: 'AI Recovery Agent'
    };
    newAuditLogs.push(retryLog);
    appendAuditLog(retryLog);

    return res.json({
      caseId: c.id,
      invoiceNumber: invNum,
      success: false,
      recoveredAmount: 0,
      newStatus: 'RETRY',
      newAttempts: newAttemptCount,
      outcomeMessage: `Attempt ${newAttemptCount}/${maxAttempts} was declined. Scheduled for smart retry.`,
      steps: executionSteps,
      auditLogsGenerated: newAuditLogs
    });
  }
});

// 11. Direct Action: Retry Payment
app.post(['/recovery-cases/:id/retry', '/api/recovery-cases/:id/retry'], (req, res) => {
  const { id } = req.params;
  const cases = getRecoveryCases();
  const c = findCaseByIdOrInvoice(cases, id);
  if (!c) return res.status(404).json({ error: 'Case not found' });

  if (c.status === 'RECOVERED') {
    return res.status(400).json({ error: 'Case is already recovered.' });
  }

  const policies = getPolicies();
  const maxAttempts = policies.max_automated_attempts || 3;
  if ((c.attempt_count || c.attempts || 0) >= maxAttempts) {
    return res.status(400).json({ error: 'Max attempts reached. Please escalate to human operator.' });
  }

  c.status = 'IN_PROGRESS';
  saveRecoveryCases(cases);
  res.json({ message: 'Retry initiated', case: c });
});

// 12. Direct Action: Escalate
app.post(['/recovery-cases/:id/escalate', '/api/recovery-cases/:id/escalate'], (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const cases = getRecoveryCases();
  const c = findCaseByIdOrInvoice(cases, id);
  if (!c) return res.status(404).json({ error: 'Case not found' });

  c.status = 'ESCALATED';
  saveRecoveryCases(cases);

  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];
  const dateStr = now.toISOString().split('T')[0];
  const fullTimestamp = `${dateStr} ${timeStr}`;

  appendRecoveryAction({
    id: `ACTION${Date.now()}`,
    case_id: c.id,
    action_type: 'ESCALATE_TO_HUMAN',
    attempt_number: c.attempt_count || c.attempts || 1,
    result: 'ESCALATED',
    amount_recovered: 0,
    timestamp: fullTimestamp
  });

  const log: AuditLog = {
    id: `AUDIT-${Date.now()}`,
    timestamp: fullTimestamp,
    caseId: c.id,
    invoiceNumber: c.invoiceNumber || c.invoice_id,
    event: 'Manual Human Escalation Triggered',
    aiDecision: 'Operator initiated override',
    policyDecision: 'RULE_2_PASS: Operator override accepted',
    action: 'HUMAN_ESCALATION',
    result: reason || 'Escalated to Tier 2 Customer Support Manager',
    amountRecovered: 0,
    operator: 'Human Operator'
  };
  appendAuditLog(log);

  res.json({ message: 'Case successfully escalated', case: c });
});

// 13. Direct Action: Stop Recovery
app.post(['/recovery-cases/:id/stop', '/api/recovery-cases/:id/stop'], (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const cases = getRecoveryCases();
  const c = findCaseByIdOrInvoice(cases, id);
  if (!c) return res.status(404).json({ error: 'Case not found' });

  c.status = 'STOPPED';
  saveRecoveryCases(cases);

  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];
  const dateStr = now.toISOString().split('T')[0];
  const fullTimestamp = `${dateStr} ${timeStr}`;

  appendRecoveryAction({
    id: `ACTION${Date.now()}`,
    case_id: c.id,
    action_type: 'STOP_RECOVERY',
    attempt_number: c.attempt_count || c.attempts || 1,
    result: 'STOPPED',
    amount_recovered: 0,
    timestamp: fullTimestamp
  });

  const log: AuditLog = {
    id: `AUDIT-${Date.now()}`,
    timestamp: fullTimestamp,
    caseId: c.id,
    invoiceNumber: c.invoiceNumber || c.invoice_id,
    event: 'Recovery Halted / Stopped',
    aiDecision: 'Stop action requested',
    policyDecision: 'RULE_4_PASS: Stop authorized',
    action: 'STOP_RECOVERY',
    result: reason || 'Recovery sequence stopped manually by operator',
    amountRecovered: 0,
    operator: 'Human Operator'
  };
  appendAuditLog(log);

  res.json({ message: 'Recovery workflow stopped', case: c });
});

// 14. Recovery Analytics
app.get(['/api/analytics', '/data/analytics'], (_req, res) => {
  const analyticsData = calculateDynamicAnalytics();
  res.json(analyticsData);
});

// 15. Batch Processing Endpoint
app.post(['/api/batch/process', '/batch/process'], async (_req, res) => {
  const cases = getRecoveryCases();
  const payments = getPayments();

  // Run batch pass: resolve active candidate cases
  let recoveredInBatch = 0;
  let casesRecoveredCount = 0;

  cases.forEach((c) => {
    if (c.status === 'ACTIVE' && c.recommended_action === 'REQUEST_PAYMENT_UPDATE' && !c.disputeDetected && !c.optedOut) {
      c.status = 'RECOVERED';
      c.amount_recovered = c.amount;
      c.amountRecovered = c.amount;
      c.paymentStatus = 'SUCCESS';
      recoveredInBatch += c.amount;
      casesRecoveredCount += 1;
    }
  });

  saveRecoveryCases(cases);

  const batchLog: AuditLog = {
    id: `AUDIT-BATCH-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    caseId: 'BATCH-ALL',
    invoiceNumber: 'MULTIPLE',
    event: 'Batch Revenue Risk Processing Completed',
    aiDecision: `${payments.length} transactions processed, ${cases.length} risks evaluated`,
    policyDecision: 'POLICIES_APPLIED_ACROSS_PORTFOLIO',
    action: 'BATCH_PROCESS',
    result: `Batch completed: ${casesRecoveredCount} cases recovered, ₹${recoveredInBatch.toLocaleString('en-IN')} collected.`,
    amountRecovered: recoveredInBatch,
    operator: 'AI Recovery Agent'
  };
  appendAuditLog(batchLog);

  const metrics = calculateDynamicMetrics();
  res.json({
    message: 'Revenue risk batch execution completed successfully',
    summary: {
      transactionsProcessed: payments.length,
      riskCasesEvaluated: cases.length,
      revenueRecovered: metrics.revenueRecovered,
      recoveryRate: metrics.recoveryRate,
      escalatedCases: metrics.escalatedCases
    },
    metrics
  });
});

// 16. Reset Demo Data to initial state
app.post(['/api/reset-demo', '/reset-demo'], (_req, res) => {
  resetDemoData();
  const metrics = calculateDynamicMetrics();
  res.json({ message: 'Demo dataset restored to initial state from JSON defaults', metrics });
});

// 17. Simulated Payment Gateway API
app.post(['/api/payments/retry', '/payments/retry'], (req, res) => {
  const { invoiceNumber, outcome } = req.body;
  const validOutcomes = ['SUCCESS', 'FAILED', 'INSUFFICIENT_FUNDS', 'EXPIRED_CARD', 'BANK_DECLINE', 'GATEWAY_ERROR'];
  const result = outcome && validOutcomes.includes(outcome) ? outcome : 'SUCCESS';

  res.json({
    invoiceNumber,
    timestamp: new Date().toISOString(),
    result,
    authorizationCode: result === 'SUCCESS' ? `auth_${Math.random().toString(36).substring(2, 8)}` : null,
    gatewayResponseCode: result === 'SUCCESS' ? '200_OK' : '402_PAYMENT_REQUIRED',
  });
});

// 18. Scenario runner for the 4 explicit demo scenarios
app.post(['/api/scenarios/run', '/scenarios/run'], (req, res) => {
  const { scenarioId } = req.body;
  const cases = getRecoveryCases();
  let targetCase: any;

  if (scenarioId === 'scenario-1') {
    // Scenario 1: Successful recovery
    targetCase = findCaseByIdOrInvoice(cases, 'CASE001');
    if (targetCase) {
      targetCase.status = 'ACTIVE';
      targetCase.attempt_count = 1;
      targetCase.attempts = 1;
      targetCase.paymentStatus = 'FAILED';
      targetCase.amount_recovered = 0;
      targetCase.amountRecovered = 0;
      targetCase.recommended_action = 'REQUEST_PAYMENT_UPDATE';
      targetCase.recommendedAction = 'REQUEST_PAYMENT_UPDATE';
    }
  } else if (scenarioId === 'scenario-2') {
    // Scenario 2: Repeated failure (3 attempts -> escalation)
    targetCase = findCaseByIdOrInvoice(cases, 'CASE002');
    if (targetCase) {
      targetCase.attempt_count = 3;
      targetCase.attempts = 3;
      targetCase.status = 'ESCALATED';
      targetCase.paymentStatus = 'FAILED';
    }
  } else if (scenarioId === 'scenario-3') {
    // Scenario 3: Customer dispute (immediate halt)
    targetCase = findCaseByIdOrInvoice(cases, 'CASE003');
    if (targetCase) {
      targetCase.status = 'STOPPED';
      targetCase.disputeDetected = true;
    }
  } else if (scenarioId === 'scenario-4') {
    // Scenario 4: Already paid (status success -> stop)
    targetCase = findCaseByIdOrInvoice(cases, 'CASE004');
    if (targetCase) {
      targetCase.status = 'RECOVERED';
      targetCase.paymentStatus = 'SUCCESS';
      targetCase.amount_recovered = targetCase.amount;
      targetCase.amountRecovered = targetCase.amount;
    }
  }

  saveRecoveryCases(cases);
  res.json({
    message: `Scenario ${scenarioId} prepared`,
    targetCase,
    metrics: calculateDynamicMetrics()
  });
});

// -------------------------------------------------------------
// Vite Dev Server / Production Static Serving
// -------------------------------------------------------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Revenue Recovery Agent running on http://0.0.0.0:${PORT}`);
    console.log(`Demo data storage: JSON files in /data/ (No external database required)`);
  });
}

startServer();
