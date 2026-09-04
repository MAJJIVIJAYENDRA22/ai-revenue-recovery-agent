export type CustomerTier = 'ENTERPRISE' | 'PRO' | 'GROWTH' | 'STARTER';
export type PaymentStatus = 'SUCCESS' | 'FAILED' | 'PENDING';
export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type CaseStatus =
  | 'RECOVERED'
  | 'RETRY'
  | 'ESCALATED'
  | 'STOPPED'
  | 'AWAITING_CUSTOMER_ACTION'
  | 'IN_PROGRESS';

export type RecommendedActionType =
  | 'REQUEST_PAYMENT_UPDATE'
  | 'SMART_RETRY'
  | 'GRACE_PERIOD_EXTEND'
  | 'DISPUTE_HOLD'
  | 'HUMAN_ESCALATION';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: CustomerTier;
  subscriptionPlan: string;
  successfulPaymentsCount: number;
  optedOut: boolean;
  disputeActive: boolean;
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  status: PaymentStatus;
  failureReason: string;
  createdAt: string;
  paidAt?: string;
  gatewayReference: string;
  paymentMethodType: 'CREDIT_CARD' | 'DEBIT_CARD' | 'UPI' | 'NETBANKING' | 'NACH';
}

export interface AIDiagnosis {
  rootCause: string;
  confidence: number;
  recommendedAction: RecommendedActionType;
  reasoning: string;
  riskScore: number;
  riskLevel: RiskLevel;
  modelUsed: string;
}

export interface RecoveryCase {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  failureReason: string;
  riskScore: number;
  riskLevel: RiskLevel;
  attempts: number;
  maxAttempts: number;
  recommendedAction: RecommendedActionType;
  status: CaseStatus;
  paymentStatus: PaymentStatus;
  daysOverdue: number;
  amountRecovered: number;
  lastUpdated: string;
  createdAt: string;
  aiDiagnosis: AIDiagnosis;
  recoveryPlan: string[];
  disputeDetected?: boolean;
  optedOut?: boolean;

  // JSON schema aliases for file storage compatibility
  invoice_id?: string;
  payment_id?: string;
  customer_id?: string;
  root_cause?: string;
  risk_score?: number;
  risk_level?: RiskLevel;
  recommended_action?: RecommendedActionType;
  attempt_count?: number;
  max_attempts?: number;
  amount_recovered?: number;
  days_overdue?: number;
  confidence?: number;
}

export interface RecoveryAction {
  id: string;
  caseId: string;
  invoiceNumber: string;
  attemptNumber: number;
  actionType: RecommendedActionType | 'VERIFY_PAYMENT' | 'MANUAL_OVERRIDE';
  status: 'PENDING' | 'EXECUTING' | 'SUCCESS' | 'FAILED';
  executedAt: string;
  completedAt?: string;
  result: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  caseId: string;
  invoiceNumber: string;
  event: string;
  aiDecision: string;
  policyDecision: string;
  action: string;
  result: string;
  amountRecovered: number;
  operator: 'AI Recovery Agent' | 'Human Operator' | 'Policy Guardrail Engine' | 'Payment Gateway Simulator';
}

export interface PolicyConfig {
  maxAutomatedAttempts: number;
  stopOnPaymentSuccess: boolean;
  escalateOnMaxAttempts: boolean;
  stopAndEscalateOnDispute: boolean;
  stopOnOptOut: boolean;
  requireUpdateForExpiredCard: boolean;
  delayForInsufficientFundsHours: number;
  blockDuplicateActions: boolean;
  maxMessagesPerDay: number;
}

export interface DashboardMetrics {
  revenueAtRisk: number;
  revenueRecovered: number;
  recoveryRate: number;
  activeRecoveryCases: number;
  escalatedCases: number;
  recoveryAttempts: number;
  totalCases: number;
  totalTransactionsProcessed: number;
  comparisonText: string;
  chartData: {
    name: string;
    value: number;
    color: string;
  }[];
  recentActivity: {
    id: string;
    invoiceNumber: string;
    message: string;
    type: 'success' | 'warning' | 'info';
    timestamp: string;
    amount?: number;
  }[];
}

export interface AnalyticsData {
  totalRevenueAtRisk?: number;
  totalRevenueRecovered?: number;
  recoveryRate?: number;
  escalationRate?: number | {
    category: string;
    rate: number;
    count: number;
  }[];
  escalationRateList?: {
    category: string;
    rate: number;
    count: number;
  }[];
  revenueBreakdown: {
    status: string;
    amount: number;
  }[];
  byFailureReason: {
    reason: string;
    recovered: number;
    atRisk: number;
    cases: number;
  }[];
  recoveryByReason?: {
    reason: string;
    recovered: number;
    atRisk: number;
    cases: number;
  }[];
  byIntervention: {
    intervention: string;
    recovered: number;
    successRate: number;
    count: number;
    amount?: number;
  }[];
  recoveryByIntervention?: {
    intervention: string;
    recovered: number;
    successRate: number;
    count: number;
    amount?: number;
  }[];
  recoveryByDay: {
    day: string;
    recovered: number;
    atRisk: number;
  }[];
  recoveredByDay?: {
    day: string;
    recovered: number;
    atRisk: number;
  }[];
  automatedVsHuman: {
    type?: string;
    recoveredAmount?: number;
    casesCount?: number;
    automated?: number;
    human?: number;
  }[] | {
    automated: number;
    human: number;
  };
  automatedVsHumanSplit?: {
    automated: number;
    human: number;
  };
}

export interface WorkflowExecutionStep {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  detail: string;
  durationMs: number;
  timestamp: string;
  data?: Record<string, any>;
}

export interface WorkflowExecutionResult {
  caseId: string;
  invoiceNumber: string;
  success: boolean;
  recoveredAmount: number;
  newStatus: CaseStatus;
  newAttempts: number;
  steps: WorkflowExecutionStep[];
  outcomeMessage: string;
  auditLogsGenerated: AuditLog[];
}
