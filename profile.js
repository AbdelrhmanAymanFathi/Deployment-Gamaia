        // Function to show custom modal
        function showCustomModal(message) {
            document.getElementById('modal-message').textContent = message;
            document.getElementById('custom-modal').classList.remove('hidden');
        }

        // Event listener for closing custom modal
        document.getElementById('modal-close-btn').addEventListener('click', () => {
            document.getElementById('custom-modal').classList.add('hidden');
        });

        // Ensure token is available, otherwise redirect to login
        var token = localStorage.getItem('token');
        if (!token) {
            window.location.href = window.location.origin + '/login.html'; // Changed to absolute path
        }

        // Load profile data
        async function loadProfile() {
            try {
                const res = await fetch('https://api.technologytanda.com/api/userData/profile', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || data.error || 'فشل جلب الملف الشخصي');

                // Display user data
                document.getElementById('full-name').textContent = data.fullName;
                document.getElementById('national-id').textContent = data.nationalId;
                document.getElementById('phone').textContent = data.phone;

                // Update last updated date
                const now = new Date();
                document.getElementById('last-updated').textContent = now.toLocaleString('ar-SA', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                // Display profile image
                const imgEl = document.getElementById('profile-image');
                const localPlaceholder = window.location.origin + '/Assets/imgs/anonymus.jpg'; // المسار للصورة الافتراضية المحلية
                const guaranteedPlaceholder = 'https://thumbs.dreamstime.com/b/profile-anonymous-face-icon-gray-silhouette-person-male-default-avatar-photo-placeholder-white-background-vector-illustration-106473768.jpg'; // صورة بديلة مضمونة التحميل

                // حاول تحميل الصورة من API أولاً
                if (data.profileImage) {
                    const imageUrl = `https://api.technologytanda.com/uploads/${data.profileImage.replace('uploads/', '')}?t=${new Date().getTime()}`;
                    console.log('Attempting to load profile image from API:', imageUrl);
                    imgEl.src = imageUrl;
                } else {
                    console.log('No profile image from API, attempting to use local placeholder.');
                    imgEl.src = localPlaceholder; // إذا لم تكن هناك صورة من API، استخدم الصورة المحلية
                }

                // معالج الأخطاء لـ imgEl: سيتم تشغيله إذا فشل تحميل الصورة الحالية (سواء كانت من API أو الصورة المحلية)
                imgEl.onerror = function () {
                    console.log('Image loading failed. Trying next fallback.');
                    // إذا كانت الصورة الحالية هي من API، حاول تحميل الصورة المحلية
                    if (imgEl.src !== localPlaceholder && imgEl.src !== guaranteedPlaceholder) {
                        console.log('API image failed, trying local placeholder:', localPlaceholder);
                        imgEl.src = localPlaceholder;
                    } 
                    // إذا كانت الصورة الحالية هي الصورة المحلية (أو فشلت API والصورة المحلية فشلت أيضًا)، حاول تحميل الصورة المضمونة
                    else if (imgEl.src !== guaranteedPlaceholder) {
                        console.log('Local placeholder failed, trying guaranteed placeholder:', guaranteedPlaceholder);
                        imgEl.src = guaranteedPlaceholder;
                    } else {
                        // إذا فشلت حتى الصورة المضمونة (احتمال ضعيف جداً)، لا تفعل شيئاً أو سجل خطأ آخر
                        console.error('Even the guaranteed placeholder failed to load!');
                    }
                };

            } catch (err) {
                console.error(err);
                showCustomModal('❌ ' + err.message);
            }
        }

        // Logout function
        function logout() {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = window.location.origin + '/login.html'; // Changed to absolute path
        }

        // Render recent activities from localStorage
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

        // Update profile data
        async function updateProfile() {
            const currentName = document.getElementById('full-name').textContent;
            const currentPhone = document.getElementById('phone').textContent;
            const fullName = prompt('ادخل الاسم الكامل الجديد:', currentName);
            if (!fullName) return;
            const phone = prompt('ادخل رقم الجوال الجديد:', currentPhone);
            if (!phone) return;

            try {
                let userId = null;
                try {
                    const user = JSON.parse(localStorage.getItem('user'));
                    if (user && user.id) userId = user.id;
                } catch (e) {
                    console.error("Error parsing user from localStorage:", e);
                }
                
                if (!userId) {
                    showCustomModal('تعذر تحديد رقم المستخدم. يرجى إعادة تسجيل الدخول.');
                    return;
                }

                const res = await fetch(`https://api.technologytanda.com/api/userData/admin/update-user/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({ fullName, phone })
                });

                if (res.status === 403) {
                    showCustomModal('ليس لديك صلاحية لتعديل الملف الشخصي. يرجى التواصل مع الإدارة.');
                    return;
                }

                const data = await res.json();
                if (!res.ok) throw new Error(data.message || data.error || 'فشل تحديث الملف الشخصي');
                
                showCustomModal('✅ تم تحديث الملف الشخصي بنجاح');
                loadProfile();
            } catch (err) {
                showCustomModal('❌ ' + err.message);
            }
        }

        // DOMContentLoaded event listener
        document.addEventListener('DOMContentLoaded', () => {
            loadProfile();
            renderRecentActivities();
            // Update activities every minute
            setInterval(renderRecentActivities, 60000); // Changed to 60000ms (1 minute)

            // Link edit profile button
            const editBtn = document.getElementById('edit-profile-btn');
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    updateProfile();
                });
            }

            // Image enlargement functionality
            const overlay = document.getElementById('img-overlay');
            const largeImg = document.getElementById('img-large-view');
            const profileImg = document.getElementById('profile-image');
            if (profileImg && overlay && largeImg) {
                profileImg.addEventListener('click', () => {
                    largeImg.src = profileImg.src;
                    overlay.classList.remove('hidden');
                });

                // Close enlarged image
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay || e.target.classList.contains('close-btn')) {
                        overlay.classList.add('hidden');
                    }
                });
            }

            // Logout button event listener
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', logout);
            }

            // Toggle profile dropdown menu
            const profileToggle = document.getElementById('profile-toggle');
            const popupMenu = document.getElementById('popup-menu');
            if (profileToggle && popupMenu) {
                profileToggle.addEventListener('click', () => {
                    popupMenu.classList.toggle('hidden');
                });

                document.addEventListener('click', (event) => {
                    if (!profileToggle.contains(event.target) && !popupMenu.contains(event.target)) {
                        popupMenu.classList.add('hidden');
                    }
                });
            }
        });
