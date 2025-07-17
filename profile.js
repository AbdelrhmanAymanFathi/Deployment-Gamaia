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
            window.location.href = window.location.origin + '/login.html';
        }

        // Load profile data
        async function loadProfile() {
            try {
                const res = await fetch('https://api.technologytanda.com/api/userData/profile', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || data.error || 'فشل جلب الملف الشخصي');

                // Display user data in input fields using .value
                document.getElementById('full-name').value = data.fullName || 'غير متوفر';
                document.getElementById('national-id').value = data.nationalId || 'غير متوفر';
                document.getElementById('phone').value = data.phone || 'غير متوفر';
                document.getElementById('email').value = data.email || 'غير متوفر';

                // Display user's full name in the header
                document.getElementById('header-full-name').textContent = data.fullName || 'اسم المستخدم';

                // Display profile image
                const imgEl = document.getElementById('profile-image');
                const localPlaceholder = window.location.origin + '/Assets/imgs/anonymus.jpg';
                const guaranteedPlaceholder = 'https://thumbs.dreamstime.com/b/profile-anonymous-face-icon-gray-silhouette-person-male-default-avatar-photo-placeholder-white-background-vector-illustration-106473768.jpg';

                if (data.profileImage) {
                    const imageUrl = `https://api.technologytanda.com/uploads/${data.profileImage.replace('uploads/', '')}?t=${new Date().getTime()}`;
                    imgEl.src = imageUrl;
                } else {
                    imgEl.src = localPlaceholder;
                }

                imgEl.onerror = function () {
                    if (imgEl.src !== localPlaceholder && imgEl.src !== guaranteedPlaceholder) {
                        imgEl.src = localPlaceholder;
                    }
                    else if (imgEl.src !== guaranteedPlaceholder) {
                        imgEl.src = guaranteedPlaceholder;
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
            window.location.href = window.location.origin + '/login.html';
        }

        // =====================
        // Profile Image Change
        // =====================

        // Handle file selection and upload to API
        document.getElementById('profile-image-input').addEventListener('change', async function() {
            const file = this.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('profileImage', file);

            showCustomModal('جارٍ رفع الصورة...');

            try {
                const res = await fetch('https://api.technologytanda.com/api/userData/user/update', {
                    method: 'PUT',
                    headers: {
                        'Authorization': 'Bearer ' + token
                    },
                    body: formData
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || data.error || 'فشل تحديث الصورة');

                showCustomModal('✅ تم تحديث صورة الملف الشخصي بنجاح');
                // Update the profile image on the page (cache-busting)
                document.getElementById('profile-image').src = 
                    `https://api.technologytanda.com/uploads/${data.user.profileImage.replace('uploads/', '')}?t=${Date.now()}`;
            } catch (err) {
                showCustomModal('❌ ' + err.message);
            }
        });

        // =====================
        // Edit Profile (Name & Phone)
        // =====================

        // Improved edit mode toggle to support correct endpoint and input
        async function toggleEditMode() {
            const fullNameInput = document.getElementById('full-name');
            const phoneInput = document.getElementById('phone');
            const editBtn = document.getElementById('edit-profile-btn');

            // If in read-only mode, enable editing
            if (fullNameInput.readOnly) {
                fullNameInput.readOnly = false;
                phoneInput.readOnly = false;
                fullNameInput.focus();
                editBtn.textContent = 'حفظ التغييرات';
                editBtn.classList.remove('button-primary');
                editBtn.classList.add('button-secondary', 'bg-green-600', 'hover:bg-green-700');
            } else {
                // Gather updated data
                const newFullName = fullNameInput.value.trim();
                const newPhone = phoneInput.value.trim();

                const formData = new FormData();
                formData.append('fullName', newFullName);
                formData.append('phone', newPhone);

                showCustomModal('جارٍ تحديث الملف الشخصي...');

                try {
                    const res = await fetch('https://api.technologytanda.com/api/userData/user/update', {
                        method: 'PUT',
                        headers: {
                            'Authorization': 'Bearer ' + token
                        },
                        body: formData
                    });
                    const data = await res.json();

                    if (!res.ok) throw new Error(data.message || data.error || 'فشل تحديث الملف الشخصي');

                    showCustomModal('✅ تم تحديث الملف الشخصي بنجاح');
                    loadProfile();

                } catch (err) {
                    showCustomModal('❌ ' + err.message);
                } finally {
                    // Return to read-only mode and button state
                    fullNameInput.readOnly = true;
                    phoneInput.readOnly = true;
                    editBtn.textContent = 'تعديل الملف الشخصي';
                    editBtn.classList.remove('button-secondary', 'bg-green-600', 'hover:bg-green-700');
                    editBtn.classList.add('button-primary');
                }
            }
        }

        // Function to render recent activities
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

        // DOMContentLoaded event listener
        document.addEventListener('DOMContentLoaded', () => {
            loadProfile();
            renderRecentActivities();
            setInterval(renderRecentActivities, 60000);

            // Link edit profile button
            const editBtn = document.getElementById('edit-profile-btn');
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    toggleEditMode();
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
                const closeBtn = overlay.querySelector('.close-btn');
                closeBtn.addEventListener('click', () => {
                    overlay.classList.add('hidden');
                });
                
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        overlay.classList.add('hidden');
                    }
                });
            }

            // Logout button event listeners
        document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "https://abdelrhmanaymanfathi.github.io/Deployment-Gamaia/login.html";
            });

            // Toggle profile dropdown menu
            const profileToggle = document.getElementById('profile-toggle');
            const popupMenu = document.getElementById('popup-menu');
            if (profileToggle && popupMenu) {
                profileToggle.addEventListener('click', (event) => {
                    event.stopPropagation();
                    popupMenu.classList.toggle('hidden');
                });

                document.addEventListener('click', (event) => {
                    if (!profileToggle.contains(event.target) && !popupMenu.contains(event.target)) {
                        popupMenu.classList.add('hidden');
                    }
                });
            }
            
            // Handle camera icon click to open file upload
            document.querySelector('.camera-icon').addEventListener('click', (e) => {
                e.stopPropagation();
                document.getElementById('profile-image-input').click();
            });
        });
