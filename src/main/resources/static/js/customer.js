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

  return true;
}

function getToken() {
  return localStorage.getItem("token");
}

function startShopping() {
  loadProducts();
}

function goToCart() {
  window.location.href = "/view-cart.html";
}

function goBackToShopping() {
  window.location.href = "/customer-home.html";
}

let allProducts = [];

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

  const products = await response.json();
  allProducts = products;

  renderCategories();
}

function categoryIcon(category) {
  const key = (category || "").toLowerCase();
  const map = {
    electronics: "💻", mobile: "📱", phones: "📱",
	skincare: "🧴", fashion: "👕", clothing: "👕", 
	apparel: "👕", footwear: "👟", shoes: "👟",
    grocery: "🛒", food: "🍽️", beauty: "💄",
    home: "🏠", furniture: "🛋️", kitchen: "🍳",
    books: "📚", stationery: "📚", toys: "🧸",
    sports: "🏸", fitness: "🏋️",
    jewelery: "💍", jewellery: "💍",
    accessories: "🎒", automotive: "🚗", appliances: "🔌"
  };
  for (const word in map) {
    if (key.includes(word)) return map[word];
  }
  return "🛍️";
}

function renderCategories() {
  const categorySection = document.getElementById("categorySection");
  const shoppingSection = document.getElementById("shoppingSection");
  const categoryGrid = document.getElementById("categoryGrid");

  shoppingSection.style.display = "none";
  categorySection.style.display = "block";

  if (!allProducts.length) {
    categoryGrid.innerHTML = "<p class='empty-state'>No products found</p>";
    return;
  }

  const counts = {};
  allProducts.forEach(product => {
    const cat = product.category || "Uncategorized";
    counts[cat] = (counts[cat] || 0) + 1;
  });

  const categories = Object.keys(counts).sort();

  let html = "";
  categories.forEach(category => {
    html += `
      <div class="category-card" onclick="selectCategory('${category.replace(/'/g, "\\'")}')">
        <div class="category-icon">${categoryIcon(category)}</div>
        <div class="category-name">${category}</div>
        <div class="category-count">${counts[category]} item${counts[category] === 1 ? "" : "s"}</div>
      </div>
    `;
  });

  categoryGrid.innerHTML = html;
}

function selectCategory(category) {
  const categorySection = document.getElementById("categorySection");
  const shoppingSection = document.getElementById("shoppingSection");
  const productList = document.getElementById("productList");
  const categoryHeading = document.getElementById("categoryHeading");

  categorySection.style.display = "none";
  shoppingSection.style.display = "block";
  categoryHeading.innerText = category;

  const filtered = allProducts.filter(p => (p.category || "Uncategorized") === category);

  if (!filtered.length) {
    productList.innerHTML = "<p class='empty-state'>No products found in this category</p>";
    return;
  }

  let html = "";
  filtered.forEach(product => {
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

function backToCategories() {
  renderCategories();
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

      alert(verifyResult.message || "Payment successful");
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
});