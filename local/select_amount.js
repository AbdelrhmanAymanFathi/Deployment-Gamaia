// DOM Elements
const amountInput = document.getElementById('amountInput');
const errorMessage = document.getElementById('errorMessage');
const loadingSection = document.getElementById('loadingSection');
const associationsSection = document.getElementById('associationsSection');
const associationsList = document.getElementById('associationsList');
const nextBtn = document.getElementById('nextBtn');

// State
let selectedAmount = null;
let selectedAssociation = null;

// Constants
const MIN_AMOUNT = 3000;
const MAX_AMOUNT = 1200000;

// Helper Functions
function formatAmount(amount) {
    return `${amount.toLocaleString()} رس`;
}

function formatMonthlyFee(amount, months) {
    const monthlyFee = Math.ceil(amount / months);
    return `${formatAmount(monthlyFee)} / الشهر`;
}

function validateAmount(amount) {
    return amount >= MIN_AMOUNT && amount <= MAX_AMOUNT;
}

function createAssociationCard(association) {
    const card = document.createElement('div');
    card.className = 'association-card';
    card.dataset.associationId = association.id;

    const content = `
        <div class="association-name">${association.name}</div>
        <div class="association-details">
            <div>المدة: ${association.duration} شهر</div>
            <div>القسط الشهري: ${formatMonthlyFee(association.amount, association.duration)}</div>
            <div>عدد الأعضاء: ${association.memberCount}</div>
        </div>
    `;

    card.innerHTML = content;
    card.addEventListener('click', () => selectAssociation(association));

    return card;
}

function selectAssociation(association) {
    // Remove selection from other cards
    document.querySelectorAll('.association-card').forEach(card => {
        card.classList.remove('selected');
    });

    // Select this card
    const card = document.querySelector(`[data-association-id="${association.id}"]`);
    card.classList.add('selected');
    selectedAssociation = association;

    // Enable next button
    updateNextButton();
}

function updateNextButton() {
    nextBtn.disabled = !(selectedAmount && selectedAssociation);
}

function saveSelection() {
    const selection = {
        associationId: selectedAssociation.id,
        amount: selectedAmount,
        duration: selectedAssociation.duration,
        monthlyFee: Math.ceil(selectedAmount / selectedAssociation.duration),
        associationName: selectedAssociation.name
    };
    localStorage.setItem('associationSelection', JSON.stringify(selection));
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('visible');
    loadingSection.classList.remove('visible');
}

// Event Listeners
amountInput.addEventListener('input', async (e) => {
    const amount = parseInt(e.target.value);
    
    if (isNaN(amount)) {
        amountInput.classList.remove('valid', 'invalid');
        errorMessage.classList.remove('visible');
        associationsSection.classList.remove('visible');
        loadingSection.classList.remove('visible');
        selectedAmount = null;
    } else if (validateAmount(amount)) {
        amountInput.classList.add('valid');
        amountInput.classList.remove('invalid');
        errorMessage.classList.remove('visible');
        loadingSection.classList.add('visible');
        selectedAmount = amount;

        try {
            const associations = await window.api.associations.getAll();
            
            associationsList.innerHTML = '';
            associations.forEach(association => {
                associationsList.appendChild(createAssociationCard(association));
            });

            loadingSection.classList.remove('visible');
            associationsSection.classList.add('visible');
        } catch (error) {
            console.error('Error fetching associations:', error);
            showError(error.message || 'Failed to fetch associations. Please try again.');
        }
    } else {
        amountInput.classList.add('invalid');
        amountInput.classList.remove('valid');
        errorMessage.textContent = `Amount must be between ${formatAmount(MIN_AMOUNT)} and ${formatAmount(MAX_AMOUNT)}`;
        errorMessage.classList.add('visible');
        associationsSection.classList.remove('visible');
        loadingSection.classList.remove('visible');
        selectedAmount = null;
    }
    
    updateNextButton();
});

nextBtn.addEventListener('click', async () => {
    if (selectedAmount && selectedAssociation) {
        try {
            // Set the amount for the selected association
            await window.api.associations.setAmount(selectedAssociation.id, selectedAmount);
            
            // Save selection and proceed
            saveSelection();
            window.location.href = 'select_turn.html';
        } catch (error) {
            console.error('Error setting amount:', error);
            showError(error.message || 'Failed to set amount. Please try again.');
        }
    }
});

// Initialize
function initialize() {
    // Clear any previous selection
    localStorage.removeItem('associationSelection');
    
    // Reset form
    amountInput.value = '';
    amountInput.classList.remove('valid', 'invalid');
    errorMessage.classList.remove('visible');
    associationsSection.classList.remove('visible');
    loadingSection.classList.remove('visible');
    selectedAmount = null;
    selectedAssociation = null;
    updateNextButton();
}

// Start the app
initialize(); 