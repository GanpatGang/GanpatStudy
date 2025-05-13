// Store uploaded files (in a real application, this would be in a database)
let uploadedFiles = [];

// Login function
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const userType = document.getElementById('userType').value;
    const errorDiv = document.getElementById('loginError');
    const loginBtn = document.querySelector('.login-btn');

    try {
        // Clear previous error
        if (errorDiv) {
            errorDiv.textContent = '';
        }

        // Disable login button while processing
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.textContent = 'Logging in...';
        }

        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.username === username);

        if (!user) {
            throw new Error('User not found');
        }

        if (!user.isActive) {
            throw new Error('Account is inactive');
        }

        if (user.password !== password) {
            throw new Error('Invalid password');
        }

        if (user.role !== userType) {
            throw new Error('Invalid user type selected');
        }

        // Login successful
        // Store user info in session storage
        sessionStorage.setItem('userType', user.role);
        sessionStorage.setItem('username', user.username);

        // Create login history entry
        const loginData = {
            username: username,
            userType: userType,
            timestamp: new Date().toISOString(),
            success: true,
            ipAddress: 'Local',
            browserInfo: navigator.userAgent
        };

        // Store login history
        const existingHistory = JSON.parse(localStorage.getItem('loginHistory') || '[]');
        existingHistory.push(loginData);
        localStorage.setItem('loginHistory', JSON.stringify(existingHistory));

        // Redirect to appropriate dashboard
        switch (user.role) {
            case 'admin':
                window.location.href = 'admin-dashboard.html';
                break;
            case 'teacher':
                window.location.href = 'teacher-dashboard.html';
                break;
            case 'student':
                window.location.href = 'student-dashboard.html';
                break;
            default:
                throw new Error('Invalid user role');
        }
    } catch (error) {
        // Store failed login attempt
        const loginData = {
            username: username,
            userType: userType,
            timestamp: new Date().toISOString(),
            success: false,
            ipAddress: 'Local',
            browserInfo: navigator.userAgent
        };
        const existingHistory = JSON.parse(localStorage.getItem('loginHistory') || '[]');
        existingHistory.push(loginData);
        localStorage.setItem('loginHistory', JSON.stringify(existingHistory));

        // Show error message
        if (errorDiv) {
            errorDiv.textContent = error.message;
        } else {
            alert(error.message);
        }
    } finally {
        // Re-enable login button
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
    }
}

// Show dashboard based on user type
function showDashboard(userType) {
    const loginContainer = document.querySelector('.login-container');
    loginContainer.style.display = 'none';

    const container = document.querySelector('.container');
    container.innerHTML = `
        <div class="dashboard">
            <div class="dashboard-header">
                <h2>Welcome ${userType}</h2>
                <button class="logout-btn" onclick="logout()">Logout</button>
            </div>
            ${getDashboardContent(userType)}
        </div>
    `;

    if (userType === 'teacher') {
        initializeUploadFunctionality();
    }
    displayFiles();
}

// Get dashboard content based on user type
function getDashboardContent(userType) {
    if (userType === 'teacher') {
        return `
            <div class="upload-section">
                <h3>Upload Study Materials</h3>
                <input type="file" id="fileInput" multiple>
                <button onclick="uploadFiles()">Upload</button>
            </div>
            <div class="file-container" id="fileContainer"></div>
        `;
    } else if (userType === 'student') {
        return `
            <div class="file-container" id="fileContainer"></div>
        `;
    } else {
        return `
            <div class="admin-panel">
                <h3>Admin Panel</h3>
                <p>Manage users and system settings here.</p>
            </div>
        `;
    }
}

// Initialize file upload functionality
function initializeUploadFunctionality() {
    const fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', handleFileSelect);
}

// Handle file selection
function handleFileSelect(event) {
    const files = event.target.files;
    // Handle the selected files
    console.log('Selected files:', files);
}

// Upload files
function uploadFiles() {
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;

    for (let file of files) {
        uploadedFiles.push({
            name: file.name,
            type: file.type,
            size: file.size,
            uploadDate: new Date().toLocaleString()
        });
    }

    displayFiles();
    fileInput.value = '';
}

// Display uploaded files
function displayFiles() {
    const fileContainer = document.getElementById('fileContainer');
    if (!fileContainer) return;

    fileContainer.innerHTML = uploadedFiles.map(file => `
        <div class="file-item">
            <h4>${file.name}</h4>
            <p>Type: ${file.type || 'N/A'}</p>
            <p>Size: ${formatFileSize(file.size)}</p>
            <p>Uploaded: ${file.uploadDate}</p>
        </div>
    `).join('');
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Logout function
function logout() {
    location.reload();
} 