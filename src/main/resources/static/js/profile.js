let currentProfile = {};

document.addEventListener("DOMContentLoaded", () => {
    loadUserProfile();
});

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    window.location.replace("/index.html");
}

async function loadUserProfile() {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.replace("/login.html");
        return;
    }

    const response = await fetch("/customer/profile", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    if (response.status === 401 || response.status === 403) {
        alert("Session expired or access denied.");
        window.location.replace("/login.html");
        return;
    }

    const data = await response.json();
    currentProfile = data;

    const welcomeEl = document.getElementById("welcomeText");
    if (welcomeEl) {
        welcomeEl.innerText = `Welcome, ${data.username}`;
    }

    document.getElementById("profUsername").innerText = data.username;
    document.getElementById("profRole").innerText = data.role;

    document.getElementById("profName").innerText = data.name || "-";
    document.getElementById("profEmailView").innerText = data.email || "-";
    document.getElementById("profPhoneView").innerText = data.phone || "-";
    document.getElementById("profAddressView").innerText = data.address || "-";
}

function enterEditMode() {
    document.getElementById("profNameInput").value = currentProfile.name || "";
    document.getElementById("profEmailInput").value = currentProfile.email || "";
    document.getElementById("profPhoneInput").value = currentProfile.phone || "";
    document.getElementById("profAddressInput").value = currentProfile.address || "";

    document.getElementById("viewMode").style.display = "none";
    document.getElementById("editMode").style.display = "block";
}

function exitEditMode() {
    document.getElementById("editMode").style.display = "none";
    document.getElementById("viewMode").style.display = "block";
}

async function saveProfile() {
    const token = localStorage.getItem("token");
    const messageEl = document.getElementById("profileMessage");

    const payload = {
        name: document.getElementById("profNameInput").value,
        email: document.getElementById("profEmailInput").value,
        phone: document.getElementById("profPhoneInput").value,
        address: document.getElementById("profAddressInput").value
    };

    const response = await fetch("/customer/profile", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify(payload)
    });

    if (response.status === 401 || response.status === 403) {
        alert("Session expired or access denied.");
        window.location.replace("/login.html");
        return;
    }

    if (!response.ok) {
        messageEl.classList.add("error");
        messageEl.innerText = "Failed to save changes.";
        return;
    }

    const data = await response.json();
    currentProfile = data;

    document.getElementById("profName").innerText = data.name || "-";
    document.getElementById("profEmailView").innerText = data.email || "-";
    document.getElementById("profPhoneView").innerText = data.phone || "-";
    document.getElementById("profAddressView").innerText = data.address || "-";

    messageEl.classList.remove("error");
    messageEl.innerText = "Profile updated successfully.";

    setTimeout(() => {
        exitEditMode();
        messageEl.innerText = "";
    }, 900);
}
