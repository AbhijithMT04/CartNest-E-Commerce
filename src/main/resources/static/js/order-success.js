document.addEventListener("DOMContentLoaded", () => {
  const raw = localStorage.getItem("lastOrder");
  const summaryEl = document.getElementById("orderSummary");

  if (raw) {
    const order = JSON.parse(raw);
    document.getElementById("orderId").innerText = order.orderId || "-";
    document.getElementById("orderAmount").innerText = order.amount
      ? `₹${(order.amount / 100).toFixed(2)}`
      : "-";
    document.getElementById("orderPaymentId").innerText = order.paymentId || "-";
    localStorage.removeItem("lastOrder");
  } else if (summaryEl) {
    summaryEl.style.display = "none";
  }

  loadShippingAddress();
});

async function loadShippingAddress() {
  const token = localStorage.getItem("token");
  const addressEl = document.getElementById("shippingAddress");
  if (!token || !addressEl) return;

  const response = await fetch("/customer/profile", {
    headers: { "Authorization": "Bearer " + token }
  });

  if (!response.ok) {
    addressEl.innerText = "Could not load your saved address.";
    return;
  }

  const data = await response.json().catch(() => ({}));
  addressEl.innerText = data.address || "No address on file — add one from your profile.";
}
