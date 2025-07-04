// تحقق من وجود التوكن
    let token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'index.html';
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Interceptor for 401 errors
    axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = 'index.html';
        }
        return Promise.reject(error);
      }
    );
    
    // --- Sidebar logic ---
    const sidebar = document.getElementById('sidebar');
    const collapseBtn = document.getElementById('sidebarCollapseBtn');
    const collapseIcon = document.getElementById('collapseIcon');
    
    function toggleSidebar() {
      if (window.innerWidth < 1024) {
        sidebar.classList.toggle('sidebar-expanded');
        sidebar.classList.toggle('sidebar-collapsed');
        
        if (sidebar.classList.contains('sidebar-expanded')) {
          collapseIcon.classList.remove('bi-chevron-double-left');
          collapseIcon.classList.add('bi-chevron-double-right');
        } else {
          collapseIcon.classList.add('bi-chevron-double-left');
          collapseIcon.classList.remove('bi-chevron-double-right');
        }
      }
    }
    
    if (collapseBtn) {
      collapseBtn.onclick = toggleSidebar;
    }
    
    // Mobile menu functions
    function openMobileMenu() {
      document.getElementById('mobileMenu').classList.remove('hidden');
    }
    
    function closeMobileMenu() {
      document.getElementById('mobileMenu').classList.add('hidden');
    }
    
    document.getElementById('mobileMenuBtn').onclick = openMobileMenu;
    
    // --- API endpoints ---
    const assocApi = 'https://api.technologytanda.com/api/associations';
    const userApi = 'https://api.technologytanda.com/api/admin/create-user';
    const createuserApi = "https://api.technologytanda.com/api/userData/admin/create-user";
    const usersApi = 'https://api.technologytanda.com/api/userData/users';
    
    // --- Main functions ---
    function renderAssociationCard(assoc) {
      return `
        <div class="card">
          <div class="p-5 space-y-3 flex flex-col h-full">
            <h3 class="font-bold text-lg">${assoc.name}</h3>
            <div class="space-y-2 flex-grow">
              <p class="flex justify-between"><span class="text-gray-500">المبلغ الشهري:</span> <span>${assoc.monthlyAmount}</span></p>
              <p class="flex justify-between"><span class="text-gray-500">المدة:</span> <span>${assoc.duration} ${assoc.type}</span></p>
              <p class="flex justify-between"><span class="text-gray-500">الحالة:</span> <span class="${assoc.status === 'active' ? 'text-green-600' : 'text-yellow-600'}">${assoc.status}</span></p>
              <p class="flex justify-between"><span class="text-gray-500">الأعضاء:</span> <span>${assoc.maxMembers}</span></p>
            </div>
            <div class="mt-auto flex flex-wrap gap-2 justify-between">
              <button onclick="openEditAssociationModal(${assoc.id}, ${assoc.monthlyAmount}, ${assoc.duration}, '${assoc.status}')"
                      class="action-btn bg-blue-100 text-blue-700 hover:bg-blue-200">تعديل</button>
              <button onclick="openDeleteAssociationModal(${assoc.id})"
                      class="action-btn bg-red-100 text-red-700 hover:bg-red-200">حذف</button>
              <button onclick="loadMembers(${assoc.id})"
                      class="action-btn bg-green-100 text-green-700 hover:bg-green-200">الأعضاء</button>
              <button onclick="openAddMemberModal(${assoc.id})"
                      class="action-btn bg-purple-100 text-purple-700 hover:bg-purple-200">إضافة عضو</button>
            </div>
          </div>
        </div>
      `;
    }
    
    // Load associations
    async function loadAssociations() {
      document.getElementById('contentContainer').innerHTML = document.getElementById('associationsTemplate').innerHTML;
      const container = document.getElementById('associationsContainer');
      container.innerHTML = '<div class="col-span-full text-center py-8"><div class="loading-spinner mx-auto"></div><p class="mt-2 text-gray-600">جاري تحميل الجمعيات...</p></div>';
      
      try {
        // changed: removed status=pending from the API call
        const res = await axios.get(`${assocApi}?page=1&pageSize=5`);
        const data = res.data;
        if (!Array.isArray(data.data)) throw new Error();
        container.innerHTML = data.data.map(renderAssociationCard).join('');
      } catch (e) {
        container.innerHTML = '<div class="col-span-full text-center py-8 text-red-500">⚠️ لا توجد جمعيات.</div>';
      }
    }
    
    // Create Association
    function openCreateAssociationModal() { 
      document.getElementById('createAssociationModal').classList.remove('hidden');
    }
    
    function closeCreateAssociationModal() { 
      document.getElementById('createAssociationModal').classList.add('hidden'); 
    }
    
    document.getElementById('createAssociationForm').onsubmit = async e => {
      e.preventDefault();
      const form = e.target; 
      const body = Object.fromEntries(new FormData(form));
      body.monthlyAmount = +body.monthlyAmount; 
      body.duration = +body.duration;
      
      try {
        await axios.post(assocApi, body);
        closeCreateAssociationModal(); 
        loadAssociations();
      } catch (error) {
        alert('حدث خطأ أثناء إنشاء الجمعية');
      }
    };
    
    // Edit Association
    function openEditAssociationModal(id, amount, duration, status) {
      const form = document.getElementById('editAssociationForm');
      form.id.value=id; 
      form.monthlyAmount.value=amount; 
      form.duration.value=duration; 
      form.status.value=status;
      document.getElementById('editAssociationModal').classList.remove('hidden');
    }
    
    function closeEditAssociationModal() { 
      document.getElementById('editAssociationModal').classList.add('hidden'); 
    }
    
    document.getElementById('editAssociationForm').onsubmit = async e => {
      e.preventDefault(); 
      const form=e.target; 
      const id=form.id.value;
      const body={ 
        monthlyAmount: +form.monthlyAmount.value, 
        duration: +form.duration.value, 
        status: form.status.value 
      };
      
      try {
        await axios.put(`${assocApi}/${id}`, body);
        closeEditAssociationModal(); 
        loadAssociations();
      } catch (error) {
        alert('حدث خطأ أثناء تعديل الجمعية');
      }
    };
    
    // Delete Association
    function openDeleteAssociationModal(id) { 
      document.getElementById('deleteAssocId').value=id; 
      document.getElementById('deleteAssociationModal').classList.remove('hidden'); 
    }
    
    function closeDeleteAssociationModal() { 
      document.getElementById('deleteAssociationModal').classList.add('hidden'); 
    }
    
    async function confirmDeleteAssociation() {
      const id=document.getElementById('deleteAssocId').value;
      try {
        await axios.delete(`${assocApi}/${id}`);
        closeDeleteAssociationModal(); 
        loadAssociations();
      } catch (error) {
        alert('حدث خطأ أثناء حذف الجمعية');
      }
    }
    
    // Create User Modal
    function openCreateUserModal() {
      document.getElementById('createUserModal').classList.remove('hidden');
    }
    
    function closeCreateUserModal() {
      document.getElementById('createUserModal').classList.add('hidden');
    }
    
    document.getElementById('createUserForm').onsubmit = async e => {
      e.preventDefault();
      const form = e.target;
      const body = Object.fromEntries(new FormData(form));
    
      try {
        const res = await axios.post(createuserApi, body);
        if (res.data.message === "User created successfully") {
          alert("تم إنشاء المستخدم بنجاح");
          closeCreateUserModal();
          form.reset();
          loadUsers();
        }
      } catch (error) {
        console.error(error);
        alert("حدث خطأ أثناء إنشاء المستخدم");
      }
    };
    
    // Users logic
    function renderUserRow(user, index) {
      const waNumber = user.phone.startsWith('0')
        ? '+20' + user.phone.slice(1)
        : user.phone;
    
      const salarySlipCell = user.salarySlipImage
        ? `<button onclick="openApproveProfileModal(${user.id})" class="action-btn bg-blue-600 text-white">مراجعة المستند</button>`
        : '—';
    
      return `
        <tr class="hover:bg-gray-50" data-user-id="${user.id}">
          <td class="px-4 py-3 text-sm whitespace-nowrap">${index + 1}</td>
          <td class="px-4 py-3 text-sm whitespace-nowrap">
            <a href="#" onclick="openUserDetailsModal(${user.id}); return false;" class="text-[#129990] font-medium hover:underline">
              ${user.fullName}
            </a>
          </td>
          <td class="px-4 py-3 text-sm whitespace-nowrap">${user.nationalId}</td>
          <td class="px-4 py-3 text-sm whitespace-nowrap">${user.phone}</td>
          <td class="px-4 py-3 text-sm whitespace-nowrap text-center">
            <a class="inline-block" href="https://wa.me/${waNumber}" target="_blank" title="أرسل رسالة واتساب">
              <i class="bi bi-whatsapp text-green-600 text-xl"></i>
            </a>
          </td>
          <td class="px-4 py-3 text-sm whitespace-nowrap">${user.walletBalance}</td>
          <td class="px-4 py-3 text-sm whitespace-nowrap">${user.role}</td>
          <td class="px-4 py-3 text-sm whitespace-nowrap">${new Date(user.createdAt).toLocaleDateString('ar-EG')}</td>
          <td class="px-4 py-3 text-sm whitespace-nowrap">${salarySlipCell}</td>
        </tr>
      `;
    }
    
    let usersAutoRefreshInterval = null;
    
    // Load users
    async function loadUsers() {
      document.getElementById('contentContainer').innerHTML = document.getElementById('usersTemplate').innerHTML;
      const container = document.getElementById('usersContainer');
      container.innerHTML = '<tr><td colspan="9" class="text-center p-6"><div class="loading-spinner mx-auto"></div><p class="mt-2 text-gray-600">جاري تحميل المستخدمين...</p></td></tr>';
      
      // Clear any previous interval
      if (usersAutoRefreshInterval) clearInterval(usersAutoRefreshInterval);
      
      // First load
      await fetchAndRenderUsers();
      
      // Auto refresh every 10 seconds
      usersAutoRefreshInterval = setInterval(fetchAndRenderUsers, 10000);
    }
    
    async function fetchAndRenderUsers() {
      try {
        const container = document.getElementById('usersContainer');
        if (!container) return;
        
        const res = await axios.get(usersApi);
        let users = res.data;
    
        // If API returns {data: [...]}
        if (users && users.data && Array.isArray(users.data)) {
          users = users.data;
        }
    
        if (!users || users.length === 0) {
          container.innerHTML = '<tr><td colspan="9" class="text-center p-6 text-gray-500">لا يوجد مستخدمين</td></tr>';
          return;
        }
        
        container.innerHTML = users.map((u, i) => renderUserRow(u, i)).join('');
      } catch (err) {
        console.error('خطأ في جلب المستخدمين:', err);
        const container = document.getElementById('usersContainer');
        if (container) {
          container.innerHTML = '<tr><td colspan="9" class="text-center p-6 text-red-500">فشل تحميل المستخدمين</td></tr>';
        }
      }
    }
    
    // --- Members logic ---
    function renderMemberRow(member, index) {
      return `
        <tr class="hover:bg-gray-50">
          <td class="px-4 py-3 text-sm text-center">${index + 1}</td>
          <td class="px-4 py-3 text-sm">${member.name}</td>
          <td class="px-4 py-3 text-sm">${member.phone}</td>
          <td class="px-4 py-3 text-sm text-center">
            ${member.hasReceived ? '<span class="text-green-600 font-bold">نعم</span>' : '<span class="text-gray-500">لا</span>'}
          </td>
          <td class="px-4 py-3 text-sm text-center">
            ${member.lastReceivedDate ? new Date(member.lastReceivedDate).toLocaleDateString('ar-EG') : '—'}
          </td>
        </tr>
      `;
    }
    
    // Load members for a specific association
    async function loadMembers(assocId) {
      document.getElementById('contentContainer').innerHTML = document.getElementById('membersTemplate').innerHTML;
      const container = document.getElementById('membersContainer');
      container.innerHTML = '<tr><td colspan="5" class="text-center p-6"><div class="loading-spinner mx-auto"></div><p class="mt-2 text-gray-600">جاري تحميل الأعضاء...</p></td></tr>';
    
      try {
        const res = await axios.get(`https://api.technologytanda.com/api/associations/${assocId}/members`);
        const members = res.data && Array.isArray(res.data.data) ? res.data.data : [];
        
        if (members.length === 0) {
          container.innerHTML = '<tr><td colspan="5" class="text-center p-6 text-gray-500">لا يوجد أعضاء في هذه الجمعية</td></tr>';
          return;
        }
        
        container.innerHTML = members.map((m, i) => renderMemberRow(m, i)).join('');
      } catch (err) {
        container.innerHTML = '<tr><td colspan="5" class="text-center p-6 text-red-500">فشل تحميل الأعضاء</td></tr>';
      }
    }
    
    // --- Modal functions ---
    async function openAddMemberModal(assocId) {
      document.getElementById('addMemberAssocId').value = assocId;
      document.getElementById('addMemberUserId').value = '';
      document.getElementById('addMemberError').textContent = '';
      document.getElementById('addMemberFeeInfo').textContent = '';
      
      const select = document.getElementById('addMemberTurnNumber');
      select.innerHTML = `<option value="">جاري تحميل الأدوار...</option>`;
      
      document.getElementById('addMemberModal').classList.remove('hidden');
    
      try {
        const res = await axios.get(`https://api.technologytanda.com/api/associations/${assocId}/available-turns`);
        const turns = res.data && res.data.availableTurns ? res.data.availableTurns : [];
        
        if (turns.length === 0) {
          select.innerHTML = `<option value="">لا يوجد أدوار متاحة</option>`;
        } else {
          select.innerHTML = `<option value="">اختر الدور...</option>` +
            turns.map(t =>
              `<option value="${t.turnNumber}" data-fee="${t.feeAmount}" data-percent="${t.feePercent}" data-cat="${t.category}">
                الدور ${t.turnNumber} - الرسوم: ${t.feeAmount} (${t.feePercent * 100}%) - ${t.category}
              </option>`
            ).join('');
        }
      } catch (err) {
        select.innerHTML = `<option value="">تعذر تحميل الأدوار</option>`;
      }
    }
    
    function closeAddMemberModal() {
      document.getElementById('addMemberModal').classList.add('hidden');
    }
    
    document.getElementById('addMemberForm').onsubmit = async e => {
      e.preventDefault();
      const assocId = document.getElementById('addMemberAssocId').value;
      const userId = document.getElementById('addMemberUserId').value;
      const turnNumber = document.getElementById('addMemberTurnNumber').value;
      
      try {
        await axios.post(`https://api.technologytanda.com/api/associations/${assocId}/add-user`, {
          userId,
          turnNumber
        });
        alert('تم إضافة العضو بنجاح');
        closeAddMemberModal();
      } catch (error) {
        document.getElementById('addMemberError').textContent = 'حدث خطأ أثناء إضافة العضو';
      }
    };
    
    // --- Topup Modal logic ---
    async function openTopupModal() {
      document.getElementById('topupAmount').value = '';
      document.getElementById('topupError').textContent = '';
      document.getElementById('topupSuccess').textContent = '';
      document.getElementById('topupUserBalance').textContent = '';
      
      const select = document.getElementById('topupUserSelect');
      select.innerHTML = `<option value="">جاري التحميل...</option>`;
      
      document.getElementById('topupModal').classList.remove('hidden');
    
      try {
        const res = await axios.get('https://api.technologytanda.com/api/userData/users');
        const users = Array.isArray(res.data) ? res.data : (res.data.data || []);
        
        if (users.length === 0) {
          select.innerHTML = `<option value="">لا يوجد مستخدمين</option>`;
        } else {
          select.innerHTML = `<option value="">اختر المستخدم...</option>` +
            users.map(u =>
              `<option value="${u.id}" data-balance="${u.walletBalance}">
                ${u.fullName} (${u.phone}) - الرصيد: ${u.walletBalance}
              </option>`
            ).join('');
        }
      } catch (err) {
        select.innerHTML = `<option value="">تعذر تحميل المستخدمين</option>`;
      }
    }
    
    function closeTopupModal() {
      document.getElementById('topupModal').classList.add('hidden');
    }
    
    document.getElementById('topupForm').onsubmit = async e => {
      e.preventDefault();
      const select = document.getElementById('topupUserSelect');
      const userId = select.value;
      const amount = +document.getElementById('topupAmount').value;
      const errorDiv = document.getElementById('topupError');
      const successDiv = document.getElementById('topupSuccess');
      
      errorDiv.textContent = '';
      successDiv.textContent = '';
      
      if (!userId) {
        errorDiv.textContent = 'اختر مستخدم أولاً';
        return;
      }
      
      try {
        const res = await axios.post('https://api.technologytanda.com/api/payments/topup', { userId, amount });
        
        if (res.data && res.data.success) {
          successDiv.textContent = res.data.message + ` (الرصيد الجديد: ${res.data.newBalance.val})`;
          select.options[select.selectedIndex].setAttribute('data-balance', res.data.newBalance.val);
          document.getElementById('topupUserBalance').textContent = `الرصيد الحالي: ${res.data.newBalance.val}`;
          updateUserBalanceInTable(userId, res.data.newBalance.val);
        } else {
          throw new Error('فشل الشحن');
        }
      } catch (err) {
        errorDiv.textContent = 'حدث خطأ أثناء الشحن';
      }
    };
    
    // --- Notification Modal logic ---
    async function openNotificationModal() {
      document.getElementById('notificationMessage').value = '';
      document.getElementById('notificationError').textContent = '';
      document.getElementById('notificationSuccess').textContent = '';
      
      const select = document.getElementById('notificationUserSelect');
      select.innerHTML = `<option value="">جاري التحميل...</option>`;
      
      document.getElementById('notificationModal').classList.remove('hidden');
    
      try {
        const res = await axios.get('https://api.technologytanda.com/api/userData/users');
        const users = Array.isArray(res.data) ? res.data : (res.data.data || []);
        
        if (users.length === 0) {
          select.innerHTML = `<option value="">لا يوجد مستخدمين</option>`;
        } else {
          select.innerHTML = `<option value="">اختر المستخدم...</option>` +
            users.map(u =>
              `<option value="${u.id}">${u.fullName} (${u.phone})</option>`
            ).join('');
        }
      } catch (err) {
        select.innerHTML = `<option value="">تعذر تحميل المستخدمين</option>`;
      }
    }
    
    function closeNotificationModal() {
      document.getElementById('notificationModal').classList.add('hidden');
    }
    
    document.getElementById('notificationForm').onsubmit = async e => {
      e.preventDefault();
      const userId = document.getElementById('notificationUserSelect').value;
      const message = document.getElementById('notificationMessage').value.trim();
      const errorDiv = document.getElementById('notificationError');
      const successDiv = document.getElementById('notificationSuccess');
      
      errorDiv.textContent = '';
      successDiv.textContent = '';
      
      if (!userId || !message) {
        errorDiv.textContent = 'اختر مستخدم وأدخل نص الإشعار';
        return;
      }
      
      try {
        await axios.post('https://api.technologytanda.com/api/userData/notifications', {
          userId,
          message
        });
        
        successDiv.textContent = 'تم إرسال الإشعار بنجاح';
        document.getElementById('notificationForm').reset();
      } catch (err) {
        errorDiv.textContent = 'حدث خطأ أثناء إرسال الإشعار';
      }
    };
    
    // --- Approve Profile Modal ---
    async function openApproveProfileModal(userId) {
      window._currentApproveUserId = userId;
      document.getElementById('profileApproveError').textContent = '';
      document.getElementById('rejectReasonContainer').classList.add('hidden');
      document.getElementById('rejectReasonInput').value = '';
      document.getElementById('profileImageContainer').innerHTML = 'جاري التحميل...';
      
      document.getElementById('approveProfileModal').classList.remove('hidden');
    
      try {
        const res = await axios.get(`https://api.technologytanda.com/api/userData/users/${userId}`);
        const user = res.data;
        
        if (user && user.salarySlipImage) {
          let imgUrl = user.salarySlipImage;
          if (!/^https?:\/\//.test(imgUrl)) {
            imgUrl = 'https://api.technologytanda.com/api/userData/uploads/' + imgUrl.replace(/^.*[\\/]/, '');
          }
          
          document.getElementById('profileImageContainer').innerHTML = `
            <img src="${imgUrl}" alt="مستند الراتب" class="mx-auto max-h-64 rounded mb-2"/>
            <div class="font-medium">${user.fullName || ''}</div>
          `;
        } else {
          document.getElementById('profileImageContainer').innerHTML = 'لا يوجد مستند مرفوع';
        }
      } catch (error) {
        document.getElementById('profileImageContainer').innerHTML = 'تعذر تحميل بيانات المستخدم';
      }
    }
    
    function closeApproveProfileModal() {
      document.getElementById('approveProfileModal').classList.add('hidden');
      window._currentApproveUserId = null;
    }
    
    function handleApproveProfileAction(approved) {
      if (approved === false) {
        document.getElementById('rejectReasonContainer').classList.remove('hidden');
        return;
      }
      
      approveProfile(approved);
    }
    
    async function approveProfile(approved) {
      try {
        const userId = window._currentApproveUserId;
        if (!userId) return;
        
        const reason = approved ? '' : document.getElementById('rejectReasonInput').value || '';
        
        const res = await axios.post(
          `https://api.technologytanda.com/api/userData/admin/approve-profile/${userId}`,
          { approved, reason }
        );
        
        if (res.data && res.data.message) {
          alert(res.data.message);
          closeApproveProfileModal();
          if (fetchAndRenderUsers) fetchAndRenderUsers();
        }
      } catch (err) {
        document.getElementById('profileApproveError').textContent = 'حدث خطأ أثناء مراجعة المستند';
      }
    }
    
    // --- User Details Modal ---
    async function openUserDetailsModal(userId) {
      document.getElementById('userDetailsModal').classList.remove('hidden');
      document.getElementById('userDetailsContent').innerHTML = `
        <div class="text-center">
          <div class="loading-spinner mx-auto"></div>
          <p>جاري تحميل بيانات المستخدم...</p>
        </div>
      `;
      
      try {
        const res = await axios.get(`https://api.technologytanda.com/api/userData/user/${userId}/history`);
        const data = res.data;
        const user = data.user;
        
        // Format associations
        let associationsHtml = '';
        if (data.associations && data.associations.length > 0) {
          associationsHtml = data.associations.map(a => `
            <div class="history-item">
              <div class="history-item-header">${a.name}</div>
              <div class="history-item-content">
                <p>المبلغ: ${a.monthlyAmount}</p>
                <p>الحالة: ${a.status}</p>
              </div>
            </div>
          `).join('');
        } else {
          associationsHtml = '<div class="text-center p-4 text-gray-500">لا يوجد جمعيات</div>';
        }
        
        // Format transactions
        let transactionsHtml = '';
        if (data.transactions && data.transactions.length > 0) {
          transactionsHtml = data.transactions.map(t => `
            <div class="history-item">
              <div class="history-item-header">${new Date(t.createdAt).toLocaleString('ar-EG')}</div>
              <div class="history-item-content">
                <p>المبلغ: ${t.amount}</p>
                <p>النوع: ${t.type}</p>
              </div>
            </div>
          `).join('');
        } else {
          transactionsHtml = '<div class="text-center p-4 text-gray-500">لا يوجد عمليات</div>';
        }
        
        // Format profile image URL
        let profileImageUrl = '';
        if (user.profileImage) {
          if (!/^https?:\/\//.test(user.profileImage)) {
            profileImageUrl = 'https://api.technologytanda.com/api/userData/uploads/' + user.profileImage.replace(/^.*[\\/]/, '');
          } else {
            profileImageUrl = user.profileImage;
          }
        }
        
        document.getElementById('userDetailsContent').innerHTML = `
          <div class="flex flex-col md:flex-row gap-6">
            <div class="md:w-1/3">
              <div class="profile-image-container">
                ${profileImageUrl ? 
                  `<img src="${profileImageUrl}" alt="صورة المستخدم">` : 
                  `<i class="bi bi-person-circle text-5xl text-gray-400"></i>`
                }
              </div>
              
              <div class="user-actions">
                <button onclick="openTopupModalForUser(${user.id})" class="action-btn bg-green-600 text-white">
                  <i class="bi bi-wallet2"></i> شحن الرصيد
                </button>
                <button onclick="openNotificationModalForUser(${user.id})" class="action-btn bg-blue-600 text-white">
                  <i class="bi bi-bell"></i> إرسال إشعار
                </button>
              </div>
            </div>
            
            <div class="md:w-2/3">
              <div class="user-details-grid">
                <div class="user-details-card">
                  <div class="user-details-label">الاسم الكامل</div>
                  <div class="user-details-value">${user.fullName || '—'}</div>
                </div>
                
                <div class="user-details-card">
                  <div class="user-details-label">الرقم القومي</div>
                  <div class="user-details-value">${user.nationalId || '—'}</div>
                </div>
                
                <div class="user-details-card">
                  <div class="user-details-label">الهاتف</div>
                  <div class="user-details-value">${user.phone || '—'}</div>
                </div>
                
                <div class="user-details-card">
                  <div class="user-details-label">العنوان</div>
                  <div class="user-details-value">${user.address || '—'}</div>
                </div>
                
                <div class="user-details-card">
                  <div class="user-details-label">الرصيد</div>
                  <div class="user-details-value">${user.walletBalance || 0}</div>
                </div>
                
                <div class="user-details-card">
                  <div class="user-details-label">الدور</div>
                  <div class="user-details-value">${user.role || '—'}</div>
                </div>
                
                <div class="user-details-card">
                  <div class="user-details-label">حالة الملف الشخصي</div>
                  <div class="user-details-value">
                    ${user.profileApproved ? 
                      '<span class="text-green-600 font-medium">مقبول</span>' : 
                      '<span class="text-yellow-600 font-medium">غير مقبول</span>'
                    }
                  </div>
                </div>
                
                <div class="user-details-card">
                  <div class="user-details-label">سبب الرفض</div>
                  <div class="user-details-value">${user.profileRejectedReason || '—'}</div>
                </div>
              </div>
              
              <div class="history-card">
                <h3 class="font-bold text-lg mb-3">الجمعيات المشارك فيها</h3>
                <div class="max-h-40 overflow-y-auto">
                  ${associationsHtml}
                </div>
              </div>
              
              <div class="history-card">
                <h3 class="font-bold text-lg mb-3">عمليات الرصيد</h3>
                <div class="max-h-40 overflow-y-auto">
                  ${transactionsHtml}
                </div>
              </div>
            </div>
          </div>
        `;
      } catch (error) {
        console.error('خطأ في جلب بيانات المستخدم:', error);
        document.getElementById('userDetailsContent').innerHTML = `
          <div class="text-red-500 text-center p-6">
            فشل تحميل بيانات المستخدم. الرجاء المحاولة مرة أخرى.
          </div>
        `;
      }
    }
    
    function closeUserDetailsModal() {
      document.getElementById('userDetailsModal').classList.add('hidden');
    }
    
    function openTopupModalForUser(userId) {
      closeUserDetailsModal();
      setTimeout(() => {
        openTopupModal();
        document.getElementById('topupUserSelect').value = userId;
        document.getElementById('topupUserSelect').dispatchEvent(new Event('change'));
      }, 300);
    }
    
    function openNotificationModalForUser(userId) {
      closeUserDetailsModal();
      setTimeout(() => {
        openNotificationModal();
        document.getElementById('notificationUserSelect').value = userId;
      }, 300);
    }
    
    // --- Helper functions ---
    function updateUserBalanceInTable(userId, newBalance) {
      const rows = document.querySelectorAll('#usersContainer tr');
      rows.forEach(row => {
        if (row.getAttribute('data-user-id') == userId) {
          const balanceTd = row.querySelectorAll('td')[5];
          if (balanceTd) balanceTd.textContent = newBalance;
        }
      });
    }
    
    // Expose functions to window
    window.loadAssociations = loadAssociations;
    window.openCreateAssociationModal = openCreateAssociationModal;
    window.closeCreateAssociationModal = closeCreateAssociationModal;
    window.openEditAssociationModal = openEditAssociationModal;
    window.closeEditAssociationModal = closeEditAssociationModal;
    window.openDeleteAssociationModal = openDeleteAssociationModal;
    window.closeDeleteAssociationModal = closeDeleteAssociationModal;
    window.confirmDeleteAssociation = confirmDeleteAssociation;
    window.openCreateUserModal = openCreateUserModal;
    window.closeCreateUserModal = closeCreateUserModal;
    window.loadUsers = loadUsers;
    window.loadMembers = loadMembers;
    window.openAddMemberModal = openAddMemberModal;
    window.closeAddMemberModal = closeAddMemberModal;
    window.openTopupModal = openTopupModal;
    window.closeTopupModal = closeTopupModal;
    window.openNotificationModal = openNotificationModal;
    window.closeNotificationModal = closeNotificationModal;
    window.openApproveProfileModal = openApproveProfileModal;
    window.closeApproveProfileModal = closeApproveProfileModal;
    window.handleApproveProfileAction = handleApproveProfileAction;
    window.openUserDetailsModal = openUserDetailsModal;
    window.closeUserDetailsModal = closeUserDetailsModal;
    window.openTopupModalForUser = openTopupModalForUser;
    window.openNotificationModalForUser = openNotificationModalForUser;
    
    // Initialize event listeners
    document.addEventListener('DOMContentLoaded', () => {
      // Add Member Turn Number change event
      const addMemberTurnSelect = document.getElementById('addMemberTurnNumber');
      if (addMemberTurnSelect) {
        addMemberTurnSelect.onchange = function() {
          const opt = addMemberTurnSelect.options[addMemberTurnSelect.selectedIndex];
          const fee = opt.getAttribute('data-fee');
          const percent = opt.getAttribute('data-percent');
          const cat = opt.getAttribute('data-cat');
          
          if (fee !== null && percent !== null && cat !== null && addMemberTurnSelect.value) {
            document.getElementById('addMemberFeeInfo').textContent = `الرسوم: ${fee} (${percent * 100}%) - الفئة: ${cat}`;
          } else {
            document.getElementById('addMemberFeeInfo').textContent = '';
          }
        };
      }
      
      // Topup User Select change event
      const topupUserSelect = document.getElementById('topupUserSelect');
      if (topupUserSelect) {
        topupUserSelect.onchange = function() {
          const opt = topupUserSelect.options[topupUserSelect.selectedIndex];
          const balance = opt.getAttribute('data-balance');
          document.getElementById('topupUserBalance').textContent = (balance !== null && topupUserSelect.value) ? `الرصيد الحالي: ${balance}` : '';
        };
      }
      
      // Close modals when clicking outside
      const modals = document.querySelectorAll('.modal-overlay');
      modals.forEach(modal => {
        modal.addEventListener('click', e => {
          if (e.target === modal) {
            modal.classList.add('hidden');
          }
        });
      });
    });
