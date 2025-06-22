// Constants
const API_BASE_URL = 'https://money-production-bfc6.up.railway.app/api/turns/public'; // Corrected base URL

// State
let turns = [];
let selectedTurnId = null; // Use selectedTurnId to store the ID of the selected turn
let currentFilter = 'all';
let totalFeesAmountFromApi = 0; // Store totalFeesAmount from API

// DOM Elements
const turnsGrid = document.getElementById('turnsGrid');
const filterButtons = document.querySelectorAll('.filter-btn');
const nextBtn = document.getElementById('nextBtn');
const durationEl = document.getElementById('duration');
const monthlyFeeEl = document.getElementById('monthlyFee');
const totalFeeEl = document.getElementById('totalFee');
const feeAmount = document.getElementById('Fee');
const errorMessage = document.getElementById('errorMessage');
const loadingSpinner = document.querySelector('.loading-spinner');

// Helper Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    const months = [
        'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatAmount(amount) {
    return `${amount.toLocaleString()} رس`;
}

function createTurnCard(turn) {
    const card = document.createElement('div');
    card.className = `turn-card ${turn.isTaken ? 'taken' : ''}`;
    card.dataset.turnId = turn.id;

    const content = `
        <div class="turn-name">${turn.turnName}</div>
        <div class="turn-date">${formatDate(turn.scheduledDate)}</div>
        <div class="turn-amount">${formatAmount(turn.feeAmount)}</div>
        ${turn.isTaken 
            ? '<div class="mt-2 text-red-600 flex items-center gap-1"><span>🔒</span> <span>غير متاح</span></div>' 
            : '<button class="lock-btn mt-3 px-3 py-1 rounded bg-green-600 text-white font-bold">احجز الدور</button>'
        }
    `;

    card.innerHTML = content;

    // Only add event for available turns
    if (!turn.isTaken) {
        // Highlight on card click
        card.addEventListener('click', () => {
            document.querySelectorAll('.turn-card.selected').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedTurnId = turn.id;
            nextBtn.disabled = false;
            updateSummary(); // Update summary on selection
        });

        // Lock button event (stop propagation so card click doesn't fire)
        const lockBtn = card.querySelector('.lock-btn');
        lockBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const confirmed = confirm('هل أنت متأكد أنك تريد اختيار هذا الدور؟');
            if (!confirmed) return;
            loadingSpinner.style.display = 'block';
            try {
                const associationId = localStorage.getItem('selectedAssociationId');
                if (!associationId) {
                    alert('لا يوجد جمعية محددة');
                    return;
                }
                await window.api.turns.select(associationId, turn.id);
                window.location.href = 'upload.html';
            } catch (error) {
                alert('حدث خطأ أثناء حجز الدور');
            } finally {
                loadingSpinner.style.display = 'none';
            }
        });
    }

    return card;
}

function updateSummary() {
    const selection = JSON.parse(localStorage.getItem('associationSelection'));
    let monthlyFee = selection ? selection.monthlyFee : 0;
    durationEl.textContent = `${turns.length} شهر`;
    monthlyFeeEl.textContent = formatAmount(monthlyFee);

    // Show feeAmount of selected turn
    const selectedTurn = turns.find(t => t.id === selectedTurnId);
    if (selectedTurn) {
        // الفرق بين القسط الشهري و الرسوم
        const diff = selectedTurn.feeAmount - monthlyFee;
        let diffText = '';
        if (diff > 0) {
            diffText = `+${formatAmount(diff)} (زيادة)`;
        } else if (diff < 0) {
            diffText = `${formatAmount(diff)} (خصم)`;
        } else {
            diffText = 'بدون زيادة أو خصم';
        }
        feeAmount.textContent = `${formatAmount(selectedTurn.feeAmount)} | ${diffText}`;
    } else {
        feeAmount.textContent = '-';
    }

    // Show totalFeesAmount from API if available
    totalFeeEl.textContent = totalFeesAmountFromApi
        ? formatAmount(totalFeesAmountFromApi)
        : '-';
}

function filterTurns(filter) {
    currentFilter = filter;
    const filteredTurns = turns.filter(turn => {
        if (filter === 'all') return true;
        const turnIndex = turns.indexOf(turn);
        const totalTurns = turns.length;
        
        if (filter === 'early') return turnIndex < totalTurns / 3;
        if (filter === 'middle') return turnIndex >= totalTurns / 3 && turnIndex < (totalTurns * 2) / 3;
        if (filter === 'late') return turnIndex >= (totalTurns * 2) / 3;
    });

    renderTurns(filteredTurns);
}

function renderTurns(turnsToRender) {
    turnsGrid.innerHTML = '';
    turnsToRender.forEach(turn => {
        turnsGrid.appendChild(createTurnCard(turn));
    });
    updateSummary(); // Update summary after rendering
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    loadingSpinner.style.display = 'none';
}

// Event Listeners
filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterTurns(btn.dataset.filter);
    });
});

// You can keep or remove the nextBtn logic as needed
nextBtn.addEventListener('click', async () => {
    if (!selectedTurnId) return;

    // Confirmation dialog before proceeding
    const confirmed = confirm('هل أنت متأكد أنك تريد اختيار هذا الدور؟');
    if (!confirmed) return;

    try {
        loadingSpinner.style.display = 'block';
        errorMessage.style.display = 'none';

        const selection = JSON.parse(localStorage.getItem('associationSelection'));
        if (!selection) {
            throw new Error('No association selected. Please select an association first.');
        }

        // Call the API to select the turn
        await window.api.turns.select(selection.associationId, selectedTurnId);

        // Redirect to upload.html after successful turn selection
        window.location.href = 'upload.html';
    } catch (error) {
        console.error('Error picking turn:', error);
        showError(error.message || 'Failed to pick turn. Please try again.');
    } finally {
        loadingSpinner.style.display = 'none';
    }
});

// Initialize
async function initialize() {
    try {
        loadingSpinner.style.display = 'block';
        errorMessage.style.display = 'none';

        // Get association ID from localStorage
        const associationId = localStorage.getItem('selectedAssociationId');
        if (!associationId) {
            throw new Error('No association selected. Please select an association first.');
        }

        // Use associationId as a variable in the fetch URL
        const url = `${API_BASE_URL}/${associationId}`;
        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (!res.ok) throw new Error('Network error');
        const data = await res.json();

        // Handle both array and object response
        if (Array.isArray(data)) {
            turns = data;
            totalFeesAmountFromApi = 0;
        } else if (data.turns && Array.isArray(data.turns)) {
            turns = data.turns;
            totalFeesAmountFromApi = data.totalFeesAmount || 0;
        } else {
            throw new Error('Invalid data');
        }

        selectedTurnId = null;
        nextBtn.disabled = true;
        filterTurns(currentFilter);
        updateSummary();
    } catch (error) {
        showError(error.message || 'حدث خطأ أثناء تحميل الأدوار');
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

// Call initialize on script load
initialize();