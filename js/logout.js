// ========== SHARED LOGOUT MODULE - SECURE VERSION ==========
// Load this file on every page that has a logout button

(function() {
    let isLoggingOut = false;
    
    function initLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (logoutBtn) {
            // Remove any existing listeners to prevent duplicates
            const newLogoutBtn = logoutBtn.cloneNode(true);
            logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
            
            newLogoutBtn.addEventListener('click', async function(e) {
                e.preventDefault();
                
                // Prevent multiple logout attempts
                if (isLoggingOut) return;
                isLoggingOut = true;
                
                // Show loading state
                const originalText = newLogoutBtn.innerHTML;
                newLogoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging out...';
                newLogoutBtn.disabled = true;
                
                try {
                    // Call API logout if available (this will invalidate session on server)
                    if (typeof api !== 'undefined' && api.logout) {
                        await api.logout();
                    }
                    
                    // Clear ALL localStorage items (defensive)
                    const itemsToRemove = [
                        'zcc_session_token',
                        'zcc_csrf_token',
                        'zcc_auth',
                        'zcc_user',
                        'zcc_role',
                        'zcc_login_time',
                        'zcc_members',
                        'zcc_events',
                        'zcc_event_attendances',
                        'zcc_payments'
                    ];
                    
                    itemsToRemove.forEach(item => localStorage.removeItem(item));
                    
                    // Clear any cached data in the api instance
                    if (typeof api !== 'undefined' && api.clearCache) {
                        api.clearCache();
                    }
                    
                    // Redirect to login page
                    window.location.href = '../index.html';
                } catch (error) {
                    console.error('Logout error:', error);
                    // Still clear localStorage and redirect
                    localStorage.clear();
                    window.location.href = '../index.html';
                }
            });
        }
    }
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLogout);
    } else {
        initLogout();
    }
})();