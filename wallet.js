// wallet.js

document.addEventListener('DOMContentLoaded', () => {
  // دالة مساعدة لتنسيق العملة بالعربية مع صورة بدل كلمة ريال
  const formatToArabicCurrency = (amount) => {
    const formatter = new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      currencyDisplay: 'code'
    });

    const arabicDigits = formatter.format(amount)
      .replace('SAR', '') // نشيل الكود النصي
      .replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]) // نحول الأرقام لعربي
      .trim();

    return `
      <span>${arabicDigits}</span>
      <img src="https://images.seeklogo.com/logo-png/61/1/new-saudi-riyal-2030-logo-png_seeklogo-613034.png" 
           alt="ريال" class="w-6 h-6 inline-block color-green-600"
           style="display:inline; align-items: center; vertical-align: middle;" />
    `;
  };

  // جلب التوكن والـ balance element
  const token = localStorage.getItem('token');
  const balanceEl = document.getElementById('wallet-balance');
  if (!token) {
    balanceEl.textContent = 'يجب تسجيل الدخول أولاً';
    return;
  }

  // جلب الرصيد الحالي من السيرفر
  fetch('https://api.technologytanda.com/api/userData/wallet', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.ok ? res.json() : Promise.reject(res.status))
    .then(data => {
      balanceEl.innerHTML = formatToArabicCurrency(data.walletBalance);
    })
    .catch(err => {
      console.error('Fetch wallet error:', err);
      balanceEl.textContent = 'خطأ في تحميل الرصيد';
    });

  // عناصر المودال
  const modal = document.getElementById('topup-modal');
  const btnOpen = document.getElementById('topup-btn');
  const btnCancel = document.getElementById('topup-cancel');
  const btnOk = document.getElementById('topup-ok');
  const inputAmt = document.getElementById('topup-amount');

  // فتح/إغلاق المودال
  btnOpen.addEventListener('click', () => modal.classList.remove('hidden'));
  btnCancel.addEventListener('click', () => modal.classList.add('hidden'));

  // شحن المحفظة عند الضغط على موافق
  btnOk.addEventListener('click', () => {
    const amount = parseFloat(inputAmt.value);
    if (isNaN(amount) || amount <= 0) {
      alert('الرجاء إدخال رقم صحيح أكبر من الصفر');
      return;
    }

    // POST لعملية التوب أب
    fetch('https://api.technologytanda.com/api/payments/topup', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount })
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          alert(data.error || 'فشل في الشحن');
          return Promise.reject();
        }
        // لو نجح الشحن، نعيد جلب الرصيد الفعلي
        return fetch('https://api.technologytanda.com/api/userData/wallet', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      })
      .then(res => res.json())
      .then(walletData => {
        balanceEl.innerHTML = formatToArabicCurrency(walletData.walletBalance);
        modal.classList.add('hidden');
        inputAmt.value = '';
        alert('تم الشحن بنجاح');

        // إضافة سجل شحن جديد للأنشطة الأخيرة في localStorage
        const activities = JSON.parse(localStorage.getItem('activities') || '[]');
        activities.unshift({
          type: 'topup',
          amount: amount,
          date: new Date().toISOString()
        });
        localStorage.setItem('activities', JSON.stringify(activities));
      })
      .catch(err => {
        console.error('Top-up error:', err);
        alert('حدث خطأ أثناء الشحن');
      });
  });
});
