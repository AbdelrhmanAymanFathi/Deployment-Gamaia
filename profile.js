// تجنب إعادة إعلان المتغير token إذا كان معرفًا بالفعل (مثل، بواسطة سكربت آخر)
if (typeof token === 'undefined') {
    var token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
    }
} else {
    if (!token) {
        window.location.href = 'login.html';
    }
}

// جلب بيانات الملف شخصي
async function loadProfile() {
    try {
        const res = await fetch('http://31.97.179.227/api/userData/profile', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error || 'فشل جلب الملف الشخصي');

        // عرض بيانات المستخدم
        document.getElementById('full-name').textContent = data.fullName;
        document.getElementById('national-id').textContent = data.nationalId;
        document.getElementById('phone').textContent = data.phone;

        // تحديث تاريخ آخر تحديث
        const now = new Date();
        document.getElementById('last-updated').textContent = now.toLocaleString('ar-SA', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // عرض الصورة الشخصية
        const imgEl = document.getElementById('profile-image');
        const placeholder = 'https://via.placeholder.com/150?text=لا+توجد+صورة';

        if (data.profileImage) {
            // إصلاح المشكلة: استخدام المسار الصحيح للصورة
            const imageUrl = `http://31.97.179.227/uploads/${data.profileImage.replace('uploads/', '')}?t=${new Date().getTime()}`;

            // تحميل الصورة أولاً للتحقق من وجودها
            const testImage = new Image();
            testImage.onload = function () {
                imgEl.src = imageUrl;
            };
            testImage.onerror = function () {
                console.log('فشل تحميل الصورة، استخدام البديل');
                imgEl.src = placeholder;
            };
            testImage.src = imageUrl;
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

// إغلاق الصورة الكبيرة
overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.classList.contains('close-btn')) {
        overlay.classList.add('hidden');
    }
});

// تسجيل الخروج
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
});

// دالة لعرض الأنشطة الأخيرة من localStorage
function renderRecentActivities() {
    const activities = JSON.parse(localStorage.getItem('activities') || '[]');
    const container = document.getElementById('recent-activities');
    if (container) {
        if (activities.length === 0) {
            container.innerHTML = `<div class="text-gray-500 text-center">لا توجد أنشطة بعد</div>`;
        } else {
            container.innerHTML = activities.map(act => {
                if (act.type === 'topup') {
                    const date = new Date(act.date);
                    const now = new Date();
                    const diffMs = now - date;
                    const diffMin = Math.floor(diffMs / 60000);
                    let timeAgo = '';
                    if (diffMin < 60) timeAgo = `منذ ${diffMin} دقيقة`;
                    else if (diffMin < 1440) timeAgo = `منذ ${Math.floor(diffMin / 60)} ساعة`;
                    else timeAgo = `منذ ${Math.floor(diffMin / 1440)} يوم`;

                    return `
                            <div class="flex flex-col sm:flex-row items-start sm:items-center p-3 bg-gray-50 rounded-lg">
                                <div class="flex items-center mb-2 sm:mb-0">
                                    <div class="bg-blue-100 p-2 rounded-full mr-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div class="font-medium">شحن الرصيد</div>
                                        <div class="text-sm text-gray-500">تم شحن ${act.amount}ريال سعودي إلى المحفظة</div>
                                    </div>
                                </div>
                                <div class="text-sm text-gray-500 ml-auto mt-2 sm:mt-0">${timeAgo}</div>
                            </div>
                            `;
                }
                return '';
            }).join('');
        }
    }
}

// تحديث بيانات الملف الشخصي
async function updateProfile() {
    const currentName = document.getElementById('full-name').textContent;
    const currentPhone = document.getElementById('phone').textContent;
    const fullName = prompt('ادخل الاسم الكامل الجديد:', currentName);
    if (!fullName) return;
    const phone = prompt('ادخل رقم الجوال الجديد:', currentPhone);
    if (!phone) return;

    try {
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
        const res = await fetch(`http://31.97.179.227/api/userData/admin/update-user/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ fullName, phone })
        });
        if (res.status === 403) {
            alert('ليس لديك صلاحية لتعديل الملف الشخصي. يرجى التواصل مع الإدارة.');
            return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error || 'فشل تحديث الملف الشخصي');
        alert('✅ تم تحديث الملف الشخصي بنجاح');
        loadProfile();
    } catch (err) {
        alert('❌ ' + err.message);
    }
}

// تحميل الملف الشخصي عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    renderRecentActivities();
    // تحديث تلقائي للأنشطة كل دقيقة
    setInterval(renderRecentActivities, 1000);

    // ربط زر تعديل الملف الشخصي
    const editBtn = document.querySelector('button.text-indigo-600');
    if (editBtn) {
        editBtn.addEventListener('click', (e) => {
            e.preventDefault();
            updateProfile();
        });
    }
});