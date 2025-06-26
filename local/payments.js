/* JavaScript */
  // تأكد من وجود التوكن وإعادة التوجيه للـ login إذا لم يكن موجودًا
const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "login.html";
}

// Check authentication
if (!window.api.getToken()) {
    window.location.href = "login.html";
}

// DOM Elements
const paymentsList = document.getElementById('paymentsList');
const loadingSpinner = document.querySelector('.loading-spinner');
const errorMessage = document.getElementById('errorMessage');
const profileToggle = document.getElementById('profile-toggle');
const popupMenu = document.getElementById('popup-menu');
const logoutBtn = document.getElementById('logout-btn');

// Helper Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatAmount(amount) {
    return `${amount.toLocaleString()} رس`;
}

function createPaymentCard(payment) {
    const card = document.createElement('div');
    card.className = 'payment-card';
    
    const statusClass = payment.status === 'paid' ? 'paid' : 
                       payment.status === 'pending' ? 'pending' : 'overdue';
    
    card.innerHTML = `
        <div class="payment-header">
            <span class="payment-date">${formatDate(payment.dueDate)}</span>
            <span class="payment-status ${statusClass}">${payment.status}</span>
        </div>
        <div class="payment-amount">${formatAmount(payment.amount)}</div>
        ${payment.status === 'pending' ? `
            <button class="pay-btn" onclick="makePayment(${payment.id})">
                Pay Now
            </button>
        ` : ''}
    `;
    
    return card;
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    errorMessage.classList.add('block');
    loadingSpinner.classList.add('hidden');
    loadingSpinner.classList.remove('block');
}

async function makePayment(paymentId) {
    try {
        loadingSpinner.style.display = 'block';
        errorMessage.style.display = 'none';

        const selection = JSON.parse(localStorage.getItem('associationSelection'));
        if (!selection) {
            throw new Error('No association selected. Please select an association first.');
        }

        await window.api.payments.create(selection.associationId, paymentId);
        await loadPayments(); // Refresh the payments list
    } catch (error) {
        console.error('Error making payment:', error);
        showError(error.message || 'Failed to make payment. Please try again.');
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

async function loadPayments() {
    try {
        loadingSpinner.classList.remove('hidden');
        loadingSpinner.classList.add('block');
        errorMessage.classList.add('hidden');
        errorMessage.classList.remove('block');

        const selection = JSON.parse(localStorage.getItem('associationSelection'));
        if (!selection) {
            showError('يجب اختيار جمعية أولاً.'); // رسالة أوضح للمستخدم
            paymentsList.innerHTML = '';
            return;
        }

        const payments = await window.api.payments.getAll(selection.associationId);
        
        paymentsList.innerHTML = '';
        payments.forEach(payment => {
            paymentsList.appendChild(createPaymentCard(payment));
        });
    } catch (error) {
        console.error('Error loading payments:', error);
        showError(error.message || 'Failed to load payments. Please try again.');
    } finally {
        loadingSpinner.classList.add('hidden');
        loadingSpinner.classList.remove('block');
    }
}

// Event Listeners
profileToggle.addEventListener('click', () => {
    popupMenu.classList.toggle('active');
});

logoutBtn.addEventListener('click', () => {
    window.api.auth.logout();
    localStorage.removeItem('user');
    window.location.href = 'login.html';
});

// Initialize
loadPayments();