// config.public.js
window.APP_CONFIG = {
    // IMPORTANT: Replace with your NEW deployment URL
    apiUrl: 'https://script.google.com/macros/s/AKfycbz8D9qESy8VUI98NJ1Vh1WMlKowQDZv4UmD0JEtS_GbV1Z_QjlFmjRJ4k64yInZM0Ta/exec',
    sessionVersion: '1',
    appName: 'Statistics Management System'
};

window.API_BASE_URL = window.APP_CONFIG.apiUrl;
window.API_KEY = '';

console.log('✅ Public config loaded');
console.log('API URL:', window.APP_CONFIG.apiUrl);