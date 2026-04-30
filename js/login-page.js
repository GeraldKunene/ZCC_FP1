// ========== LOGIN PAGE - MAIN APPLICATION ==========

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
    messageDiv.innerHTML = `<i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i><span>${message}</span>`;
    setTimeout(() => { messageDiv.style.display = 'none'; }, 4000);
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

// Handle form submission using the api object
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        if (!username || !password) {
            showMessage('Please enter username and password', 'error');
            return;
        }
        
        // Show loading state
        const originalBtnHTML = loginBtn.innerHTML;
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="spinner"></span> Authenticating...';
        
        try {
            // Use the api object to authenticate
            const result = await api.authenticate(username, password);
            console.log('Login response:', result);
            
            if (result.success) {
                showMessage(`Welcome ${username}! Redirecting...`, 'success');
                
                // Store login state
                localStorage.setItem('zcc_auth', 'true');
                localStorage.setItem('zcc_user', username);
                localStorage.setItem('zcc_role', result.data?.role || 'admin');
                localStorage.setItem('zcc_login_time', new Date().toISOString());
                
                // Redirect to home page
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                showMessage(result.error || 'Invalid username or password', 'error');
                loginBtn.disabled = false;
                loginBtn.innerHTML = originalBtnHTML;
                passwordInput.value = '';
                passwordInput.focus();
            }
        } catch (error) {
            console.error('Login error:', error);
            showMessage('Network error. Please try again.', 'error');
            loginBtn.disabled = false;
            loginBtn.innerHTML = originalBtnHTML;
        }
    });
}

// Check if user is already logged in
function checkAuth() {
    const isLoggedIn = localStorage.getItem('zcc_auth');
    const loginTime = localStorage.getItem('zcc_login_time');
    
    if (isLoggedIn === 'true' && loginTime) {
        const loginDate = new Date(loginTime);
        const now = new Date();
        const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
        
        if (hoursDiff < 8) {
            // Already logged in, redirect to home
            window.location.href = 'index.html';
        } else {
            // Session expired
            localStorage.removeItem('zcc_auth');
            localStorage.removeItem('zcc_user');
            localStorage.removeItem('zcc_role');
            localStorage.removeItem('zcc_login_time');
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

// Run auth check on page load
checkAuth();