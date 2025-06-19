// تحقق من وجود التوكن في الأعلى
let token = localStorage.getItem('token');
if (!token) {
  window.location.href = 'index.html'; // أو login.html حسب نظامك
}
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// --- Main logic (keep only one copy of each function/const) ---

const assocApi = 'http://localhost:3000/api/associations';
const userApi = 'http://localhost:3000/api/admin/create-user';
const createuserApi = "http://localhost:3000/api/userData/admin/create-user";
const usersApi = 'http://localhost:3000/api/userData/users'; // Users endpoint

// Render helper
function renderAssociationCard(assoc) {
  return `
    <div class="bg-white p-4 rounded-lg shadow space-y-2 flex flex-col">
      <h3 class="font-bold text-lg">${assoc.name}</h3>
      <!-- بيانات الجمعية -->
      <p>المبلغ الشهري: ${assoc.monthlyAmount}</p>
      <p>المدة: ${assoc.duration} ${assoc.type}</p>
      <p>الحالة: ${assoc.status}</p>
      <p>الحد الأقصى للأعضاء: ${assoc.maxMembers}</p>
      <!-- أزرار -->
      <div class="mt-auto flex flex-wrap gap-2 justify-between rtl:space-x-reverse">
        <button onclick="openEditAssociationModal(${assoc.id}, ${assoc.monthlyAmount}, ${assoc.duration}, '${assoc.status}')"
                class="text-blue-600 hover:underline">تعديل</button>
        <button onclick="openDeleteAssociationModal(${assoc.id})"
                class="text-red-600 hover:underline">حذف</button>
        <button onclick="loadMembers(${assoc.id})"
                class="text-green-600 hover:underline">عرض الأعضاء</button>
        <button onclick="openAddMemberModal(${assoc.id})"
                class="text-indigo-600 hover:underline">إضافة عضو</button>
      </div>
    </div>
  `;
}

// Load associations
async function loadAssociations() {
  document.getElementById('contentContainer').innerHTML = document.getElementById('associationsTemplate').innerHTML;
  try {
    const res = await axios.get(`${assocApi}?page=1&pageSize=5&status=pending`);
    const data = res.data;
    if (!Array.isArray(data.data)) throw new Error();
    const container = document.getElementById('associationsContainer');
    container.innerHTML = data.data.map(renderAssociationCard).join('');
  } catch (e) {
    document.getElementById('associationsContainer').innerHTML = `<div class="text-red-500 p-4">⚠️ لا توجد جمعيات.</div>`;
  }
}

// Create Association
function openCreateAssociationModal() { 
  document.getElementById('createAssociationModal').classList.remove('hidden');
  document.getElementById('createAssociationModal').classList.add('flex'); 
}
function closeCreateAssociationModal() { 
  document.getElementById('createAssociationModal').classList.add('hidden'); 
}
document.getElementById('createAssociationForm').onsubmit = async e => {
  e.preventDefault();
  const form = e.target; const body = Object.fromEntries(new FormData(form));
  body.monthlyAmount = +body.monthlyAmount; body.duration = +body.duration;
  await axios.post(assocApi, body);
  closeCreateAssociationModal(); loadAssociations();
};

// Edit Association
function openEditAssociationModal(id, amount, duration, status) {
  const form = document.getElementById('editAssociationForm');
  form.id.value=id; form.monthlyAmount.value=amount; form.duration.value=duration; form.status.value=status;
  document.getElementById('editAssociationModal').classList.remove('hidden');
   document.getElementById('editAssociationModal').classList.add('flex');
}
function closeEditAssociationModal() { 
  document.getElementById('editAssociationModal').classList.add('hidden'); 
}
document.getElementById('editAssociationForm').onsubmit = async e => {
  e.preventDefault(); const form=e.target; const id=form.id.value;
  const body={ monthlyAmount:+form.monthlyAmount.value, duration:+form.duration.value, status:form.status.value };
  await axios.put(`${assocApi}/${id}`, body);
  closeEditAssociationModal(); loadAssociations();
};

// Delete Association
function openDeleteAssociationModal(id) { 
  document.getElementById('deleteAssocId').value=id; 
  document.getElementById('deleteAssociationModal').classList.remove('hidden'); 
  document.getElementById('deleteAssociationModal').classList.add('flex'); 
}
function closeDeleteAssociationModal() { 
  document.getElementById('deleteAssociationModal').classList.add('hidden'); 
}
async function confirmDeleteAssociation() {
  const id=document.getElementById('deleteAssocId').value;
  await axios.delete(`${assocApi}/${id}`);
  closeDeleteAssociationModal(); loadAssociations();
}

