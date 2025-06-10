
  const profileToggle = document.getElementById("profile-toggle");
  const profileMenu = document.getElementById("popup-menu");
  const notificationToggle = document.getElementById("notification-toggle");
  const notificationDropdown = document.getElementById("notification-dropdown");

  // Toggle profile menu
  profileToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    notificationDropdown.classList.add("hidden");
    profileMenu.classList.toggle("hidden");
  });

  // Toggle notifications
  notificationToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    profileMenu.classList.add("hidden");
    notificationDropdown.classList.toggle("hidden");
  });

  // Close dropdowns if click outside
  document.addEventListener("click", () => {
    profileMenu.classList.add("hidden");
    notificationDropdown.classList.add("hidden");
  });

  // Logout
  document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  });

  