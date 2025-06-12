// DOM Elements
const associationName = document.getElementById('associationName');
const monthlyFee = document.getElementById('monthlyFee');
const duration = document.getElementById('duration');
const totalAmount = document.getElementById('totalAmount');
const loadingSection = document.getElementById('loadingSection');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const joinBtn = document.getElementById('joinBtn');

// Helper Functions
function formatAmount(amount) {
    return `${amount.toLocaleString()} رس`;
}

function formatDuration(months) {
    return `${months} شهر`;
}

function showLoading() {
    loadingSection.classList.add('visible');
    errorMessage.classList.remove('visible');
    successMessage.classList.remove('visible');
    joinBtn.disabled = true;
}

function showError(message) {
    loadingSection.classList.remove('visible');
    errorMessage.textContent = message;
    errorMessage.classList.add('visible');
    successMessage.classList.remove('visible');
    joinBtn.disabled = false;
}

function showSuccess() {
    loadingSection.classList.remove('visible');
    errorMessage.classList.remove('visible');
    successMessage.classList.add('visible');
    joinBtn.disabled = true;
}

async function joinAssociation() {
    const selection = JSON.parse(localStorage.getItem('associationSelection'));
    if (!selection) {
        window.location.href = 'select_amount.html';
        return;
    }

    showLoading();

    try {
        // First, pick the turn
        await window.api.turns.select(selection.associationId, selection.turnId);
        
        // Then, join the association
        await window.api.associations.join(selection.associationId);

        // Clear selection from localStorage
        localStorage.removeItem('associationSelection');
        
        // Show success message
        showSuccess();

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
    } catch (error) {
        console.error('Error joining association:', error);
        showError(error.message || 'Failed to join association. Please try again.');
    }
}

// Initialize
function initialize() {
    const selection = JSON.parse(localStorage.getItem('associationSelection'));
    if (!selection) {
        window.location.href = 'select_amount.html';
        return;
    }

    // Update summary
    associationName.textContent = selection.associationName;
    monthlyFee.textContent = formatAmount(selection.monthlyFee);
    duration.textContent = formatDuration(selection.duration);
    totalAmount.textContent = formatAmount(selection.amount);
}

// Event Listeners
joinBtn.addEventListener('click', joinAssociation);

// Start the app
initialize(); 