// Create User Modal
function openCreateUserModal() {
  document.getElementById('createUserModal').classList.remove('hidden');
  document.getElementById('createUserModal').classList.add('flex');
}
function closeCreateUserModal() {
  document.getElementById('createUserModal').classList.remove('flex');
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
      // Optional: إعادة تحميل البيانات من السيرفر لعرضها في الجدول
    }
  } catch (error) {
    console.error(error);
    alert("حدث خطأ أثناء إنشاء المستخدم");
  }
};

// Users logic
function renderUserRow(user, index) {
  // تأكد إن رقم التليفون بصيغة دولية بدون +، مثلاً: "2010XXXXXXX"
  const waNumber = user.phone.startsWith('0')
    ? '+20' + user.phone.slice(1)        // لو عندك أرقام محلية تبدأ بـ0 شيلها وحط 2 (كود مصر)
    : user.phone;                     // لو بالفعل دولي

  // مستند الراتب: زر مراجعة إذا موجود
  const salarySlipCell = user.salarySlipImage
    ? `<button onclick="openApproveProfileModal(${user.id})" class="bg-blue-500 text-white px-2 py-1 rounded">مراجعة المستند</button>`
    : '—';

  return `
    <tr class="border-t" data-user-id="${user.id}">
      <td class="px-4 py-2 text-sm  whitespace-nowrap">${index + 1}</td>
      <td class="px-4 py-2 text-sm  whitespace-nowrap">${user.fullName}</td>
      <td class="px-4 py-2 text-sm  whitespace-nowrap">${user.nationalId}</td>
      <td class="px-4 py-2 text-sm  whitespace-nowrap">${user.phone}</td>
      <td class="px-4 py-2 text-sm  whitespace-nowrap text-center text-green-600">
        <a class="text-center" href="https://wa.me/${waNumber}" target="_blank" title="أرسل رسالة واتساب">
          <!-- أيقونة واتساب بسيطة -->
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 inline-block" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.67 13.412c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.149-.672.149-.198.297-.767.967-.94 1.165-.173.198-.346.223-.643.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.173.198-.297.297-.495.099-.198.05-.372-.025-.52-.074-.149-.672-1.612-.92-2.21-.242-.579-.487-.5-.672-.51l-.572-.01c-.198 0-.52.074-.793.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.075c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.288.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 .5C5.648.5.5 5.648.5 12c0 2.115.552 4.09 1.513 5.81L.5 23.5l5.924-1.55A11.457 11.457 0 0012 23.5c6.352 0 11.5-5.148 11.5-11.5S18.352.5 12 .5zm0 21c-1.795 0-3.483-.467-4.96-1.353l-.354-.21-3.515.92.938-3.43-.229-.365A9.436 9.436 0 012.5 12c0-5.242 4.258-9.5 9.5-9.5s9.5 4.258 9.5 9.5-4.258 9.5-9.5 9.5z"/>
          </svg>
        </a>
      </td>
      <td class="px-4 py-2 text-sm  whitespace-nowrap">${user.walletBalance}</td>
      <td class="px-4 py-2 text-sm  whitespace-nowrap">${user.role}</td>
      <td class="px-4 py-2 text-sm  whitespace-nowrap">${new Date(user.createdAt).toLocaleDateString('ar-EG')}</td>
      <td class="px-4 py-2 text-sm  whitespace-nowrap">${salarySlipCell}</td>
    </tr>
  `;
}

// تحديث الرصيد في جدول المستخدمين مباشرة بعد الشحن (اختياري)
function updateUserBalanceInTable(userId, newBalance) {
  const rows = document.querySelectorAll('#usersContainer tr');
  rows.forEach(row => {
    if (row.getAttribute('data-user-id') == userId) {
      const balanceTd = row.querySelectorAll('td')[5];
      if (balanceTd) balanceTd.textContent = newBalance;
    }
  });
}

let usersAutoRefreshInterval = null;

