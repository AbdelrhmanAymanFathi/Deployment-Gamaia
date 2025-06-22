// login.js
document.getElementById("login-form").addEventListener("submit", async function(e) {
  e.preventDefault();

  const nationalId = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;
  const errorElement = document.getElementById("login-error");

  // Check if window.api and window.api.auth are available
  if (!window.api || !window.api.auth || typeof window.api.auth.login !== "function") {
    errorElement.textContent = "خدمة تسجيل الدخول غير متوفرة حالياً. يرجى المحاولة لاحقاً.";
    errorElement.style.display = "block";
    return;
  }

  try {
    const data = await window.api.auth.login(nationalId, password);
    window.location.href = "./home.html";
  } catch (error) {
    errorElement.textContent = error.message || "Failed to login. Please try again.";
    errorElement.style.display = "block";
  }
});

