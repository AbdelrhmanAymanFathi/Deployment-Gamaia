// تأكد من وجود العناصر قبل إضافة المستمع
const profileToggle = document.getElementById("profile-toggle");
const profileMenu = document.getElementById("popup-menu");

// Add null check before using notificationDropdown:
const notificationDropdown = document.getElementById("notification-dropdown");
if (notificationDropdown) {
  // Toggle notifications
  // notificationToggle.addEventListener("click", (e) => {
  //   e.stopPropagation();
  //   profileMenu.classList.add("hidden");
  //   notificationDropdown.classList.toggle("hidden");
  // });
}

if (profileToggle && profileMenu) {
  profileToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    if (notificationDropdown) notificationDropdown.classList.add("hidden");
    profileMenu.classList.toggle("hidden");
  });
}

// Close dropdowns if click outside
document.addEventListener("click", () => {
  profileMenu.classList.add("hidden");
  if (notificationDropdown) notificationDropdown.classList.add("hidden");
});

// Logout
document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
});

