    // Profile dropdown
    document.getElementById("profile-toggle").addEventListener("click", (e) => {
      e.stopPropagation();
      document.getElementById("popup-menu").classList.toggle("active");
    });

    // Notification dropdown
    document.getElementById("notification-toggle").addEventListener("click", (e) => {
      e.stopPropagation();
      document.getElementById("notification-dropdown").classList.toggle("active");
    });

    // Close dropdowns when clicking outside
    document.addEventListener("click", () => {
      document.getElementById("popup-menu").classList.remove("active");
      document.getElementById("notification-dropdown").classList.remove("active");
    });

    // Logout button
    document.getElementById("logout-btn").addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "login.html";
    });
