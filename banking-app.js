// ============================================
// SECUREBANK PRO - BANKING SYSTEM JAVASCRIPT
// Pure Frontend Banking with LocalStorage
// ============================================

// ===== DATA STORAGE KEYS =====
const STORAGE_KEYS = {
    USERS: 'banking_users',
    ACCOUNTS: 'banking_accounts',
    TRANSACTIONS: 'banking_transactions',
    CURRENT_USER: 'current_user'
};

// ===== CURRENT STATE =====
let currentUser = null;
let currentTransactionType = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Check if user is logged in
    const savedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);

    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showScreen('dashboard-screen');
        loadDashboard();
    } else {
        showScreen('welcome-screen');
    }

    // Initialize sample data if first time
    initializeSampleData();
}

function initializeSampleData() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    }
}

// ===== SCREEN NAVIGATION =====
function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // Show target screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }

    // Clear forms if moving away from auth screens
    if (screenId === 'welcome-screen') {
        clearAuthForms();
    }
}

function clearAuthForms() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => form.reset());
}

// ===== USER AUTHENTICATION =====
function handleRegister(event) {
    event.preventDefault();

    const fullName = document.getElementById('reg-fullname').value.trim();
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;

    // Validation
    if (password !== confirmPassword) {
        showNotification('Passwords do not match!', 'error');
        return;
    }

    if (password.length < 6) {
        showNotification('Password must be at least 6 characters!', 'error');
        return;
    }

    // Check if username already exists
    const users = getUsers();
    if (users.find(u => u.username === username)) {
        showNotification('Username already exists!', 'error');
        return;
    }

    if (users.find(u => u.email === email)) {
        showNotification('Email already registered!', 'error');
        return;
    }

    // Create new user
    const newUser = {
        id: generateId(),
        fullName,
        username,
        email,
        password: hashPassword(password), // Simple hash (for demo)
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Create default savings account
    createDefaultAccount(newUser.id);

    showNotification('Registration successful! Please login.', 'success');

    // Switch to login screen
    setTimeout(() => {
        showScreen('login-screen');
        document.getElementById('login-username').value = username;
    }, 1500);
}

function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    const users = getUsers();
    const user = users.find(u => 
        u.username === username && u.password === hashPassword(password)
    );

    if (user) {
        currentUser = user;
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));

        showNotification(`Welcome back, ${user.fullName}!`, 'success');

        setTimeout(() => {
            showScreen('dashboard-screen');
            loadDashboard();
        }, 1000);
    } else {
        showNotification('Invalid username or password!', 'error');
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        currentUser = null;
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);

        showNotification('Logged out successfully!', 'success');

        setTimeout(() => {
            showScreen('welcome-screen');
        }, 1000);
    }
}

// ===== DASHBOARD FUNCTIONS =====
function loadDashboard() {
    if (!currentUser) return;

    // Update user name display
    document.getElementById('user-name-display').textContent = currentUser.fullName;

    // Load accounts
    loadAccounts();

    // Load recent transactions
    loadRecentTransactions();
}

