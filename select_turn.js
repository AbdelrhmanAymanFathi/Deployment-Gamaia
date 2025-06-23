 // Helpers
    function formatDate(dateString) {
      const date = new Date(dateString);
      const months = [
        'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
      ];
      return `${months[date.getMonth()]} ${date.getFullYear()}`;
    }
    function formatAmount(amount) {
      return `${amount.toLocaleString(undefined, {maximumFractionDigits: 0})} رس`;
    }

    // State
    let turns = [];
    let tabs = { early: [], middle: [], late: [] };
    let selectedTab = 'early';
    let selectedTurnId = null;
    let association = null;

    // DOM
    const turnsGrid = document.getElementById('turnsGrid');
    const durationEl = document.getElementById('duration');
    const monthlyFeeEl = document.getElementById('monthlyFee');
    const totalFeeEl = document.getElementById('totalFee');
    const nextBtn = document.getElementById('nextBtn');

    // جلب البيانات من الـ API
    async function fetchTurns() {
      const associationId = localStorage.getItem('selectedAssociationId');
      const token = localStorage.getItem('token');
      if (!associationId) {
        alert('لم يتم اختيار جمعية!');
        window.location.href = 'home.html';
        return;
      }
      if (!token) {
        alert('يجب تسجيل الدخول أولاً');
        window.location.href = 'login.html';
        return;
      }
      try {
        const res = await fetch(`https://money-production-bfc6.up.railway.app/api/turns/public/${associationId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) {
          throw new Error('Network response was not ok: ' + res.status);
        }
        const data = await res.json();
        if (!Array.isArray(data)) {
          throw new Error('البيانات المستلمة ليست مصفوفة');
        }
        turns = data;
        if (turns.length === 0) throw new Error('لا يوجد أدوار متاحة');
        association = turns[0].association;
        // حساب الرسوم حسب نوع الدور
        calculateFees();
        splitTabs();
        renderTabs();
        renderTurns();
        renderSummary();
      } catch (e) {
        console.error('تفاصيل الخطأ:', e);
        alert('خطأ في تحميل الأدوار');
      }
    }

    // حساب الرسوم حسب نوع الدور
    function calculateFees() {
      if (!association) return;
      const n = turns.length;
      const perTab = Math.ceil(n / 3);
      const totalAmount = association.monthlyAmount * n;
      turns.forEach((turn, idx) => {
        let percent = 0;
        if (idx < perTab) {
          percent = -0.07; // خصم 7%
        } else if (idx < perTab * 2) {
          percent = -0.05; // خصم 5%
        } else {
          percent = 0.02; // كاش باك 2%
        }
        turn.feeAmount = Math.round(association.monthlyAmount * n * percent);
      });
    }

    // تقسيم الأدوار Tabs تلقائياً
    function splitTabs() {
      const n = turns.length;
      const perTab = Math.ceil(n / 3);
      tabs.early = turns.slice(0, perTab);
      tabs.middle = turns.slice(perTab, perTab * 2);
      tabs.late = turns.slice(perTab * 2);
    }

    function renderTabs() {
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === selectedTab) btn.classList.add('active');
      });
    }

    function renderTurns() {
      turnsGrid.innerHTML = '';
      tabs[selectedTab].forEach(turn => {
        const card = document.createElement('div');
        card.className = `turn-card border-2 rounded-xl p-3 flex flex-col gap-1 cursor-pointer relative transition ${turn.taken ? 'taken border-gray-300 bg-gray-100' : 'border-teal-400 bg-white'}`;
        card.dataset.id = turn.id;
        if (turn.taken) card.classList.add('pointer-events-none');
        if (selectedTurnId === turn.id) card.classList.add('selected');
        card.innerHTML = `
      <div class="flex items-center gap-2 mb-1">
        <input type="radio" name="turn" value="${turn.id}" ${turn.taken ? 'disabled' : ''} ${selectedTurnId === turn.id ? 'checked' : ''} class="accent-teal-500">
        <span class="font-bold">${turn.turnName}</span>
      </div>
      <div class="text-xs text-gray-500 mb-1">${formatDate(turn.scheduledDate)}</div>
      <div class="text-sm font-bold text-teal-700">
        ${
          turn.feeAmount > 0
            ? formatAmount(turn.feeAmount) + ' رسوم'
            : (turn.feeAmount < 0
              ? formatAmount(turn.feeAmount) + ' خصم'
              : 'بدون رسوم')
        }
      </div>
      ${turn.taken ? `<div class="absolute top-2 left-2 flex items-center gap-1 text-xs lock"><svg xmlns="http://www.w3.org/2000/svg" class="inline w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm6-10V7a4 4 0 10-8 0v2" /></svg> غير متاح</div>` 
        : `<button class="lock-btn mt-3 px-3 py-1 rounded bg-green-600 text-white font-bold w-full">احجز الدور</button>`
      }
    `;
    if (!turn.taken) {
      card.addEventListener('click', () => {
        selectedTurnId = turn.id;
        nextBtn.disabled = false;
        renderTurns();
        renderSummary(); // Update summary on selection
      });

      // Add lock button event
      setTimeout(() => {
        const lockBtn = card.querySelector('.lock-btn');
        if (lockBtn) {
          lockBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const confirmed = confirm('هل أنت متأكد أنك تريد اختيار هذا الدور؟');
            if (!confirmed) return;
            // هنا ضع منطق الحجز الفعلي (API)
            // مثال:
            // await window.api.turns.select(association.id, turn.id);
            window.location.href = 'upload.html';
          });
        }
      }, 0);
    }
    turnsGrid.appendChild(card);
  });
}
    function renderSummary() {
      if (!association) return;
      durationEl.textContent = turns.length + ' شهور';
      monthlyFeeEl.textContent = formatAmount(association.monthlyAmount);

      // Show feeAmount of selected turn, or '-' if none selected
      const selectedTurn = turns.find(t => t.id === selectedTurnId);
      document.getElementById('Fee').textContent = selectedTurn
        ? formatAmount(selectedTurn.feeAmount)
        : '-';

      // إجمالي القبض = القسط الشهري × المدة ± الرسوم
      let total = association.monthlyAmount * turns.length;
      if (selectedTurn) {
        total += selectedTurn.feeAmount;
      }
      totalFeeEl.textContent = selectedTurn
        ? formatAmount(total)
        : '-';

      // Show difference text
      const diff = (selectedTurn ? selectedTurn.feeAmount : 0);
      const diffEl = document.getElementById('feeDiffText');
      if (selectedTurn) {
        if (diff > 0) {
          diffEl.textContent = `كاش باك ${formatAmount(diff)}`;
          diffEl.classList.remove('text-red-500', 'hidden');
          diffEl.classList.add('text-green-500');
        } else if (diff < 0) {
          diffEl.textContent = `خصم قدره ${formatAmount(-diff)}`;
          diffEl.classList.remove('text-green-500', 'hidden');
          diffEl.classList.add('text-red-500');
        } else {
          diffEl.textContent = '';
          diffEl.classList.add('hidden');
        }
      } else {
        diffEl.textContent = '';
        diffEl.classList.add('hidden');
      }
    }

    // التبديل بين التابات
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedTab = btn.dataset.tab;
        renderTabs();
        renderTurns();
        renderSummary(); // Update summary on tab switch
      });
    });

    // زر التالي
    nextBtn.addEventListener('click', function() {
      if (!selectedTurnId) return;
      alert('تم اختيار الدور رقم: ' + selectedTurnId + '\nتم الانضمام للجمعية بنجاح!');
      window.location.href = "home.html";
    });

    // أول تحميل
    fetchTurns();