// config.public.js - Safe to commit to GitHub
// This file has NO secret keys - only public information

// The API URL is public - safe to share
window.API_BASE_URL = 'https://script.google.com/macros/s/AKfycbyQ5Lg7mu5EPHNDMO6Z8balEf0_iOlpeMVZ2R-3MF_j6ZvJm5lr2LY2_i8fwRqR-Y_pEA/exec';

// No API key needed - we'll validate by domain in Apps Script
window.API_KEY = '';

// Make available globally
var API_BASE_URL = window.API_BASE_URL;
var API_KEY = window.API_KEY;

console.log('✅ Public config loaded');
console.log('Environment:', window.location.hostname);