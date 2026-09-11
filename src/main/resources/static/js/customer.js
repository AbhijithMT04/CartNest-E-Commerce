function ensureCustomer() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");

  if (!token || role !== "USER") {
    window.location.replace("/login.html");
    return false;
  }

  const welcome = document.getElementById("welcomeText");
  if (welcome) {
    welcome.innerText = `Welcome, ${username}`;
  }

  const avatarEl = document.getElementById("avatarInitial");
  if (avatarEl) {
    avatarEl.innerText = (username || "?").charAt(0).toUpperCase();
  }

  const chipName = document.getElementById("chipUsername");
  if (chipName) {
    chipName.innerText = username || "";
  }

  const chipRole = document.getElementById("chipRole");
  if (chipRole) {
    chipRole.innerText = `${role} — View profile`;
  }

  return true;
}

function getToken() {
  return localStorage.getItem("token");
}

function goToCart() {
  window.location.href = "/view-cart.html";
}

function goBackToShopping() {
  window.location.href = "/customer-home.html";
}

let allProducts = [];
let selectedCategory = "All";

async function loadProducts() {
  const response = await fetch("/products", {
    headers: {
      "Authorization": "Bearer " + getToken()
    }
  });

  if (response.status === 401) {
    logout();
    return;
  }

  if (response.status === 403) {
    alert("Access denied to products");
    return;
  }

  allProducts = await response.json();
  renderCategoryPills();
  applyFilters();
}

function renderCategoryPills() {
  const pillsEl = document.getElementById("categoryPills");
  if (!pillsEl) return;

  const rest = [...new Set(allProducts.map(p => p.category || "Uncategorized"))].sort();
  const categories = ["All", ...rest];

  pillsEl.innerHTML = categories.map(cat => `
    <button type="button" class="category-pill${cat === selectedCategory ? " active" : ""}" onclick="selectCategoryPill('${cat.replace(/'/g, "\\'")}')">${cat}</button>
  `).join("");
}

function selectCategoryPill(category) {
  selectedCategory = category;
  renderCategoryPills();
  applyFilters();
}

function applyFilters() {
  const searchInput = document.getElementById("searchInput");
  const search = (searchInput ? searchInput.value : "").trim().toLowerCase();

  let filtered = allProducts;

  if (selectedCategory !== "All") {
    filtered = filtered.filter(p => (p.category || "Uncategorized") === selectedCategory);
  }

  if (search) {
    filtered = filtered.filter(p => (p.name || "").toLowerCase().includes(search));
  }

  renderProductGrid(filtered);
}

function renderProductGrid(products) {
  const productList = document.getElementById("productList");
  if (!productList) return;

  if (!products.length) {
    productList.innerHTML = "<p class='empty-state'>No products found</p>";
    return;
  }

  let html = "";
  products.forEach(product => {
    html += `
      <div class="product-card">
        <img src="${product.imageUrl || ''}" alt="${product.name}" class="product-card-image" />
        <div class="product-card-body">
          <div class="product-card-name">${product.name}</div>
          <div class="product-card-price">₹${product.price}</div>
          <div class="product-card-meta">
            <span>Stock: ${product.stock}</span>
            <span>${product.category}</span>
          </div>
          <button class="btn-add" onclick="addToCart(${product.id})">Add to Cart</button>
        </div>
      </div>
    `;
  });

  productList.innerHTML = html;
}

async function addToCart(productId) {
  const response = await fetch("/customer/cart", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + getToken()
    },
    body: JSON.stringify({
      productId: productId,
      quantity: 1
    })
  });


  if (response.status === 401) {
    logout();
    return;
  }

  if (!response.ok) {
	console.error("HTTP Status Code Error:", response.status);
    const errorText = await response.text();
    console.error("Server Error Payload String:", errorText);
    alert("Failed to add product to cart. See console logs for details.");
    return;
  }

  const result = await response.json().catch(() => ({}));
  alert(result.message || "Product added to cart");
  updateCartBadge();
}

async function updateCartBadge() {
  const badgeEl = document.getElementById("cartBadge");
  if (!badgeEl) return;

  const response = await fetch("/customer/cart", {
    headers: {
      "Authorization": "Bearer " + getToken()
    }
  });

  if (!response.ok) return;

  const cart = await response.json().catch(() => null);
  if (!cart) return;

  badgeEl.innerText = cart.items ? cart.items.length : 0;
}