// دالة لجلب وعرض المستخدمين
async function loadUsers() {
  document.getElementById('contentContainer').innerHTML =
    document.getElementById('usersTemplate').innerHTML;

  // clear any previous interval
  if (usersAutoRefreshInterval) clearInterval(usersAutoRefreshInterval);

  // أول تحميل مباشر
  await fetchAndRenderUsers();

  // auto refresh كل 10 ثواني
  usersAutoRefreshInterval = setInterval(fetchAndRenderUsers, 10000);
}

async function fetchAndRenderUsers() {
  try {
    const container = document.getElementById('usersContainer');
    if (!container) {
      // إذا لم يوجد العنصر، لا تكمل الدالة (يحصل لو لم يتم تحميل usersTemplate)
      return;
    }
    const res = await axios.get(usersApi);
    let users = res.data;

    // إذا كان الـ API يرجع {data: [...]}
    if (users && users.data && Array.isArray(users.data)) {
      users = users.data;
    }

    if (!users || users.length === 0) {
      container.innerHTML =
        `<tr><td colspan="9" class="text-center p-4 text-red-500">لا يوجد مستخدمين</td></tr>`;
      return;
    }
    container.innerHTML = users
      .map((u, i) => renderUserRow(u, i))
      .join('');
  } catch (err) {
    console.error('خطأ في جلب المستخدمين:', err);
    const container = document.getElementById('usersContainer');
    if (container)
      container.innerHTML =
        `<tr><td colspan="9" class="text-center p-4 text-red-500">فشل تحميل المستخدمين</td></tr>`;
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = 'index.html';
    }
  }
}

// --- Members logic ---

// Render a member row for the members table
function renderMemberRow(member, index) {
  return `
    <tr class="border-t">
      <td class="px-4 py-2 text-center">${index + 1}</td>
      <td class="px-4 py-2">${member.name}</td>
      <td class="px-4 py-2">${member.phone}</td>
      <td class="px-4 py-2 text-center">
        ${member.hasReceived ? '<span class="text-green-600 font-bold">نعم</span>' : '<span class="text-gray-500">لا</span>'}
      </td>
      <td class="px-4 py-2 text-center">
        ${member.lastReceivedDate ? new Date(member.lastReceivedDate).toLocaleDateString('ar-EG') : '—'}
      </td>
    </tr>
  `;
}

// Load members for a specific association
async function loadMembers(assocId) {
  // Swap to members template
  document.getElementById('contentContainer').innerHTML =
    document.getElementById('membersTemplate').innerHTML;

  const container = document.getElementById('membersContainer');
  container.innerHTML = '<tr><td colspan="5" class="text-center p-4">جاري التحميل...</td></tr>';

  try {
    const res = await axios.get(`http://localhost:3000/api/associations/${assocId}/members`);
    const members = res.data && Array.isArray(res.data.data) ? res.data.data : [];
    if (members.length === 0) {
      container.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-red-500">لا يوجد أعضاء في هذه الجمعية</td></tr>';
      return;
    }
    container.innerHTML = members.map((m, i) => renderMemberRow(m, i)).join('');
  } catch (err) {
    container.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-red-500">فشل تحميل الأعضاء</td></tr>';
  }
}

/**
 * إضافة مستخدم إلى جمعية
 * @param {number} assocId - رقم الجمعية
 * @param {number} userId - رقم المستخدم
 * @param {number} turnNumber - رقم الدور
 */
async function addUserToAssociation(assocId, userId, turnNumber) {
  try {
    const res = await axios.post(`http://localhost:3000/api/associations/${assocId}/add-user`, {
      userId,
      turnNumber
    });
    if (res.data && res.data.success) {
      alert(res.data.message + `\nالمبلغ: ${res.data.fee.feeAmount} (${res.data.fee.feePercent * 100}%)\nالمتبقي: ${res.data.membership.remainingAmount}`);
    } else {
      alert('فشل إضافة المستخدم للجمعية');
    }
  } catch (err) {
    alert('حدث خطأ أثناء إضافة المستخدم للجمعية');
    console.error(err);
  }
}

/**
 * جلب وعرض جدول الأدوار (turns)
 */
