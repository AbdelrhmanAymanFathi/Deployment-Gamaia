console.log('login.js loaded');

document.getElementById('login-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      const errorEl = document.getElementById('login-error');
      errorEl.textContent = '';
      errorEl.classList.add('hidden');

      const nationalId = document.getElementById('login-username').value.trim();
      const password  = document.getElementById('login-password').value;

      try {
        const res = await fetch('https://api.technologytanda.com/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nationalId, password })
        });

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          // Log raw response for debugging
          console.error('Raw response:', text);
          // Show backend error message if available, else generic message
          throw new Error(text || 'كلمة المرور أو رقم الهوية الوطنية غير صحيح');
        }

        if (!res.ok) {
          throw new Error(data.message || 'فشل في تسجيل الدخول');
        }

        // مثال: حفظ التوكن في localStorage
        console.log('Login response user:', data.user, 'userId:', data.user && data.user.id);
        localStorage.setItem('token', data.token);
        // حفظ معلومات المستخدم
        localStorage.setItem('user', JSON.stringify(data.user));

        window.location.href = 'home.html';
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
      }
    });