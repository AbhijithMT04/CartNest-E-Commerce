function getToken() {
  return localStorage.getItem("token");
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("role");
  window.location.href = "/index.html";
}

function ensureAdminAccess() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "ADMIN") {
    window.location.replace("/admin-login.html");
    return false;
  }

  const welcomeEl = document.getElementById("welcomeText");
  if (welcomeEl) {
    const username = localStorage.getItem("username");
    welcomeEl.innerText = `Welcome, ${username}`;
  }

  return true;
}

function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function setMessage(text, isError) {
  const messageEl = document.getElementById("message");
  if (!messageEl) return;
  messageEl.innerText = text;
  messageEl.classList.remove("success", "error");
  messageEl.classList.add(isError ? "error" : "success");
}

async function addProduct(event) {
  event.preventDefault();

  const data = {
    name: document.getElementById("name").value,
    description: document.getElementById("description").value,
    price: document.getElementById("price").value,
    stock: document.getElementById("stock").value,
    category: document.getElementById("category").value,
    imageUrl: document.getElementById("imageUrl").value
  };

  const response = await fetch("/admin/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + getToken()
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    setMessage("Failed to add product", true);
    return;
  }

  setMessage("Product added successfully", false);

  setTimeout(() => {
    window.location.href = "/all-products-admin.html";
  }, 1000);
}

async function loadAllProducts() {
  const response = await fetch("/admin/products", {
    headers: {
      "Authorization": "Bearer " + getToken()
    }
  });

  if (response.status === 401 || response.status === 403) {
    window.location.replace("/admin-login.html");
    return;
  }

  const products = await response.json();
  const productList = document.getElementById("productList");

  if (!products.length) {
    productList.innerHTML = "<p class='empty-state'>No products found</p>";
    return;
  }

  let html = `
      <table class="product-table admin-table">
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Price</th>
          <th>Stock</th>
          <th>Category</th>
          <th>Actions</th>
        </tr>
    `;

    products.forEach(product => {
      html += `
        <tr>
          <td>${product.id}</td>
          <td>${product.name}</td>
          <td>₹${product.price}</td>
          <td>${product.stock}</td>
          <td><span class="admin-product-category">${product.category}</span></td>
          <td class="admin-table-actions">
            <a class="btn-ghost" href="/view-product-admin.html?id=${product.id}">View</a>
            <a class="btn-ghost" href="/edit-product.html?id=${product.id}">Edit</a>
            <button class="btn-remove" onclick="deleteProduct(${product.id})">Delete</button>
          </td>
        </tr>
      `;
    });

    html += "</table>";
    productList.innerHTML = html;
}

async function loadProductDetails() {
  const id = getProductIdFromUrl();
  if (!id) return;

  const response = await fetch(`/admin/products/${id}`, {
    headers: {
      "Authorization": "Bearer " + getToken()
    }
  });

  if (response.status === 401 || response.status === 403) {
    window.location.replace("/admin-login.html");
    return;
  }

  const product = await response.json();
  const detailsDiv = document.getElementById("productDetails");

  detailsDiv.innerHTML = `
      <div class="detail-card">
        <img class="product-image-preview" src="${product.imageUrl || ""}" alt="${product.name}" />
        <div class="detail-row"><span class="profile-label">ID</span><span class="profile-value">${product.id}</span></div>
        <div class="detail-row"><span class="profile-label">Name</span><span class="profile-value">${product.name}</span></div>
        <div class="detail-row"><span class="profile-label">Description</span><span class="profile-value">${product.description}</span></div>
        <div class="detail-row"><span class="profile-label">Price</span><span class="profile-value">₹${product.price}</span></div>
        <div class="detail-row"><span class="profile-label">Stock</span><span class="profile-value">${product.stock}</span></div>
        <div class="detail-row"><span class="profile-label">Category</span><span class="profile-value">${product.category}</span></div>
      </div>
    `;
}
/*
<img src="${product.photoUrl ?? ""}" />
*/

async function prefillEditForm() {
  const id = getProductIdFromUrl();
  if (!id) return;

  const response = await fetch(`/admin/products/${id}`, {
    headers: {
      "Authorization": "Bearer " + getToken()
    }
  });

  if (response.status === 401 || response.status === 403) {
    window.location.replace("/admin-login.html");
    return;
  }

  const product = await response.json();

  document.getElementById("name").value = product.name;
  document.getElementById("description").value = product.description;
  document.getElementById("price").value = product.price;
  document.getElementById("stock").value = product.stock;
  document.getElementById("category").value = product.category;
  document.getElementById("imageUrl").value = product.imageUrl || "";
}

async function updateProduct(event) {
  event.preventDefault();

  const id = getProductIdFromUrl();

  const data = {
    name: document.getElementById("name").value,
    description: document.getElementById("description").value,
    price: document.getElementById("price").value,
    stock: document.getElementById("stock").value,
    category: document.getElementById("category").value,
    imageUrl: document.getElementById("imageUrl").value
  };

  const response = await fetch(`/admin/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + getToken()
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    setMessage("Failed to update product", true);
    return;
  }

  setMessage("Product updated successfully", false);

  setTimeout(() => {
    window.location.href = "/all-products-admin.html";
  }, 1000);
}

async function deleteProduct(id) {
  const confirmed = confirm("Are you sure you want to delete this product?");
  if (!confirmed) return;

  const response = await fetch(`/admin/products/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": "Bearer " + getToken()
    }
  });

  if (!response.ok) {
    alert("Failed to delete product");
    return;
  }

  alert("Product deleted successfully");
  loadAllProducts();
}

document.addEventListener("DOMContentLoaded", () => {
  if (!ensureAdminAccess()) return;

  const addProductForm = document.getElementById("addProductForm");
  const editProductForm = document.getElementById("editProductForm");
  const productList = document.getElementById("productList");
  const productDetails = document.getElementById("productDetails");

  if (addProductForm) {
    addProductForm.addEventListener("submit", addProduct);
  }

  if (editProductForm) {
    prefillEditForm();
    editProductForm.addEventListener("submit", updateProduct);
  }

  if (productList) {
    loadAllProducts();
  }

  if (productDetails) {
    loadProductDetails();
  }
});