async function loadTurns() {
  // إنشاء جدول الأدوار في الـ contentContainer
  const container = document.getElementById('contentContainer');
  container.innerHTML = `
    <div class="overflow-x-auto">
      <h2 class="text-xl font-bold mb-4">جدول الأدوار</h2>
      <table class="min-w-full bg-white rounded-lg shadow text-xs sm:text-sm">
        <thead class="bg-gray-300">
          <tr>
            <th class="px-4 py-2">#</th>
            <th class="px-4 py-2">اسم الدور</th>
            <th class="px-4 py-2">تاريخ الجدولة</th>
            <th class="px-4 py-2">الرسوم</th>
            <th class="px-4 py-2">الحالة</th>
            <th class="px-4 py-2">بداية الجمعية</th>
            <th class="px-4 py-2">المبلغ الشهري</th>
          </tr>
        </thead>
        <tbody id="turnsContainer">
          <tr><td colspan="7" class="text-center p-4">جاري التحميل...</td></tr>
        </tbody>
      </table>
    </div>
  `;

  try {
    const res = await axios.get('http://localhost:3000/api/turns');
    const turns = Array.isArray(res.data) ? res.data : [];
    const tbody = document.getElementById('turnsContainer');
    if (!turns.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-red-500">لا يوجد أدوار</td></tr>`;
      return;
    }
    tbody.innerHTML = turns.map((turn, i) => `
      <tr class="border-t ${turn.taken ? 'bg-gray-100 text-gray-400' : ''}">
        <td class="px-4 py-2 text-center">${i + 1}</td>
        <td class="px-4 py-2">${turn.turnName}</td>
        <td class="px-4 py-2">${new Date(turn.scheduledDate).toLocaleDateString('ar-EG')}</td>
        <td class="px-4 py-2">${turn.feeAmount}</td>
        <td class="px-4 py-2">${turn.taken ? '<span class="text-red-500">محجوز</span>' : '<span class="text-green-600">متاح</span>'}</td>
        <td class="px-4 py-2">${turn.association && turn.association.startDate ? new Date(turn.association.startDate).toLocaleDateString('ar-EG') : '-'}</td>
        <td class="px-4 py-2">${turn.association && turn.association.monthlyAmount ? turn.association.monthlyAmount : '-'}</td>
      </tr>
    `).join('');
  } catch (err) {
    const tbody = document.getElementById('turnsContainer');
    tbody.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-red-500">فشل تحميل الأدوار</td></tr>`;
  }
}

// Expose functions to window for HTML onclick usage
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
window.addUserToAssociation = addUserToAssociation;
window.loadTurns = loadTurns;

// أضف دالة فارغة أو منطقية لـ openApproveProfileModal حتى لا يظهر الخطأ
function openApproveProfileModal(userId) {
  window._currentApproveUserId = userId;
  document.getElementById('profileApproveError').textContent = '';
  document.getElementById('rejectReasonContainer').classList.add('hidden');
  document.getElementById('rejectReasonInput').value = '';
  document.getElementById('profileImageContainer').innerHTML = 'جاري التحميل...';

  // إعداد التوكن للرابط إذا كان السيرفر يتطلب Authorization header للصور
  const token = localStorage.getItem('token');

  axios.get(`http://localhost:3000/api/userData/users`)
    .then(res => {
      const users = Array.isArray(res.data) ? res.data : (res.data.data || []);
      const user = users.find(u => u.id == userId);
      if (user && user.salarySlipImage) {
        let imgUrl = user.salarySlipImage;
        if (!/^https?:\/\//.test(imgUrl)) {
          imgUrl = 'http://localhost:3000/api/userData/uploads/' + imgUrl.replace(/^.*[\\/]/, '');
        }
        // إذا كان السيرفر يتطلب Authorization header للصور، استخدم fetch و Blob
        if (token) {
          fetch(imgUrl, {
            headers: { 'Authorization': 'Bearer ' + token }
          })
            .then(r => {
              if (!r.ok) throw new Error('Unauthorized');
              return r.blob();
            })
            .then(blob => {
              const objectUrl = URL.createObjectURL(blob);
              document.getElementById('profileImageContainer').innerHTML =
                `<img src="${objectUrl}" alt="مستند الراتب" class="mx-auto max-h-64 rounded mb-2"/><div>${user.fullName || ''}</div>`;
            })
            .catch(() => {
              document.getElementById('profileImageContainer').innerHTML = 'غير مصرح بعرض المستند (401 Unauthorized)';
            });
        } else {
          document.getElementById('profileImageContainer').innerHTML =
            `<img src="${imgUrl}" alt="مستند الراتب" class="mx-auto max-h-64 rounded mb-2"/><div>${user.fullName || ''}</div>`;
        }
      } else {
        document.getElementById('profileImageContainer').innerHTML = 'لا يوجد مستند مرفوع';
      }
    })
    .catch(() => {
      document.getElementById('profileImageContainer').innerHTML = 'تعذر تحميل بيانات المستخدم';
    });
  document.getElementById('approveProfileModal').classList.remove('hidden');
  document.getElementById('approveProfileModal').classList.add('flex');
}
window.openApproveProfileModal = openApproveProfileModal;