function loadAccounts() {
    const accounts = getUserAccounts();
    const accountsGrid = document.getElementById('accounts-grid');

    if (accounts.length === 0) {
        accountsGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">ðŸ’³</div>
                <h3>No Accounts Yet</h3>
                <p>Create your first account to get started!</p>
            </div>
        `;
        document.getElementById('total-balance').textContent = '$0.00';
        return;
    }

    // Render accounts
    accountsGrid.innerHTML = accounts.map(account => `
        <div class="account-card" style="background: ${getAccountGradient(account.type)}">
            <div class="account-type">${getAccountIcon(account.type)} ${account.type}</div>
            <div class="account-number">**** **** ${account.number.slice(-4)}</div>
            <div class="account-balance">$${formatMoney(account.balance)}</div>
            <div class="account-footer">
                <span>Interest: ${account.interestRate}%</span>
                <span>${new Date(account.createdAt).toLocaleDateString()}</span>
            </div>
        </div>
    `).join('');

    // Calculate and display total balance
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    document.getElementById('total-balance').textContent = `$${formatMoney(totalBalance)}`;

    // Update account selectors in modals
    updateAccountSelectors(accounts);
}

function getUserAccounts() {
    const accounts = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS) || '[]');
    return accounts.filter(acc => acc.userId === currentUser.id);
}

function createDefaultAccount(userId) {
    const accounts = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS) || '[]');

    const newAccount = {
        id: generateId(),
        userId: userId,
        number: generateAccountNumber(),
        type: 'Savings Account',
        balance: 0,
        interestRate: 2.5,
        createdAt: new Date().toISOString()
    };

    accounts.push(newAccount);
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
}

function createNewAccount() {
    const accountTypes = [
        { name: 'Savings Account', rate: 2.5 },
        { name: 'Checking Account', rate: 1.0 },
        { name: 'Business Account', rate: 2.0 }
    ];

    const typeIndex = prompt(
        'Select account type:\n' +
        '1. Savings Account (2.5% interest)\n' +
        '2. Checking Account (1.0% interest)\n' +
        '3. Business Account (2.0% interest)\n\n' +
        'Enter 1, 2, or 3:'
    );

    const index = parseInt(typeIndex) - 1;

    if (index >= 0 && index < accountTypes.length) {
        const accounts = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS) || '[]');

        const newAccount = {
            id: generateId(),
            userId: currentUser.id,
            number: generateAccountNumber(),
            type: accountTypes[index].name,
            balance: 0,
            interestRate: accountTypes[index].rate,
            createdAt: new Date().toISOString()
        };

        accounts.push(newAccount);
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));

        showNotification(`${newAccount.type} created successfully!`, 'success');
        loadAccounts();
    } else {
        showNotification('Invalid account type selected!', 'error');
    }
}

// ===== TRANSACTION FUNCTIONS =====
function showTransactionModal(type) {
    currentTransactionType = type;

    const modal = document.getElementById('transaction-modal');
    const title = document.getElementById('modal-title');

    title.textContent = type === 'deposit' ? 'ðŸ’° Make Deposit' : 'ðŸ’¸ Make Withdrawal';

    modal.classList.add('active');

    // Reset form
    document.getElementById('transaction-form').reset();
}

function handleTransaction(event) {
    event.preventDefault();

    const accountId = document.getElementById('transaction-account').value;
    const amount = parseFloat(document.getElementById('transaction-amount').value);
    const description = document.getElementById('transaction-description').value || 
                       `${currentTransactionType.charAt(0).toUpperCase() + currentTransactionType.slice(1)} transaction`;

    if (!accountId) {
        showNotification('Please select an account!', 'error');
        return;
    }

    if (amount <= 0) {
        showNotification('Amount must be greater than zero!', 'error');
        return;
    }

    const accounts = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS) || '[]');
    const accountIndex = accounts.findIndex(acc => acc.id === accountId);

    if (accountIndex === -1) {
        showNotification('Account not found!', 'error');
        return;
    }

    const account = accounts[accountIndex];

    // Process transaction
    if (currentTransactionType === 'deposit') {
        account.balance += amount;
    } else { // withdrawal
        if (account.balance < amount) {
            showNotification('Insufficient funds!', 'error');
            return;
        }
        account.balance -= amount;
    }

    // Update account
    accounts[accountIndex] = account;
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));

    // Record transaction
    recordTransaction({
        accountId: account.id,
        type: currentTransactionType,
        amount: amount,
        description: description,
        balanceAfter: account.balance
    });

    showNotification(
        `${currentTransactionType === 'deposit' ? 'Deposit' : 'Withdrawal'} of $${formatMoney(amount)} successful!`,
        'success'
    );

    // Close modal and refresh
    closeModal('transaction-modal');
    loadDashboard();
}

function showTransferModal() {
    const modal = document.getElementById('transfer-modal');
    modal.classList.add('active');

    // Reset form
    document.getElementById('transfer-form').reset();
}

function handleTransfer(event) {
    event.preventDefault();

    const fromAccountId = document.getElementById('transfer-from').value;
    const toAccountId = document.getElementById('transfer-to').value;
    const amount = parseFloat(document.getElementById('transfer-amount').value);
    const description = document.getElementById('transfer-description').value || 'Account transfer';

    if (!fromAccountId || !toAccountId) {
        showNotification('Please select both accounts!', 'error');
        return;
    }

    if (fromAccountId === toAccountId) {
        showNotification('Cannot transfer to the same account!', 'error');
        return;
    }

    if (amount <= 0) {
        showNotification('Amount must be greater than zero!', 'error');
        return;
    }

    const accounts = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS) || '[]');
    const fromIndex = accounts.findIndex(acc => acc.id === fromAccountId);
    const toIndex = accounts.findIndex(acc => acc.id === toAccountId);

    if (fromIndex === -1 || toIndex === -1) {
        showNotification('Account not found!', 'error');
        return;
    }

    const fromAccount = accounts[fromIndex];
    const toAccount = accounts[toIndex];

    // Check balance
    if (fromAccount.balance < amount) {
        showNotification('Insufficient funds in source account!', 'error');
        return;
    }

    // Process transfer
    fromAccount.balance -= amount;
    toAccount.balance += amount;

    accounts[fromIndex] = fromAccount;
    accounts[toIndex] = toAccount;
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));

    // Record transactions
    recordTransaction({
        accountId: fromAccount.id,
        type: 'transfer_out',
        amount: amount,
        description: description,
        balanceAfter: fromAccount.balance,
        recipientAccount: toAccount.number
    });

    recordTransaction({
        accountId: toAccount.id,
        type: 'transfer_in',
        amount: amount,
        description: description,
        balanceAfter: toAccount.balance,
        senderAccount: fromAccount.number
    });

    showNotification(`Transfer of $${formatMoney(amount)} successful!`, 'success');

    closeModal('transfer-modal');
    loadDashboard();
}

function recordTransaction(transactionData) {
    const transactions = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');

    const transaction = {
        id: generateId(),
        ...transactionData,
        timestamp: new Date().toISOString()
    };

    transactions.unshift(transaction); // Add to beginning

    // Keep only last 1000 transactions
    if (transactions.length > 1000) {
        transactions.splice(1000);
    }

    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

function loadRecentTransactions(limit = 5) {
    const transactions = getAllUserTransactions();
    const recentTransactions = transactions.slice(0, limit);

    const container = document.getElementById('recent-transactions');

    if (recentTransactions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">ðŸ“Š</div>
                <h4>No Transactions Yet</h4>
                <p>Your recent transactions will appear here</p>
            </div>
        `;
        return;
    }

    container.innerHTML = recentTransactions.map(trans => {
        const isPositive = trans.type === 'deposit' || trans.type === 'transfer_in';
        const account = getAccountById(trans.accountId);

        return `
            <div class="transaction-item">
                <div class="transaction-left">
                    <div class="transaction-icon">
                        ${getTransactionIcon(trans.type)}
                    </div>
                    <div class="transaction-details">
                        <h4>${getTransactionTitle(trans.type)}</h4>
                        <p>${trans.description}</p>
                    </div>
                </div>
                <div class="transaction-right">
                    <div class="transaction-amount ${isPositive ? 'positive' : 'negative'}">
                        ${isPositive ? '+' : '-'}$${formatMoney(trans.amount)}
                    </div>
                    <div class="transaction-date">
                        ${formatDate(trans.timestamp)}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function showTransactionHistory() {
    const modal = document.getElementById('history-modal');
    modal.classList.add('active');

    loadAccountHistory();
}

function loadAccountHistory() {
    const accountId = document.getElementById('history-account').value;
    const transactions = accountId ? 
        getAccountTransactions(accountId) : 
        getAllUserTransactions();

    const container = document.getElementById('history-list');

    if (transactions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">ðŸ“Š</div>
                <h4>No Transactions Found</h4>
            </div>
        `;
        return;
    }

    container.innerHTML = transactions.map(trans => {
        const isPositive = trans.type === 'deposit' || trans.type === 'transfer_in';

        return `
            <div class="transaction-item">
                <div class="transaction-left">
                    <div class="transaction-icon">
                        ${getTransactionIcon(trans.type)}
                    </div>
                    <div class="transaction-details">
                        <h4>${getTransactionTitle(trans.type)}</h4>
                        <p>${trans.description}</p>
                        <p><small>Balance after: $${formatMoney(trans.balanceAfter)}</small></p>
                    </div>
                </div>
                <div class="transaction-right">
                    <div class="transaction-amount ${isPositive ? 'positive' : 'negative'}">
                        ${isPositive ? '+' : '-'}$${formatMoney(trans.amount)}
                    </div>
                    <div class="transaction-date">
                        ${formatDate(trans.timestamp)}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getAllUserTransactions() {
    const accounts = getUserAccounts();
    const accountIds = accounts.map(acc => acc.id);

    const allTransactions = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');

    return allTransactions
        .filter(trans => accountIds.includes(trans.accountId))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function getAccountTransactions(accountId) {
    const allTransactions = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');

    return allTransactions
        .filter(trans => trans.accountId === accountId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// ===== UTILITY FUNCTIONS =====
function updateAccountSelectors(accounts) {
    const selectors = [
        'transaction-account',
        'transfer-from',
        'transfer-to',
        'history-account'
    ];

    selectors.forEach(selectorId => {
        const select = document.getElementById(selectorId);
        if (!select) return;

        const currentValue = select.value;
        const isHistory = selectorId === 'history-account';

        select.innerHTML = isHistory ? 
            '<option value="">All Accounts</option>' :
            '<option value="">Choose an account...</option>';

        accounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account.id;
            option.textContent = `${account.type} - *${account.number.slice(-4)} ($${formatMoney(account.balance)})`;
            select.appendChild(option);
        });

        select.value = currentValue;
    });
}

function getAccountById(accountId) {
    const accounts = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS) || '[]');
    return accounts.find(acc => acc.id === accountId);
}

function getUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function generateAccountNumber() {
    return Array.from({length: 10}, () => Math.floor(Math.random() * 10)).join('');
}

function hashPassword(password) {
    // Simple hash for demo purposes (NOT secure for production!)
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

function formatMoney(amount) {
    return amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function getAccountIcon(type) {
    const icons = {
        'Savings Account': 'ðŸ’°',
        'Checking Account': 'ðŸ’³',
        'Business Account': 'ðŸ¢'
    };
    return icons[type] || 'ðŸ’µ';
}

function getAccountGradient(type) {
    const gradients = {
        'Savings Account': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'Checking Account': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'Business Account': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    };
    return gradients[type] || 'linear-gradient(135deg, #3498db, #2980b9)';
}

function getTransactionIcon(type) {
    const icons = {
        'deposit': 'ðŸ’°',
        'withdrawal': 'ðŸ’¸',
        'transfer_in': 'ðŸ“¥',
        'transfer_out': 'ðŸ“¤'
    };
    return icons[type] || 'ðŸ’µ';
}

function getTransactionTitle(type) {
    const titles = {
        'deposit': 'Deposit',
        'withdrawal': 'Withdrawal',
        'transfer_in': 'Transfer In',
        'transfer_out': 'Transfer Out'
    };
    return titles[type] || 'Transaction';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const icon = document.getElementById('notification-icon');
    const messageEl = document.getElementById('notification-message');

    // Set icon based on type
    const icons = {
        'success': 'âœ…',
        'error': 'âŒ',
        'warning': 'âš ï¸',
        'info': 'â„¹ï¸'
    };

    icon.textContent = icons[type] || icons['info'];
    messageEl.textContent = message;

    // Remove previous type classes
    notification.classList.remove('success', 'error', 'warning', 'info');
    notification.classList.add(type);

    // Show notification
    notification.classList.add('show');

    // Auto-hide after 4 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

// ===== CLOSE MODALS ON OUTSIDE CLICK =====
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
    // Escape key closes modals
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});

console.log('ðŸ¦ SecureBank Pro Banking System Loaded Successfully!');
