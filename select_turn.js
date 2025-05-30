// Constants
const API_BASE_URL = 'http://localhost:3000'; // Update with your actual API URL

// State
let turns = [];
let selectedTurnId = null; // Use selectedTurnId to store the ID of the selected turn
let currentFilter = 'all';

// DOM Elements
const turnsGrid = document.getElementById('turnsGrid');
const filterButtons = document.querySelectorAll('.filter-btn');
const nextBtn = document.getElementById('nextBtn');
const durationEl = document.getElementById('duration');
const monthlyFeeEl = document.getElementById('monthlyFee');
const totalFeeEl = document.getElementById('totalFee');
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
        ${turn.isTaken ? '<div>🔒</div>' : ''}
    `;

    card.innerHTML = content;

    if (!turn.isTaken) {
        card.addEventListener('click', () => selectTurn(turn.id));
    }

    return card;
}

function selectTurn(turnId) {
    // Remove previous selection
    document.querySelectorAll('.turn-card.selected').forEach(card => {
        card.classList.remove('selected');
    });

    // Add selection to clicked card
    const selectedCard = document.querySelector(`.turn-card[data-turn-id="${turnId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }

    selectedTurnId = turnId; // Update selectedTurnId
    document.getElementById('nextBtn').disabled = false; // Ensure nextBtn is the correct ID
}

function updateSummary(turn) {
    const selection = JSON.parse(localStorage.getItem('associationSelection'));
    if (selection) {
        durationEl.textContent = `${selection.duration} شهر`;
        monthlyFeeEl.textContent = formatAmount(selection.monthlyFee);
        totalFeeEl.textContent = formatAmount(selection.amount);
    }
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

nextBtn.addEventListener('click', async () => {
    if (!selectedTurnId) return;

    try {
        loadingSpinner.style.display = 'block';
        errorMessage.style.display = 'none';

        const selection = JSON.parse(localStorage.getItem('associationSelection'));
        if (!selection) {
            throw new Error('No association selected. Please select an association first.');
        }

        await window.api.turns.select(selection.associationId, selectedTurnId);
        window.location.href = 'payments.html';
    } catch (error) {
        console.error('Error picking turn:', error);
        showError(error.message || 'Failed to pick turn. Please try again.');
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

        // Fetch turns from the backend using the associationId
        const res = await fetch(`${API_BASE_URL}/api/turns/${associationId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await res.json();

        if (data.success) {
            turns = data.turns;
            filterTurns('all');
            // updateSummary(); // Remove or update this if summary depends on association details fetched differently
        } else {
            throw new Error(data.error || 'Failed to fetch turns');
        }
    } catch (error) {
        console.error('Error fetching turns:', error);
        showError(error.message || 'Failed to fetch turns. Please try again.');
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

// Start the app
initialize();

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("turnForm").onsubmit = function(event) {
        event.preventDefault();

        // Get selected turn
        const selectedTurn = document.querySelector('input[name="turn"]:checked').value;

        // You can now submit this info to your backend or proceed to a confirmation page
        // For example, send to API (pseudo-code):
        // fetch('/api/join', { method: "POST", body: JSON.stringify({ turn: selectedTurn }) })

        // For demo, just show an alert and redirect to home or confirmation
        alert("تم اختيار الدور رقم: " + selectedTurn + "\nتم الانضمام للجمعية بنجاح!");
        window.location.href = "home.html"; // or confirmation.html
    }
}); 