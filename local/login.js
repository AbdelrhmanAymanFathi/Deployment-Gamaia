// login.js
console.log('local/login.js loaded');
document.getElementById("login-form").addEventListener("submit", async function(e) {
  e.preventDefault();

  const nationalId = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;
  const errorElement = document.getElementById("login-error");

  try {
    const data = await window.api.auth.login(nationalId, password);
    // حفظ userId و user object بعد تسجيل الدخول
    if (data.user && data.user.id) {
      console.log('Login response user:', data.user, 'userId:', data.user && data.user.id);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    window.location.href = "./home.html";
  } catch (error) {
    errorElement.textContent = error.message || "Failed to login. Please try again.";
    errorElement.style.display = "block";
  }
});

