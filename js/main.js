const { formatWon, getTodayString, renderCategoryBreakdown, renderSubscriptions } = window.SubscriptionUI;

const STORAGE_KEY = "subscription-tracker-data";
const form = document.querySelector("#subscription-form");
const listElement = document.querySelector("#subscription-list");
const categoryElement = document.querySelector("#category-content");
const noticeElement = document.querySelector("#notice");
const submitButton = document.querySelector("#submit-button");
const cancelEditButton = document.querySelector("#cancel-edit");
const subscriptionsCount = document.querySelector("#subscription-count");
const monthlyTotalElement = document.querySelector("#monthly-total");
const yearlyTotalElement = document.querySelector("#yearly-total");
const dueCountElement = document.querySelector("#due-count");
const dueCaptionElement = document.querySelector("#due-caption");

let subscriptions = loadSubscriptions();
let editingId = null;

function loadSubscriptions() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) throw new Error("저장된 데이터 형식이 올바르지 않습니다.");
    return parsed;
  } catch (error) {
    noticeElement.textContent = `저장된 데이터를 불러오지 못했습니다: ${error.message}`;
    return [];
  }
}

function saveSubscriptions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
    noticeElement.textContent = "";
  } catch (error) {
    noticeElement.textContent = `데이터를 저장하지 못했습니다: ${error.message}`;
    throw error;
  }
}

function refresh() {
  const monthlyTotal = getTotalMonthlyAmount(subscriptions);
  const yearlyTotal = getTotalYearlyAmount(subscriptions);
  const dueThisWeek = getSubscriptionsDueWithinDays(subscriptions, getTodayString(), 7);

  monthlyTotalElement.textContent = formatWon(monthlyTotal);
  yearlyTotalElement.textContent = formatWon(yearlyTotal);
  dueCountElement.textContent = `${dueThisWeek.length}건`;
  dueCaptionElement.textContent = dueThisWeek.length
    ? dueThisWeek.map((subscription) => subscription.name).join(", ")
    : "앞으로 7일 이내";
  subscriptionsCount.textContent = `${subscriptions.length}개`;
  renderSubscriptions(subscriptions, listElement, startEditing, deleteSubscription);
  renderCategoryBreakdown(getMonthlyAmountByCategory(subscriptions), categoryElement, monthlyTotal);
}

function makeId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `sub_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function readForm() {
  const formData = new FormData(form);
  const name = String(formData.get("name")).trim();
  const category = String(formData.get("category")).trim();
  const paymentMethod = String(formData.get("paymentMethod")).trim();
  const amount = Number(formData.get("amount"));
  const cycle = String(formData.get("cycle"));
  const nextPaymentDate = String(formData.get("nextPaymentDate"));
  if (!name || !category || !Number.isSafeInteger(amount) || amount <= 0 || !nextPaymentDate) {
    throw new Error("이름, 금액, 결제일, 카테고리를 올바르게 입력해 주세요.");
  }
  if (cycle !== "monthly" && cycle !== "yearly") {
    throw new Error("결제 주기를 확인해 주세요.");
  }
  return { name, amount, cycle, nextPaymentDate, category, paymentMethod };
}

function resetForm() {
  editingId = null;
  form.reset();
  submitButton.textContent = "구독 추가하기";
  cancelEditButton.classList.add("is-hidden");
  document.querySelector("#name").focus();
}

function startEditing(id) {
  const subscription = subscriptions.find((item) => item.id === id);
  if (!subscription) return;
  editingId = id;
  form.elements.name.value = subscription.name;
  form.elements.amount.value = subscription.amount;
  form.elements.cycle.value = subscription.cycle;
  form.elements.nextPaymentDate.value = subscription.nextPaymentDate;
  form.elements.category.value = subscription.category;
  form.elements.paymentMethod.value = subscription.paymentMethod || "";
  submitButton.textContent = "변경사항 저장";
  cancelEditButton.classList.remove("is-hidden");
  noticeElement.textContent = "";
  document.querySelector("#name").focus();
  form.scrollIntoView({ behavior: "smooth", block: "center" });
}

function deleteSubscription(id) {
  const subscription = subscriptions.find((item) => item.id === id);
  if (!subscription) return;
  if (!window.confirm(`"${subscription.name}" 구독을 삭제할까요?`)) return;
  subscriptions = subscriptions.filter((item) => item.id !== id);
  try {
    saveSubscriptions();
    if (editingId === id) resetForm();
    refresh();
  } catch {
    subscriptions.push(subscription);
    refresh();
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  noticeElement.textContent = "";
  try {
    const details = readForm();
    const previous = editingId
      ? subscriptions.find((item) => item.id === editingId)
      : null;
    const updated = previous
      ? { ...previous, ...details }
      : { id: makeId(), ...details };
    subscriptions = previous
      ? subscriptions.map((item) => item.id === editingId ? updated : item)
      : [...subscriptions, updated];
    try {
      saveSubscriptions();
    } catch {
      if (previous) {
        subscriptions = subscriptions.map((item) => item.id === editingId ? previous : item);
      } else {
        subscriptions = subscriptions.filter((item) => item.id !== updated.id);
      }
      refresh();
      return;
    }
    resetForm();
    refresh();
    noticeElement.textContent = previous ? "구독 정보를 수정했어요." : "새 구독을 추가했어요.";
  } catch (error) {
    noticeElement.textContent = error.message;
  }
});

cancelEditButton.addEventListener("click", resetForm);

refresh();
