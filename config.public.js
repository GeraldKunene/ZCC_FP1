// config.public.js - Safe to commit to GitHub
// This file has NO secret keys - only public information

// The API URL is public - safe to share
window.API_BASE_URL = 'https://script.google.com/macros/s/AKfycby2rrkCjmb8INuAdrlmRA_keglAXmCxcA7k5qkLMHZAS-eq0scxJ5yD88yzlUeWBopXqA/exec';

// No API key needed - we'll validate by domain in Apps Script
window.API_KEY = '';

// Make available globally
var API_BASE_URL = window.API_BASE_URL;
var API_KEY = window.API_KEY;

console.log('✅ Public config loaded');
console.log('Environment:', window.location.hostname);