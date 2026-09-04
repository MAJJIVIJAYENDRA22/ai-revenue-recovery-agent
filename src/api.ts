import {
  RecoveryCase,
  DashboardMetrics,
  AnalyticsData,
  AuditLog,
  PolicyConfig,
  WorkflowExecutionResult,
  Customer
} from './types.ts';

const BASE_URL = '/api';

export const api = {
  async getMetrics(): Promise<DashboardMetrics> {
    const res = await fetch(`${BASE_URL}/dashboard/metrics`);
    if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
    return res.json();
  },

  async getCases(params?: {
    status?: string;
    riskLevel?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ cases: RecoveryCase[]; total: number; metrics: DashboardMetrics }> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.riskLevel) query.append('riskLevel', params.riskLevel);
    if (params?.search) query.append('search', params.search);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    const res = await fetch(`${BASE_URL}/recovery-cases?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch recovery cases');
    return res.json();
  },

  async getCaseDetails(id: string): Promise<{
    case: RecoveryCase;
    customer?: Customer;
    auditLogs: AuditLog[];
  }> {
    const res = await fetch(`${BASE_URL}/recovery-cases/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch case ${id}`);
    return res.json();
  },

  async diagnoseWithAI(caseId: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/ai/diagnose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId }),
    });
    if (!res.ok) throw new Error('Failed to run AI diagnosis');
    return res.json();
  },

  async executeRecovery(
    caseId: string,
    simulatedOutcome?: 'SUCCESS' | 'FAILED' | 'ESCALATE'
  ): Promise<WorkflowExecutionResult> {
    const res = await fetch(`${BASE_URL}/recovery-cases/${caseId}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ simulatedOutcome }),
    });
    if (!res.ok) throw new Error('Failed to execute recovery workflow');
    return res.json();
  },

  async retryCase(caseId: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/recovery-cases/${caseId}/retry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to retry case');
    }
    return res.json();
  },

  async escalateCase(caseId: string, reason?: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/recovery-cases/${caseId}/escalate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error('Failed to escalate case');
    return res.json();
  },

  async stopCase(caseId: string, reason?: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/recovery-cases/${caseId}/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error('Failed to stop recovery');
    return res.json();
  },

  async getAuditTrail(params?: { caseId?: string; invoiceNumber?: string; limit?: number }): Promise<{
    logs: AuditLog[];
    total: number;
  }> {
    const query = new URLSearchParams();
    if (params?.caseId) query.append('caseId', params.caseId);
    if (params?.invoiceNumber) query.append('invoiceNumber', params.invoiceNumber);
    if (params?.limit) query.append('limit', params.limit.toString());

    const res = await fetch(`${BASE_URL}/audit-trail?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch audit trail');
    return res.json();
  },

  async getAnalytics(): Promise<AnalyticsData> {
    const res = await fetch(`${BASE_URL}/analytics`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  async getPolicies(): Promise<PolicyConfig> {
    const res = await fetch(`${BASE_URL}/policies`);
    if (!res.ok) throw new Error('Failed to fetch policies');
    return res.json();
  },

  async updatePolicies(policies: Partial<PolicyConfig>): Promise<any> {
    const res = await fetch(`${BASE_URL}/policies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policies),
    });
    if (!res.ok) throw new Error('Failed to update policies');
    return res.json();
  },

  async processBatch(): Promise<any> {
    const res = await fetch(`${BASE_URL}/batch/process`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to process batch');
    return res.json();
  },

  async resetDemo(): Promise<any> {
    const res = await fetch(`${BASE_URL}/reset-demo`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to reset demo');
    return res.json();
  },

  async runScenario(scenarioId: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/scenarios/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId }),
    });
    if (!res.ok) throw new Error(`Failed to run scenario ${scenarioId}`);
    return res.json();
  },

  async simulatePayment(invoiceNumber: string, outcome: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/payments/retry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceNumber, outcome }),
    });
    if (!res.ok) throw new Error('Payment simulation failed');
    return res.json();
  }
};
