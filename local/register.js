document.getElementById('register-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  const form = document.getElementById('register-form');
  const formData = new FormData(form);
  const errorElement = document.getElementById('register-error');

  try {
    const data = await window.api.auth.register(formData);
    // حفظ userId و user object بعد التسجيل (لو رجعهم السيرفر)
    if (data.user && data.user.id) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    window.location.href = 'login.html';
  } catch (error) {
    errorElement.textContent = error.message || 'Registration failed. Please try again.';
    errorElement.style.display = 'block';
  }
});