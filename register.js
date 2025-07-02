// التنقل بين الخطوات
    const steps = document.querySelectorAll('.step');
    const indicators = document.querySelectorAll('.step-indicator');

    function showStep(idx) {
      steps.forEach((s, i) => {
        s.classList.toggle('hidden', i !== idx);
        indicators[i].classList.toggle('active', i === idx);
      });
    }

    document.getElementById('to-step-1').addEventListener('click', () => showStep(1));
    document.getElementById('to-step-2').addEventListener('click', () => showStep(2));
    indicators.forEach(ind => {
      ind.addEventListener('click', () => {
        const i = parseInt(ind.getAttribute('data-step'));
        showStep(i);
      });
    });

    // ربط النموذج بالـ API
    document.getElementById('register-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      const formData = new FormData(this);
      const errorEl = document.getElementById('register-error');
      try {
        const res = await fetch('https://api.technologytanda.com/api/auth/register', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'فشل التسجيل');
        alert('✅ تم التسجيل بنجاح');
        window.location.href = 'login.html';
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
      }
    });

    // عرض الخطوة الأولى عند التحميل
    showStep(0);