function closeApproveProfileModal() {
  document.getElementById('approveProfileModal').classList.remove('flex');
  document.getElementById('approveProfileModal').classList.add('hidden');
  window._currentApproveUserId = null;
}
window.closeApproveProfileModal = closeApproveProfileModal;

// زر قبول/رفض في المودال (تصحيح نهائي: لا recursion أبداً)
function handleApproveProfileAction(approved) {
  if (approved === true) {
    approveProfile(true, "");
  } else if (approved === false) {
    const reasonContainer = document.getElementById('rejectReasonContainer');
    if (reasonContainer.classList.contains('hidden')) {
      reasonContainer.classList.remove('hidden');
      return;
    }
    const reason = document.getElementById('rejectReasonInput').value.trim();
    approveProfile(false, reason);
  }
}
window.handleApproveProfileAction = handleApproveProfileAction;

// Keep approveProfile as is:
async function approveProfile(approved, reason = "") {
  try {
    const userId = window._currentApproveUserId;
    if (!userId) return;
    const res = await axios.post(
      `http://localhost:3000/api/userData/admin/approve-profile/${userId}`,
      { approved: !!approved, reason }
    );
    if (res.data && res.data.message) {
      alert(res.data.message);
      closeApproveProfileModal();
      fetchAndRenderUsers && fetchAndRenderUsers();
      // Mark user as reviewed/approved in the UI if possible
      // Example: add a class or update a status cell if available
      const row = document.querySelector(`tr[data-user-id="${userId}"]`);
      if (row) {
        // If you have a status cell, update it. Otherwise, add a visual mark.
        let statusCell = row.querySelector('.user-status-cell');
        if (statusCell) {
          statusCell.textContent = approved ? 'تمت الموافقة' : 'مرفوض';
          statusCell.classList.remove('text-gray-500', 'text-red-500', 'text-green-600');
          statusCell.classList.add(approved ? 'text-green-600' : 'text-red-500');
        } else {
          row.classList.add(approved ? 'bg-green-50' : 'bg-red-50');
        }
      }
    }
  } catch (err) {
    document.getElementById('profileApproveError').textContent = 'حدث خطأ أثناء مراجعة المستند';
  }
}

// Make sure this is NOT inside approveProfileHandler!
document.addEventListener('DOMContentLoaded', () => {
  async function approveBtnClickHandler() {
    const reasonInput = document.getElementById('reason');
    const responseMsg = document.getElementById('responseMsg');
    const approveBtn = document.getElementById('approveBtn');
    if (!reasonInput || !responseMsg || !approveBtn) {
      // Elements not found, do nothing
      return;
    }
    const userId = approveBtn.getAttribute('data-user-id');
    if (!userId) {
      responseMsg.textContent = 'User ID غير متوفر';
      return;
    }
    const reason = reasonInput.value;
    responseMsg.textContent = '';
    try {
      const res = await fetch(`http://localhost:3000/api/userData/admin/approve-profile/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true, reason })
      });
      const data = await res.json();
      if (res.ok) {
        responseMsg.textContent = data.message;
      } else {
        responseMsg.textContent = data.message || 'Error approving profile.';
      }
    } catch (err) {
      responseMsg.textContent = 'Network error.';
    }
  }

  const approveBtn = document.getElementById('approveBtn');
  if (approveBtn) {
    approveBtn.addEventListener('click', approveBtnClickHandler);
  }
});

// إرسال إشعار لمستخدم
async function sendNotification(userId, message) {
  try {
    const res = await axios.post('http://localhost:3000/api/userData/notifications', {
      userId,
      message
    });
    if (res.data && res.data.message) {
      // لا داعي لـ alert هنا لأن المودال سيعرض رسالة نجاح
      return true;
    } else {
      throw new Error('⚠️ لم يتم إرسال الإشعار');
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}
window.sendNotification = sendNotification;
window.sendNotification = sendNotification;
