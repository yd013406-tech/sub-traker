const currencyFormatter = new Intl.NumberFormat("ko-KR");
const categoryColors = ["#7667df", "#42b7a4", "#f2a65a", "#e57991", "#4f99d6", "#9a77c9"];

function formatWon(amount) {
  return `${currencyFormatter.format(amount)}원`;
}

function renderSubscriptions(subscriptions, listElement, onEdit, onDelete) {
  listElement.replaceChildren();

  if (subscriptions.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "아직 등록된 구독이 없어요. 첫 구독을 추가해 보세요.";
    listElement.append(empty);
    return;
  }

  subscriptions.forEach((subscription) => {
    const card = document.createElement("article");
    card.className = "subscription-card";

    const main = document.createElement("div");
    main.className = "subscription-main";

    const titleRow = document.createElement("div");
    titleRow.className = "subscription-title-row";
    const name = document.createElement("span");
    name.className = "subscription-name";
    name.textContent = subscription.name;
    const category = document.createElement("span");
    category.className = "category-tag";
    category.textContent = subscription.category;
    titleRow.append(name, category);

    const meta = document.createElement("div");
    meta.className = "subscription-meta";
    const dueDays = getDaysUntilNextPayment(getTodayString(), subscription.nextPaymentDate);
    const dueText = dueDays < 0
      ? `결제일 ${Math.abs(dueDays)}일 지남`
      : dueDays === 0
        ? "오늘 결제"
        : `D-${dueDays}`;
    meta.textContent = `${subscription.cycle === "yearly" ? "매년" : "매월"} · ${dueText}`;
    if (subscription.paymentMethod) {
      meta.textContent += ` · ${subscription.paymentMethod}`;
    }
    main.append(titleRow, meta);

    const price = document.createElement("div");
    price.className = "subscription-price";
    price.textContent = formatWon(getMonthlyAmount(subscription));
    const perMonth = document.createElement("small");
    perMonth.textContent = "/월";
    price.append(perMonth);

    const actions = document.createElement("div");
    actions.className = "card-actions";
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "text-button";
    editButton.textContent = "수정";
    editButton.setAttribute("aria-label", `${subscription.name} 수정`);
    editButton.addEventListener("click", () => onEdit(subscription.id));
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "text-button delete-button";
    deleteButton.textContent = "삭제";
    deleteButton.setAttribute("aria-label", `${subscription.name} 삭제`);
    deleteButton.addEventListener("click", () => onDelete(subscription.id));
    actions.append(editButton, deleteButton);

    card.append(main, price, actions);
    listElement.append(card);
  });
}

function renderCategoryBreakdown(categoryTotals, container, total) {
  container.replaceChildren();
  const categories = Object.entries(categoryTotals)
    .sort((first, second) => second[1] - first[1]);
  if (categories.length === 0) {
    const empty = document.createElement("p");
    empty.className = "category-empty";
    empty.textContent = "구독을 추가하면 카테고리 비중을 보여드려요.";
    container.append(empty);
    return;
  }

  categories.forEach(([category, amount], index) => {
    const row = document.createElement("div");
    row.className = "category-row";
    const name = document.createElement("span");
    name.className = "category-name";
    name.textContent = category;
    const track = document.createElement("div");
    track.className = "category-track";
    track.setAttribute("role", "img");
    const percentage = total > 0 ? (amount / total) * 100 : 0;
    track.setAttribute("aria-label", `${category} ${Math.round(percentage)}%`);
    const bar = document.createElement("div");
    bar.className = "category-bar";
    bar.style.width = `${percentage}%`;
    bar.style.setProperty("--bar-color", categoryColors[index % categoryColors.length]);
    track.append(bar);
    const value = document.createElement("span");
    value.className = "category-amount";
    value.textContent = `${formatWon(amount)} · ${Math.round(percentage)}%`;
    row.append(name, track, value);
    container.append(row);
  });
}

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

window.SubscriptionUI = {
  formatWon,
  getTodayString,
  renderCategoryBreakdown,
  renderSubscriptions
};
