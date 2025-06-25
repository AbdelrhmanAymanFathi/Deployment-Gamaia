// التحقق من وجود التوكن
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = 'login.html';
}

// جلب بيانات الملف شخصي
async function loadProfile() {
  try {
    const res = await fetch('http://localhost:3000/api/userData/profile', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || 'فشل جلب الملف الشخصي');

    document.getElementById('full-name').textContent = data.fullName;
    document.getElementById('national-id').textContent = data.nationalId;
    document.getElementById('phone').textContent = data.phone;

    const imgEl = document.getElementById('profile-image');
    const placeholder = 'https://via.placeholder.com/150?text=User';
    if (data.profileImage) {
      const fileName = data.profileImage.split(/[\\/]/).pop();
      imgEl.src = `http://localhost:3000/api/userData/uploads/${fileName}`;
    } else {
      imgEl.src = placeholder;
    }
  } catch (err) {
    console.error(err);
    alert('❌ ' + err.message);
  }
}

// تكبير الصورة عند الضغط
const imgEl = document.getElementById('profile-image');
const overlay = document.getElementById('img-overlay');
const largeImg = document.getElementById('img-large');
imgEl.addEventListener('click', () => {
  largeImg.src = imgEl.src;
  overlay.classList.remove('hidden');
});
overlay.addEventListener('click', () => overlay.classList.add('hidden'));

// تسجيل الخروج
document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
});

document.addEventListener('DOMContentLoaded', loadProfile);
document.addEventListener('DOMContentLoaded', loadProfile);

// ملاحظة: يجب تعديل userId حسب التطبيق الفعلي
let userId = null;
try {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.id) userId = user.id;
} catch {}
if (!userId) {
  alert('تعذر تحديد رقم المستخدم. يرجى إعادة تسجيل الدخول.');
  return;
}
const res = await fetch(`http://localhost:3000/api/userData/admin/update-user/${userId}`, {
