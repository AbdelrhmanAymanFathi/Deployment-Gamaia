// Notification dropdown functionality
document.getElementById("notification-toggle").addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("notification-dropdown").classList.toggle("active");
});

// Close dropdowns when clicking outside
document.addEventListener("click", (e) => {
    document.getElementById("popup-menu").classList.remove("active");
    document.getElementById("notification-dropdown").classList.remove("active");
}); 