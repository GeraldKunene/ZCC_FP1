// config.public.js - Safe to commit to GitHub
// This file has NO secret keys - only public information

// The API URL is public - safe to share
window.API_BASE_URL = 'https://script.google.com/macros/s/AKfycbxoYdfo6aeF3JSpmkRhj4NbxfxUhh21xCr8W_BJWCUCswScBx6ZVPSy4A2V9ityKQ_hmQ/exec';

// No API key needed - we'll validate by domain in Apps Script
window.API_KEY = '';

// Make available globally
var API_BASE_URL = window.API_BASE_URL;
var API_KEY = window.API_KEY;

console.log('✅ Public config loaded');
console.log('Environment:', window.location.hostname);