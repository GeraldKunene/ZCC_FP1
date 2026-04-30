// ========== HOME PAGE - MAIN APPLICATION ==========
// Optimized with caching

let members = [];
let visits = [];
let dataLoaded = false;

// Load data with fast initial display
async function loadData() {
    console.log('Loading home page data...');
    
    // Try to load from API with cache
    try {
        // Show loading animation but don't block
        showLoadingAnimation();
        
        // Load members (API will return cached data if available)
        const membersResult = await api.getMembers();
        if (membersResult.success && membersResult.data) {
            members = membersResult.data;
            console.log('Members loaded:', members.length);
        }
        
        // Load visits
        const visitsResult = await api.getVisits();
        if (visitsResult.success && visitsResult.data) {
            visits = visitsResult.data;
            console.log('Visits loaded:', visits.length);
        }
        
        updateStatistics();
        hideLoadingAnimation();
        dataLoaded = true;
        
    } catch (error) {
        console.error('Error loading data:', error);
        hideLoadingAnimation();
    }
}

// Quick update using numbers only (no heavy processing)
function updateStatistics() {
    const totalMembers = members.length;
    const activeMembers = members.filter(m => m.status === 'active' || !m.status).length;
    const kganyaMembers = members.filter(m => m.kganya_member === 'Yes').length;
    
    // Count today's visits efficiently
    const today = new Date().toISOString().split('T')[0];
    let todayVisits = 0;
    for (let i = 0; i < visits.length; i++) {
        const visit = visits[i];
        let visitDate = visit.visit_date || visit.date;
        if (visitDate && visitDate.includes('T')) {
            visitDate = visitDate.split('T')[0];
        }
        if (visitDate === today) todayVisits++;
    }
    
    // Update DOM
    document.getElementById('totalMembers').textContent = totalMembers;
    document.getElementById('activeMembers').textContent = activeMembers;
    document.getElementById('todayVisits').textContent = todayVisits;
    document.getElementById('kganyaMembers').textContent = kganyaMembers;
}

// Loading animations
let loadingTimeout;
function showLoadingAnimation() {
    const statNumbers = ['totalMembers', 'activeMembers', 'todayVisits', 'kganyaMembers'];
    loadingTimeout = setTimeout(() => {
        statNumbers.forEach(id => {
            const el = document.getElementById(id);
            if (el && el.textContent === '0') {
                el.innerHTML = '<span class="spinner-border spinner-border-sm text-success"></span>';
            }
        });
    }, 300); // Only show if loading takes more than 300ms
}

function hideLoadingAnimation() {
    if (loadingTimeout) clearTimeout(loadingTimeout);
}

// Update footer year
function updateCurrentYear() {
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

// Setup animations
function setupParallax() {
    const hero = document.getElementById('homeHero');
    if (!hero) return;
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        hero.style.backgroundPositionY = scrolled * 0.5 + 'px';
    });
}

function setupFloatingCards() {
    const cards = document.querySelectorAll('.feature-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
}

function initAOS() {
    if (typeof AOS !== 'undefined') {
        AOS.init({ duration: 800, once: true, offset: 50 });
    }
}

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

// Auto-refresh every 60 seconds
let refreshInterval;
function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
        if (!document.hidden) {
            api.clearCache(); // Clear cache to force fresh data
            loadData();
        }
    }, 60000);
}

function handleVisibilityChange() {
    if (document.hidden) {
        if (refreshInterval) clearInterval(refreshInterval);
    } else {
        startAutoRefresh();
        loadData();
    }
}

// Initialize
async function init() {
    console.log('Initializing Home Page...');
    await loadData();
    updateCurrentYear();
    setupParallax();
    setupFloatingCards();
    setupStatCards();
    initAOS();
    startAutoRefresh();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    console.log('Home Page initialization complete');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}