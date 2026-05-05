// ========== LOGIN PAGE - SECURE VERSION ==========

const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const togglePasswordBtn = document.getElementById('togglePassword');
const messageDiv = document.getElementById('loginMessage');

function showMessage(message, type) {
    if (!messageDiv) return;
    messageDiv.style.display = 'flex';
    messageDiv.className = `alert-message alert-${type}`;
    messageDiv.innerHTML = `<i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i><span>${escapeHtml(message)}</span>`;
    setTimeout(() => { messageDiv.style.display = 'none'; }, 4000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Toggle Password Visibility
if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        const icon = togglePasswordBtn.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });
}

// Handle form submission
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        if (!username || !password) {
            showMessage('Please enter username and password', 'error');
            return;
        }
        
        const originalBtnHTML = loginBtn.innerHTML;
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="spinner"></span> Authenticating...';
        
        try {
            // Check if API is available
            if (typeof api === 'undefined' || !api.authenticate) {
                console.error('API not available');
                showMessage('Authentication service unavailable. Please try again later.', 'error');
                loginBtn.disabled = false;
                loginBtn.innerHTML = originalBtnHTML;
                return;
            }
            
            // Authenticate via API
            const result = await api.authenticate(username, password);
            console.log('Login response received');
            
            if (result.success) {
                showMessage(`Welcome ${escapeHtml(username)}! Redirecting...`, 'success');
                
                // Session token is already stored by api.authenticate()
                // Redirect to HOME page
                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 1000);
            } else {
                showMessage(result.error || 'Invalid username or password', 'error');
                loginBtn.disabled = false;
                loginBtn.innerHTML = originalBtnHTML;
                passwordInput.value = '';
                passwordInput.focus();
                
                // Clear any old session data
                localStorage.removeItem('zcc_session_token');
                localStorage.removeItem('zcc_auth');
                localStorage.removeItem('zcc_user');
                localStorage.removeItem('zcc_role');
                localStorage.removeItem('zcc_login_time');
            }
        } catch (error) {
            console.error('Login error:', error);
            showMessage('Network error. Please check your connection and try again.', 'error');
            loginBtn.disabled = false;
            loginBtn.innerHTML = originalBtnHTML;
            passwordInput.value = '';
            passwordInput.focus();
        }
    });
}

// Check if user is already logged in
function checkAuth() {
    const isLoggedIn = localStorage.getItem('zcc_auth');
    const loginTime = localStorage.getItem('zcc_login_time');
    const sessionToken = localStorage.getItem('zcc_session_token');
    
    if (isLoggedIn === 'true' && loginTime && sessionToken) {
        const loginDate = new Date(loginTime);
        const now = new Date();
        const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
        
        if (hoursDiff < 8) {
            // Session might still be valid, redirect to home
            window.location.href = 'home.html';
        } else {
            // Session expired - clear storage
            localStorage.removeItem('zcc_auth');
            localStorage.removeItem('zcc_user');
            localStorage.removeItem('zcc_role');
            localStorage.removeItem('zcc_login_time');
            localStorage.removeItem('zcc_session_token');
        }
    }
}

// Add focus effects
document.querySelectorAll('.form-control-glass').forEach(input => {
    input.addEventListener('focus', function() { 
        this.parentElement.style.transform = 'scale(1.01)'; 
    });
    input.addEventListener('blur', function() { 
        this.parentElement.style.transform = 'scale(1)'; 
    });
});

checkAuth();