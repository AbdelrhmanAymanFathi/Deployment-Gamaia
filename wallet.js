// wallet.js

document.addEventListener('DOMContentLoaded', () => {

  // جلب التوكن والـ balance element
  const token = localStorage.getItem('token');
  const balanceEl = document.getElementById('wallet-balance');
  if (!token) {
    balanceEl.textContent = 'you need to login first';
    return;
  }

  // جلب الرصيد الحالي من السيرفر
  fetch('https://money-production-bfc6.up.railway.app/api/userData/wallet', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.ok ? res.json() : Promise.reject(res.status))
    .then(data => {
      balanceEl.textContent = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EGP',
        currencyDisplay: 'code'
      }).format(data.walletBalance);
    })
    .catch(err => {
      console.error('Fetch wallet error:', err);
      balanceEl.textContent = 'error loading balance';
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
      alert('Please enter an integer greater than zero');
      return;
    }

    // POST لعملية التوب أب
    fetch('https://money-production-bfc6.up.railway.app/api/payments/topup', {
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
          alert(data.error || 'Failed to load');
          return Promise.reject();
        }
        // لو نجح الشحن، نعيد جلب الرصيد الفعلي
        return fetch('https://money-production-bfc6.up.railway.app/api/userData/wallet', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      })
      .then(res => res.json())
      .then(walletData => {
        balanceEl.textContent = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'EGP',
          currencyDisplay: 'code'
        }).format(walletData.walletBalance);
        modal.classList.add('hidden');
        inputAmt.value = '';
        alert('The shipment was successful');

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
      });
  });
});
