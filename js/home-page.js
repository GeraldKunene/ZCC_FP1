// ========== HOME PAGE - MAIN APPLICATION ==========
// Global variables
let members = [];
let visits = [];

// Load data from localStorage
function loadData() {
    console.log('Loading home page data...');
    
    const storedMembers = localStorage.getItem('kganya_members');
    if (storedMembers) {
        members = JSON.parse(storedMembers);
    } else {
        members = [];
        saveMembers();
    }

    const storedVisits = localStorage.getItem('kganya_visits');
    if (storedVisits) {
        visits = JSON.parse(storedVisits);
    } else {
        visits = [];
    }
    
    updateStatistics();
}

function saveMembers() {
    localStorage.setItem('kganya_members', JSON.stringify(members));
}

// Update statistics on the home page
function updateStatistics() {
    const totalMembers = members.length;
    const activeMembers = members.filter(m => m.status === 'active').length;
    const kganyaMembers = members.filter(m => m.kganya_member === 'Yes').length;
    
    // Get today's visits
    const today = new Date().toISOString().split('T')[0];
    const todayVisits = visits.filter(v => v.date === today).length;
    
    // Animate the numbers
    animateNumber('totalMembers', totalMembers);
    animateNumber('activeMembers', activeMembers);
    animateNumber('todayVisits', todayVisits);
    animateNumber('kganyaMembers', kganyaMembers);
}

// Animate counting numbers
function animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let currentValue = 0;
    const duration = 2000; // 2 seconds
    const stepTime = 20; // milliseconds
    const steps = duration / stepTime;
    const increment = targetValue / steps;
    
    const timer = setInterval(() => {
        currentValue += increment;
        if (currentValue >= targetValue) {
            element.textContent = targetValue;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(currentValue);
        }
    }, stepTime);
}

// Update footer year
function updateCurrentYear() {
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

// Add parallax effect to hero section
function setupParallax() {
    const hero = document.getElementById('homeHero');
    if (!hero) return;
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        hero.style.backgroundPositionY = scrolled * 0.5 + 'px';
    });
}

// Add floating animation to cards
function setupFloatingCards() {
    const cards = document.querySelectorAll('.feature-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
}

// Initialize AOS animations
function initAOS() {
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 1000,
            once: true,
            offset: 100
        });
    }
}

// Add hover effect for stat cards
function setupStatCards() {
    const statCards = document.querySelectorAll('.stat-card-flashing');
    statCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.animation = 'none';
            setTimeout(() => {
                card.style.animation = 'flashBorder 2s ease-in-out infinite';
            }, 10);
        });
    });
}

// Auto-refresh statistics every 30 seconds
function startAutoRefresh() {
    setInterval(() => {
        // Reload data and update statistics
        const storedMembers = localStorage.getItem('kganya_members');
        const storedVisits = localStorage.getItem('kganya_visits');
        
        if (storedMembers) {
            members = JSON.parse(storedMembers);
        }
        if (storedVisits) {
            visits = JSON.parse(storedVisits);
        }
        
        updateStatistics();
        console.log('Statistics auto-refreshed');
    }, 30000); // Refresh every 30 seconds
}

// Initialize the application
function init() {
    console.log('Initializing Home Page...');
    loadData();
    updateCurrentYear();
    setupParallax();
    setupFloatingCards();
    setupStatCards();
    initAOS();
    startAutoRefresh();
    console.log('Home Page initialization complete');
}

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}