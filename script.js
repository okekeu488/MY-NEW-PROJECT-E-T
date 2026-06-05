/* ======================================================
   Expense Tracker — JavaScript Logic
   ====================================================== */

(function () {
  'use strict';

  // ---- DOM Elements ----
  const form        = document.getElementById('expense-form');
  const nameInput   = document.getElementById('expense-name');
  const amountInput = document.getElementById('expense-amount');
  const listEl      = document.getElementById('expense-list');
  const emptyState  = document.getElementById('empty-state');
  const totalValue  = document.getElementById('total-value');
  const totalCount  = document.getElementById('total-count');
  const btnClear    = document.getElementById('btn-clear');

  // ---- State ----
  let expenses = loadExpenses();

  // ---- Initialise ----
  renderAll();

  // ---- Events ----
  form.addEventListener('submit', handleAdd);
  btnClear.addEventListener('click', handleClearAll);

  // ======== Handlers ========

  function handleAdd(e) {
    e.preventDefault();

    const name   = nameInput.value.trim();
    const amount = parseFloat(amountInput.value);

    // Validate
    if (!name) {
      shakeElement(nameInput);
      nameInput.focus();
      return;
    }
    if (!amount || amount <= 0) {
      shakeElement(amountInput);
      amountInput.focus();
      return;
    }

    const expense = {
      id: generateId(),
      name,
      amount,
      time: new Date().toISOString(),
    };

    expenses.unshift(expense); // newest first
    saveExpenses();

    // Render new item at top
    const li = createListItem(expense);
    if (listEl.firstChild) {
      listEl.insertBefore(li, listEl.firstChild);
    } else {
      listEl.appendChild(li);
    }

    updateSummary();
    toggleEmptyState();

    // Reset form
    nameInput.value = '';
    amountInput.value = '';
    nameInput.focus();

    showToast('Expense added!', 'success');
  }

  function handleDelete(id) {
    const li = document.querySelector(`[data-id="${id}"]`);
    if (!li) return;

    li.classList.add('removing');
    li.addEventListener('animationend', () => {
      expenses = expenses.filter(exp => exp.id !== id);
      saveExpenses();
      li.remove();
      updateSummary();
      toggleEmptyState();
    });

    showToast('Expense removed', 'danger');
  }

  function handleClearAll() {
    if (expenses.length === 0) return;

    const items = listEl.querySelectorAll('.expense-item');
    items.forEach((li, i) => {
      li.style.animationDelay = `${i * 0.05}s`;
      li.classList.add('removing');
    });

    setTimeout(() => {
      expenses = [];
      saveExpenses();
      listEl.innerHTML = '';
      updateSummary();
      toggleEmptyState();
      showToast('All expenses cleared', 'danger');
    }, items.length * 50 + 300);
  }

  // ======== Rendering ========

  function renderAll() {
    listEl.innerHTML = '';
    expenses.forEach((expense, i) => {
      const li = createListItem(expense);
      li.style.animationDelay = `${i * 0.04}s`;
      listEl.appendChild(li);
    });
    updateSummary();
    toggleEmptyState();
  }

  function createListItem(expense) {
    const li = document.createElement('li');
    li.className = 'expense-item';
    li.dataset.id = expense.id;

    li.innerHTML = `
      <div class="expense-info">
        <span class="expense-name" title="${escapeHtml(expense.name)}">${escapeHtml(expense.name)}</span>
        <span class="expense-time">${formatTime(expense.time)}</span>
      </div>
      <div class="expense-right">
        <span class="expense-amount">${formatCurrency(expense.amount)}</span>
        <button class="btn-delete" title="Remove expense" aria-label="Remove ${escapeHtml(expense.name)}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6l-1.5 14a2 2 0 0 1-2 1.76H8.5a2 2 0 0 1-2-1.76L5 6"></path>
            <path d="M10 11v6"></path>
            <path d="M14 11v6"></path>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
          </svg>
        </button>
      </div>
    `;

    li.querySelector('.btn-delete').addEventListener('click', () => handleDelete(expense.id));

    return li;
  }

  function updateSummary() {
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    totalValue.textContent = formatCurrency(total);
    totalCount.textContent = `${expenses.length} expense${expenses.length !== 1 ? 's' : ''} recorded`;

    // Bump animation
    totalValue.classList.remove('bump');
    void totalValue.offsetWidth; // force reflow
    totalValue.classList.add('bump');
  }

  function toggleEmptyState() {
    if (expenses.length === 0) {
      emptyState.classList.remove('hidden');
      btnClear.style.display = 'none';
    } else {
      emptyState.classList.add('hidden');
      btnClear.style.display = '';
    }
  }

  // ======== Persistence ========

  function saveExpenses() {
    try {
      localStorage.setItem('et_expenses', JSON.stringify(expenses));
    } catch (_) { /* storage full — silently ignore */ }
  }

  function loadExpenses() {
    try {
      const data = localStorage.getItem('et_expenses');
      return data ? JSON.parse(data) : [];
    } catch (_) {
      return [];
    }
  }

  // ======== Utilities ========

  function formatCurrency(amount) {
    return '₦' + amount.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatTime(iso) {
    const d = new Date(iso);
    return d.toLocaleString('en-NG', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function escapeHtml(str) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return str.replace(/[&<>"']/g, c => map[c]);
  }

  function shakeElement(el) {
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
    el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
  }

  // ---- Toast Notification ----
  let toastTimer = null;

  function showToast(message, type = 'success') {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }

    clearTimeout(toastTimer);
    toast.classList.remove('show', 'toast-success', 'toast-danger');
    toast.textContent = message;
    toast.classList.add(`toast-${type}`);

    // Trigger reflow for transition restart
    void toast.offsetWidth;
    toast.classList.add('show');

    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  }
})();
