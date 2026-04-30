// ========== HOME PAGE - MAIN APPLICATION ==========
// Now pulls data from Google Sheets API

// Global variables
let members = [];
let visits = [];

// Load data from Google Sheets API
async function loadData() {
    console.log('Loading home page data from API...');
    
    try {
        // Load members from API
        const membersResult = await api.getMembers();
        if (membersResult.success && membersResult.data) {
            members = membersResult.data;
            console.log('Members loaded from API:', members.length);
        } else {
            console.warn('Failed to load members:', membersResult.error);
            members = [];
        }
        
        // Load visits from API
        const visitsResult = await api.getVisits();
        if (visitsResult.success && visitsResult.data) {
            visits = visitsResult.data;
            console.log('Visits loaded from API:', visits.length);
        } else {
            console.warn('Failed to load visits:', visitsResult.error);
            visits = [];
        }
        
        updateStatistics();
        
    } catch (error) {
        console.error('Error loading data:', error);
        // Try to load from localStorage as fallback
        const storedMembers = localStorage.getItem('kganya_members');
        if (storedMembers) {
            members = JSON.parse(storedMembers);
        }
        const storedVisits = localStorage.getItem('kganya_visits');
        if (storedVisits) {
            visits = JSON.parse(storedVisits);
        }
        updateStatistics();
    }
}

// Update statistics on the home page
function updateStatistics() {
    const totalMembers = members.length;
    
    // Count active members (status === 'active' or no status)
    const activeMembers = members.filter(m => m.status === 'active' || !m.status).length;
    
    // Count Kganya members
    const kganyaMembers = members.filter(m => m.kganya_member === 'Yes').length;
    
    // Get today's visits
    const today = new Date().toISOString().split('T')[0];
    const todayVisits = visits.filter(v => {
        const visitDate = v.visit_date || v.date;
        // Handle full timestamp format
        let dateToCompare = visitDate;
        if (typeof visitDate === 'string' && visitDate.includes('T')) {
            dateToCompare = visitDate.split('T')[0];
        }
        return dateToCompare === today;
    }).length;
    
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
    const duration = 2000;
    const stepTime = 20;
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
        loadData();
    }, 30000);
}

// Initialize the application
async function init() {
    console.log('Initializing Home Page...');
    await loadData();
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