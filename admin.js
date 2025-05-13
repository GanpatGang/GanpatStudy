// DOM Elements
const userModal = document.getElementById('user-modal');
const userForm = document.getElementById('user-form');
const modalTitle = document.getElementById('modal-title');
const closeBtn = document.querySelector('.close');
const usersTableBody = document.getElementById('users-table-body');
const studentLoginHistory = document.getElementById('student-login-history');
const teacherLoginHistory = document.getElementById('teacher-login-history');
const backButton = document.getElementById('back-btn');

// State
let currentUserId = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    loadUsers();
    loadLoginHistory();
});

userForm.addEventListener('submit', handleUserSubmit);
closeBtn.addEventListener('click', () => userModal.style.display = 'none');

// Back button functionality
if (backButton) {
    backButton.addEventListener('click', () => {
        window.history.back();
    });
}

// Check admin authentication
function checkAdminAuth() {
    const userType = sessionStorage.getItem('userType');
    if (userType !== 'admin') {
        window.location.href = 'index.html';
    }
}

// Load users
async function loadUsers() {
    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        displayUsers(users);
    } catch (error) {
        showError('Error loading users: ' + error.message);
    }
}

// Load and display login history
function loadLoginHistory() {
    try {
        const loginHistory = JSON.parse(localStorage.getItem('loginHistory') || '[]');
        const studentHistory = loginHistory.filter(entry => entry.userType === 'student');
        const teacherHistory = loginHistory.filter(entry => entry.userType === 'teacher');
        
        displayLoginHistory(studentHistory, 'student');
        displayLoginHistory(teacherHistory, 'teacher');
    } catch (error) {
        showError('Error loading login history: ' + error.message);
    }
}

// Calculate last activity time
function getLastActivity(username, history) {
    const userEntries = history.filter(entry => entry.username === username && entry.success);
    if (userEntries.length > 1) {
        const sortedEntries = userEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return new Date(sortedEntries[1].timestamp).toLocaleString();
    }
    return 'N/A';
}

// Display login history in table
function displayLoginHistory(history, type) {
    const tableBody = type === 'student' ? studentLoginHistory : teacherLoginHistory;
    const sortedHistory = [...history].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    tableBody.innerHTML = sortedHistory.map(entry => `
        <tr>
            <td>${escapeHtml(entry.username)}</td>
            <td>${new Date(entry.timestamp).toLocaleString()}</td>
            <td>
                <span class="status-${entry.success ? 'success' : 'failed'}">
                    ${entry.success ? 'Success' : 'Failed'}
                </span>
            </td>
            <td>${escapeHtml(entry.ipAddress)}</td>
            <td class="browser-info" title="${escapeHtml(entry.browserInfo)}">
                ${escapeHtml(entry.browserInfo)}
            </td>
            <td class="last-activity">
                ${getLastActivity(entry.username, history)}
            </td>
        </tr>
    `).join('');
}

// Export login history to Excel
function exportLoginHistory(type) {
    try {
        const loginHistory = JSON.parse(localStorage.getItem('loginHistory') || '[]');
        const filteredHistory = type ? 
            loginHistory.filter(entry => entry.userType === type) : 
            loginHistory;
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        
        // Format data for Excel
        const wsData = filteredHistory.map(entry => ({
            Username: entry.username,
            'Login Time': new Date(entry.timestamp).toLocaleString(),
            Status: entry.success ? 'Success' : 'Failed',
            'IP Address': entry.ipAddress || 'Local',
            'Browser Info': entry.browserInfo || 'N/A',
            'Last Activity': getLastActivity(entry.username, filteredHistory)
        }));

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(wsData);

        // Set column widths
        const colWidths = [
            { wch: 15 }, // Username
            { wch: 20 }, // Login Time
            { wch: 10 }, // Status
            { wch: 15 }, // IP Address
            { wch: 30 }, // Browser Info
            { wch: 20 }  // Last Activity
        ];
        ws['!cols'] = colWidths;

        // Add worksheet to workbook
        const sheetName = type ? `${type.charAt(0).toUpperCase() + type.slice(1)} Login History` : 'Login History';
        XLSX.utils.book_append_sheet(wb, ws, sheetName);

        // Generate filename with current date
        const date = new Date().toISOString().split('T')[0];
        const filename = `${type || 'all'}_login_history_${date}.xlsx`;

        // Save file
        XLSX.writeFile(wb, filename);
        showSuccess(`${type ? type.charAt(0).toUpperCase() + type.slice(1) : 'All'} login history exported successfully`);
    } catch (error) {
        showError('Error exporting login history: ' + error.message);
    }
}

