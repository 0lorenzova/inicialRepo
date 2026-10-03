import type { Ledger } from "./finance-ledger";
import type { EnvelopePlanning, ScheduledAmount } from "./envelope-planning";
import type { NotificationState } from "./finance-notifications";

type ResettableData = Ledger & { bank: number; notifications: NotificationState };

// Keep only the current configuration of each recurring series. Paid history
// and payment references belong to the ledger being cleared, not preferences.
function resetPlanning(items: ScheduledAmount[] = []): ScheduledAmount[] {
  const latest = new Map<string, ScheduledAmount>();
  for (const item of items) {
    const key = item.repetition?.seriesId ?? item.id;
    const previous = latest.get(key);
    if (!previous || previous.deadline <= item.deadline) latest.set(key, item);
  }
  return [...latest.values()].map(item => { const { payment: _payment, ...configuration } = item; void _payment; return configuration; });
}

export function resetFinanceData<T extends ResettableData>(current: T, initial: T, keepSettings: boolean): T {
  if (!keepSettings) return structuredClone(initial);
  const copy = structuredClone(current);
  return {
    ...copy, bank: 0, movements: [], loans: [],
    accounts: copy.accounts.map(account => ({ ...account, balance: 0 })),
    envelopes: copy.envelopes.map(envelope => ({ ...envelope, balance: 0,
      ...((envelope as EnvelopePlanning).scheduledAmounts ? { scheduledAmounts: resetPlanning((envelope as EnvelopePlanning).scheduledAmounts) } : {}),
    })),
    notifications: { ...copy.notifications, initialized: false, readIds: [], dismissedIds: [], deliveredIds: [] },
  };
}