async function loadCart() {
  const response = await fetch("/customer/cart", {
    headers: {
      "Authorization": "Bearer " + getToken()
    }
  });

  if (response.status === 401) {
    logout();
    return;
  }

  if (response.status === 403) {
    alert("Access denied to cart");
    return;
  }

  const cart = await response.json();
  const cartList = document.getElementById("cartList");
  const cartTotal = document.getElementById("cartTotal");
  const checkoutBtn = document.getElementById("checkoutBtn");

  if (!cartList) return;

  if (!cart.items.length) {
    cartList.innerHTML = "<p class='empty-state'>Your cart is empty</p>";
    cartTotal.innerText = "";
    if (checkoutBtn) checkoutBtn.style.display = "none";
    return;
  }

  let html = "<div class='cart-item-list'>";

    cart.items.forEach(item => {
      html += `
        <div class="cart-item">
          <img src="${item.imageUrl || ''}" alt="${item.productName}" class="cart-item-image" />
          <div class="cart-item-info">
            <div class="cart-item-name">${item.productName}</div>
            <div class="cart-item-price">₹${item.price}</div>
          </div>
          <div class="cart-item-qty">
            <input type="number" min="1" value="${item.quantity}" id="qty-${item.cartItemId}" />
            <button class="btn-ghost" onclick="updateCartItem(${item.cartItemId})">Update</button>
          </div>
          <div class="cart-item-subtotal">₹${item.subtotal}</div>
          <button class="btn-remove" onclick="removeCartItem(${item.cartItemId})">Remove</button>
        </div>
      `;
    });

    html += "</div>";

    cartList.innerHTML = html;
    cartTotal.innerText = `Total: ₹${cart.totalAmount}`;}

async function updateCartItem(cartItemId) {
  const quantity = document.getElementById(`qty-${cartItemId}`).value;

  const response = await fetch(`/customer/cart/${cartItemId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + getToken()
    },
    body: JSON.stringify({
      quantity: Number(quantity)
    })
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    alert(result.message || "Failed to update cart item");
    return;
  }

  alert(result.message || "Cart updated");
  loadCart();
}

async function removeCartItem(cartItemId) {
  const response = await fetch(`/customer/cart/${cartItemId}`, {
    method: "DELETE",
    headers: {
      "Authorization": "Bearer " + getToken()
    }
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {		
    alert(result.message || "Failed to remove cart item");
    return;
  }

  alert(result.message || "Item removed from cart");
  loadCart();
}

async function checkout() {
  if (typeof Razorpay === "undefined") {
    alert("Razorpay SDK not loaded");
    return;
  }

  const createOrderResponse = await fetch("/customer/payment/create-order", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + getToken()
    }
  });

  if (createOrderResponse.status === 401) {
    logout();
    return;
  }

  const orderData = await createOrderResponse.json().catch(() => ({}));

  if (!createOrderResponse.ok) {
    alert(orderData.message || "Failed to create payment order");
    return;
  }

  const username = localStorage.getItem("username") || "Customer";

  const options = {
    key: orderData.keyId,
    amount: orderData.amount,
    currency: orderData.currency,
    name: "JWT Demo Store",
    description: "Cart Payment",
    order_id: orderData.razorpayOrderId,
    handler: async function (response) {
      const verifyResponse = await fetch("/customer/payment/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + getToken()
        },
        body: JSON.stringify({
          localOrderId: orderData.localOrderId,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
          razorpaySignature: response.razorpay_signature
        })
      });

      const verifyResult = await verifyResponse.json().catch(() => ({}));

      if (!verifyResponse.ok) {
        alert(verifyResult.message || "Payment verification failed");
        return;
      }

      localStorage.setItem("lastOrder", JSON.stringify({
        orderId: orderData.localOrderId || orderData.razorpayOrderId,
        amount: orderData.amount,
        paymentId: response.razorpay_payment_id
      }));

      window.location.href = "/order-success.html";
    },
    prefill: {
      name: username
    },
    theme: {
      color: "#2563eb"
    }
  };

  const rzp = new Razorpay(options);

  rzp.on("payment.failed", function () {
    alert("Payment failed");
  });

  rzp.open();
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("role");
  window.location.replace("/index.html");
}

document.addEventListener("DOMContentLoaded", () => {
  if (!ensureCustomer()) return;

  if (document.getElementById("cartList")) {
    loadCart();
  }

  if (document.getElementById("productList") && document.getElementById("categoryPills")) {
    loadProducts();
  }

  if (document.getElementById("cartBadge")) {
    updateCartBadge();
  }
});