// Display users in table
function displayUsers(users) {
    usersTableBody.innerHTML = users.map(user => `
        <tr>
            <td>${escapeHtml(user.username)}</td>
            <td>${escapeHtml(user.email)}</td>
            <td>${escapeHtml(user.role)}</td>
            <td>${user.created ? new Date(user.created).toLocaleDateString() : 'N/A'}</td>
            <td>
                <span class="status-badge ${user.isActive ? 'active' : 'inactive'}">
                    ${user.isActive ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                <button class="action-btn edit" onclick="editUser('${user.username}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" onclick="deleteUser('${user.username}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Handle user form submission
async function handleUserSubmit(event) {
    event.preventDefault();
    
    try {
        const formData = {
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            role: document.getElementById('role').value,
            isActive: document.getElementById('is-active').value === 'true',
            created: new Date().toISOString()
        };

        // Validate required fields
        if (!formData.username || !formData.email || !formData.role) {
            throw new Error('Please fill in all required fields');
        }

        // Add password for new users or if password field is filled for existing users
        const password = document.getElementById('password').value;
        if (!currentUserId && !password) {
            throw new Error('Password is required for new users');
        }
        if (!currentUserId || password.trim()) {
            formData.password = password;
        }

        // Get existing users
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        if (currentUserId) {
            // Update existing user
            const userIndex = users.findIndex(u => u.username === currentUserId);
            if (userIndex >= 0) {
                const existingUser = users[userIndex];
                users[userIndex] = { 
                    ...existingUser, 
                    ...formData,
                    password: password.trim() ? formData.password : existingUser.password
                };
            } else {
                throw new Error('User not found');
            }
        } else {
            // Check if username already exists
            if (users.some(u => u.username === formData.username)) {
                throw new Error('Username already exists');
            }
            users.push(formData);
        }

        // Save to localStorage
        localStorage.setItem('users', JSON.stringify(users));
        
        // Close modal and refresh table
        userModal.style.display = 'none';
        loadUsers();
        showSuccess(currentUserId ? 'User updated successfully' : 'User added successfully');
    } catch (error) {
        showError(error.message);
    }
}

// Show/hide user modal
function showAddUserModal() {
    currentUserId = null;
    modalTitle.textContent = 'Add New User';
    userForm.reset();
    document.getElementById('password').required = true;
    document.getElementById('username').readOnly = false;
    userModal.style.display = 'block';
}

function editUser(username) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.username === username);
    
    if (user) {
        currentUserId = username;
        modalTitle.textContent = 'Edit User';
        
        document.getElementById('username').value = user.username;
        document.getElementById('username').readOnly = true;
        document.getElementById('email').value = user.email;
        document.getElementById('role').value = user.role;
        document.getElementById('is-active').value = user.isActive.toString();
        document.getElementById('password').required = false;
        
        userModal.style.display = 'block';
    }
}

function deleteUser(username) {
    if (confirm('Are you sure you want to delete this user?')) {
        try {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const filteredUsers = users.filter(u => u.username !== username);
            localStorage.setItem('users', JSON.stringify(filteredUsers));
            loadUsers();
            showSuccess('User deleted successfully');
        } catch (error) {
            showError('Error deleting user: ' + error.message);
        }
    }
}

// Export user data to Excel
function exportUserData() {
    try {
        // Get users and login history
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const loginHistory = loadLoginHistory();

        // Create workbook
        const wb = XLSX.utils.book_new();

        // Add Users worksheet
        const usersData = users.map(user => ({
            Username: user.username,
            Email: user.email,
            Role: user.role,
            'Created Date': user.created ? new Date(user.created).toLocaleDateString() : 'N/A',
            Status: user.isActive ? 'Active' : 'Inactive'
        }));
        const usersWS = XLSX.utils.json_to_sheet(usersData);
        XLSX.utils.book_append_sheet(wb, usersWS, 'Users');

        // Add Login History worksheet
        const loginData = loginHistory.map(entry => ({
            Username: entry.username,
            'Login Time': new Date(entry.timestamp).toLocaleString(),
            Status: entry.success ? 'Success' : 'Failed',
            'IP Address': entry.ipAddress || 'N/A'
        }));
        const loginWS = XLSX.utils.json_to_sheet(loginData);
        XLSX.utils.book_append_sheet(wb, loginWS, 'Login History');

        // Generate filename with current date
        const date = new Date().toISOString().split('T')[0];
        const filename = `user_data_${date}.xlsx`;

        // Save file
        XLSX.writeFile(wb, filename);
        showSuccess('Data exported successfully');
    } catch (error) {
        showError('Error exporting data: ' + error.message);
    }
}

function logout() {
    sessionStorage.clear();
    window.location.href = 'index.html';
}

// Utility functions
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function showSuccess(message) {
    alert(message); // Replace with better UI notification in production
}

function showError(message) {
    alert(message); // Replace with better UI notification in production
}