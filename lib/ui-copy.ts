/** Spanish UI copy grouped by stable semantic keys for future localization. */
export const uiCopyEs = {
  navigation: {
    salaryManagement: "Gestión salarial",
    availableToAssign: "Disponible para asignar",
    loansBetweenEnvelopes: "Préstamos entre sobres",
    contributionsAndGoalsCalendar: "Calendario de aportes y metas",
  },
  money: {
    accountBalance: "Saldo en cuentas",
    activeAccountBalance: "Saldo en cuentas activas",
    assignedToEnvelopes: "Dinero asignado",
    availableToAssign: "Disponible para asignar",
    availableFromIncome: "Disponible para asignar de este ingreso",
  },
  availableFunds: {
    useForExpense: "Usar dinero disponible para asignar",
    expenseSource: (amount: string) => `Se descontarán ${amount} de la cuenta y del dinero disponible para asignar.`,
    unallocatedExpenseSource: "Se descontará de la cuenta y del dinero disponible para asignar.",
    reminderShortage: (amount: string) => `Fondos disponibles para asignar insuficientes: faltan ${amount}.`,
    partialContribution: (amount: string) => `El dinero disponible para asignar permite un aporte parcial de hasta ${amount}; el resto seguirá pendiente.`,
    noContributionFunds: "No tienes dinero disponible para asignar a este aporte.",
    contributionInstructions: "Se utilizará dinero disponible para asignar. No es un gasto y el aporte se registrará al confirmar.",
  },
  summary: {
    description: "Saldos actuales de cuentas, sobres y dinero disponible para asignar.",
  },
  unassignedIncomes: {
    totalAvailable: "Total disponible para asignar",
    remainingFromIncome: "Quedará disponible para asignar de este ingreso",
    empty: "Este ingreso ya no tiene dinero disponible para asignar. Vuelve a la lista para consultar los saldos actuales.",
    overAmount: "El monto supera el dinero disponible para asignar de este ingreso.",
    viewFunds: "Ver dinero disponible para asignar",
  },
  proximity: {
    showFilters: "Mostrar filtros por proximidad",
  },
  movementActions: {
    viewOrigin: "Ver origen",
    viewDistribution: "Ver distribución",
    viewAllMovements: "Ver todos los movimientos",
    clearSelectedMovement: "Quitar selección",
  },
  calendarActions: {
    open: "Abrir calendario",
    view: "Ver calendario",
    back: "Volver al calendario",
    reminderLink: "Calendario de aportes y metas",
    openNamed: "Abrir Calendario de aportes y metas",
  },
  salaryReceipt: {
    newPaymentReceived: "Nuevo pago recibido",
    clearNewPaymentReceived: "Limpiar importe del nuevo pago recibido",
    projection: "Proyección tras registrar el nuevo pago",
    alreadyRecordedUnassigned: "El salario ya se registró y quedó disponible para asignar. No vuelvas a ingresarlo.",
    totalAfterRegister: "Total tras registrar",
    remainingPending: "Pendiente restante",
  },
  salaryAdjustments: {
    title: "Ajustes salariales",
    noneSelected: "Ninguno seleccionado",
    selectedCount: (count: number) => `${count} ${count === 1 ? "ajuste seleccionado" : "ajustes seleccionados"}`,
    selectionSummary: (count: number, amount: string) => `Ajustes salariales · ${count} ${count === 1 ? "ajuste seleccionado" : "ajustes seleccionados"} · ${amount}`,
    emptyWeek: "No hay ajustes salariales para esta semana.",
    expectedWeekTotal: "Total de la semana (esperado)",
    expectedAmount: (amount: string) => `Esperado: ${amount}`,
    baseSalary: "Salario base",
    summaryAmount: (amount: string) => `Ajustes salariales: ${amount}`,
    receiptDetails: (base: string, adjustments: string) => `Salario base ${base} + Ajustes salariales ${adjustments}`,
    save: "Guardar ajustes salariales",
  },
} as const;

/** Maps stable internal view IDs to their user-facing Spanish names. */
export function appViewLabel(view: string) {
  switch (view) {
    case "Salarios": return uiCopyEs.navigation.salaryManagement;
    case "Sin asignar": return uiCopyEs.navigation.availableToAssign;
    case "Préstamos": return uiCopyEs.navigation.loansBetweenEnvelopes;
    case "Cronograma": return uiCopyEs.navigation.contributionsAndGoalsCalendar;
    default: return view;
  }
}

/** Maps internal destinations to concise, sentence-case action labels. */
export function appViewActionLabel(view: string) {
  switch (view) {
    case "Cronograma": return uiCopyEs.calendarActions.openNamed;
    case "Préstamos": return "Abrir Préstamos entre sobres";
    default: return `Abrir ${appViewLabel(view).toLocaleLowerCase("es")}`;
  }
}
