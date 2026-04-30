// ========== DASHBOARD PAGE - MAIN APPLICATION ==========
// Now pulls data from Google Sheets API

// Data Storage
let members = [];
let visits = [];
let outcomesHistory = [];
let currentFilter = 'monthly';
let startDate = null;
let endDate = null;

// Chart instances
let genderChart, ageGroupChart, kganyaChart, visitsTrendChart;

// Helper Functions
function showMessage(msg, type) {
    const container = document.getElementById("errorMessageContainer");
    const span = document.getElementById("errorText");
    
    if (!container || !span) return;
    
    span.innerText = msg;
    container.style.display = "block";
    
    if(type === "success") {
        container.style.background = "#d1e7dd";
        container.style.color = "#0f5132";
        container.style.borderLeftColor = "#198754";
    } else {
        container.style.background = "#f8d7da";
        container.style.color = "#a71d2a";
        container.style.borderLeftColor = "#dc3545";
    }
    
    setTimeout(() => { 
        container.style.display = "none"; 
    }, 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateCurrentYear() {
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

// Calculate Age from PIN (South African ID format: YYMMDD)
function calculateAgeFromPin(pin) {
    if (!pin || pin.length < 6) return null;
    try {
        let year = parseInt(pin.substring(0, 2));
        let month = parseInt(pin.substring(2, 4)) - 1;
        let day = parseInt(pin.substring(4, 6));
        
        let currentYear = new Date().getFullYear();
        let century = year <= (currentYear % 100) ? 2000 : 1900;
        let birthYear = century + year;
        
        let birthDate = new Date(birthYear, month, day);
        let today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        let m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    } catch(e) {
        return null;
    }
}

// NEW AGE BANDS as requested
function getAgeGroup(age) {
    if (age === null) return 'Unknown';
    if (age < 0) return '<0';
    if (age <= 4) return '1-4';
    if (age <= 9) return '5-9';
    if (age <= 14) return '10-14';
    if (age <= 19) return '15-19';
    if (age <= 24) return '20-24';
    if (age <= 29) return '25-29';
    if (age <= 34) return '30-34';
    if (age <= 39) return '35-39';
    if (age <= 44) return '40-44';
    if (age <= 49) return '45-49';
    return '50+';
}

// Load data from Google Sheets API
async function loadData() {
    showMessage('Loading data from server...', 'success');
    
    try {
        // Load members from API
        const membersResult = await api.getMembers();
        if (membersResult.success && membersResult.data) {
            members = membersResult.data;
            console.log('Members loaded:', members.length);
        } else {
            console.warn('Failed to load members:', membersResult.error);
            members = [];
        }
        
        // Load visits from API
        const visitsResult = await api.getVisits();
        if (visitsResult.success && visitsResult.data) {
            visits = visitsResult.data;
            console.log('Visits loaded:', visits.length);
        } else {
            console.warn('Failed to load visits:', visitsResult.error);
            visits = [];
        }
        
        // Load outcomes from members status
        outcomesHistory = members.filter(m => m.status && m.status !== 'active').map(m => ({
            outcome: m.status,
            date: m.updated_at,
            member_id: m.member_id
        }));
        
        updateDashboard();
        showMessage(`Loaded ${members.length} members and ${visits.length} visits`, 'success');
        
    } catch (error) {
        console.error('Error loading data:', error);
        showMessage('Error loading data. Please refresh the page.', 'error');
    }
}

// Filter visits by date range
function filterVisitsByDateRange(visitsArray) {
    if (!startDate && !endDate) return visitsArray;
    
    return visitsArray.filter(visit => {
        const visitDate = new Date(visit.visit_date);
        if (startDate && visitDate < new Date(startDate)) return false;
        if (endDate) {
            const endDateTime = new Date(endDate);
            endDateTime.setHours(23, 59, 59);
            if (visitDate > endDateTime) return false;
        }
        return true;
    });
}

// Set date range based on filter type
function setDateRangeFromFilter(filter) {
    const today = new Date();
    let sDate, eDate;
    
    switch(filter) {
        case 'daily':
            sDate = new Date(today);
            eDate = new Date(today);
            break;
        case 'monthly':
            sDate = new Date(today.getFullYear(), today.getMonth(), 1);
            eDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            break;
        case 'quarterly':
            let quarter = Math.floor(today.getMonth() / 3);
            sDate = new Date(today.getFullYear(), quarter * 3, 1);
            eDate = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
            break;
        case 'yearly':
            sDate = new Date(today.getFullYear(), 0, 1);
            eDate = new Date(today.getFullYear(), 11, 31);
            break;
        default:
            return;
    }
    
    startDate = sDate.toISOString().split('T')[0];
    endDate = eDate.toISOString().split('T')[0];
    
    document.getElementById('startDate').value = startDate;
    document.getElementById('endDate').value = endDate;
}

// Update all dashboard components
function updateDashboard() {
    updateStatistics();
    updateCharts();
    updateCommittees();
    updateSkills();
    updateOutcomes();
    renderMembersTable();
}

// Update statistics cards
function updateStatistics() {
    const filteredVisits = filterVisitsByDateRange(visits);
    const totalMembers = members.length;
    const maleCount = members.filter(m => m.gender === 'Male').length;
    const femaleCount = members.filter(m => m.gender === 'Female').length;
    const kganyaCount = members.filter(m => m.kganya_member === 'Yes').length;
    
    document.getElementById('totalMembers').innerText = totalMembers;
    document.getElementById('genderRatio').innerText = `${maleCount}:${femaleCount}`;
    document.getElementById('totalVisits').innerText = filteredVisits.length;
    document.getElementById('kganyaSubscribers').innerText = kganyaCount;
    
    const committeeMembers = members.filter(m => m.in_executive_committee === true || m.in_executive_committee === 'TRUE').length;
    document.getElementById('committeeMembers').innerText = committeeMembers;
}

// Initialize and update charts
function updateCharts() {
    // Gender Distribution
    const maleCount = members.filter(m => m.gender === 'Male').length;
    const femaleCount = members.filter(m => m.gender === 'Female').length;
    
    if (genderChart) genderChart.destroy();
    const genderCtx = document.getElementById('genderChart').getContext('2d');
    genderChart = new Chart(genderCtx, {
        type: 'pie',
        data: {
            labels: ['Male', 'Female'],
            datasets: [{ data: [maleCount, femaleCount], backgroundColor: ['#2e7d32', '#ffc107'], borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } }
    });
    
    // Age Group Distribution with NEW age bands
    const ageGroupOrder = ['<0', '1-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50+', 'Unknown'];
    const ageGroups = {
        '<0': 0, '1-4': 0, '5-9': 0, '10-14': 0, '15-19': 0, 
        '20-24': 0, '25-29': 0, '30-34': 0, '35-39': 0, '40-44': 0, '45-49': 0, 
        '50+': 0, 'Unknown': 0
    };
    
    members.forEach(m => {
        const age = calculateAgeFromPin(m.pin);
        const group = getAgeGroup(age);
        if (ageGroups[group] !== undefined) {
            ageGroups[group]++;
        } else {
            ageGroups['Unknown']++;
        }
    });
    
    // Create ordered arrays
    const orderedLabels = [];
    const orderedData = [];
    ageGroupOrder.forEach(group => {
        if (ageGroups[group] !== undefined && ageGroups[group] > 0) {
            orderedLabels.push(group);
            orderedData.push(ageGroups[group]);
        }
    });
    // Add any groups not in order that have values
    for (const [group, count] of Object.entries(ageGroups)) {
        if (count > 0 && !orderedLabels.includes(group) && group !== 'Unknown') {
            orderedLabels.push(group);
            orderedData.push(count);
        }
    }
    if (ageGroups['Unknown'] > 0) {
        orderedLabels.push('Unknown');
        orderedData.push(ageGroups['Unknown']);
    }
    
    const ageColors = ['#1b5e20', '#2e7d32', '#388e3c', '#43a047', '#4caf50', '#66bb6a', '#81c784', '#a5d6a7', '#c8e6c9', '#e8f5e9', '#f1f8e9', '#f9fbe7', '#e0e0e0'];
    
    if (ageGroupChart) ageGroupChart.destroy();
    const ageCtx = document.getElementById('ageGroupChart').getContext('2d');
    ageGroupChart = new Chart(ageCtx, {
        type: 'pie',
        data: {
            labels: orderedLabels,
            datasets: [{ data: orderedData, backgroundColor: ageColors.slice(0, orderedLabels.length), borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } } }
    });
    
    // Kganya vs Non-Kganya
    const kganyaYes = members.filter(m => m.kganya_member === 'Yes').length;
    const kganyaNo = members.filter(m => m.kganya_member === 'No' || !m.kganya_member).length;
    
    if (kganyaChart) kganyaChart.destroy();
    const kganyaCtx = document.getElementById('kganyaChart').getContext('2d');
    kganyaChart = new Chart(kganyaCtx, {
        type: 'bar',
        data: {
            labels: ['Pays Kganya', 'Does Not Pay'],
            datasets: [{ label: 'Member Count', data: [kganyaYes, kganyaNo], backgroundColor: ['#2e7d32', '#dc3545'], borderRadius: 8 }]
        },
        options: { responsive: true, maintainAspectRatio: true, scales: { y: { beginAtZero: true, grid: { color: '#e0e0e0' } } }, plugins: { legend: { position: 'bottom' } } }
    });
    
    // Visits Trend
    const filteredVisits = filterVisitsByDateRange(visits);
    const visitsByDate = {};
    filteredVisits.forEach(v => {
        const visitDate = v.visit_date ? v.visit_date.split('T')[0] : v.date;
        visitsByDate[visitDate] = (visitsByDate[visitDate] || 0) + 1;
    });
    const sortedDates = Object.keys(visitsByDate).sort();
    const visitCounts = sortedDates.map(d => visitsByDate[d]);
    
    if (visitsTrendChart) visitsTrendChart.destroy();
    const trendCtx = document.getElementById('visitsTrendChart').getContext('2d');
    visitsTrendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: sortedDates,
            datasets: [{ label: 'Number of Visits', data: visitCounts, borderColor: '#025205', backgroundColor: 'rgba(2, 82, 5, 0.1)', fill: true, tension: 0.3, pointBackgroundColor: '#ffc107', pointRadius: 4 }]
        },
        options: { responsive: true, maintainAspectRatio: true, scales: { y: { beginAtZero: true, grid: { color: '#e0e0e0' } } }, plugins: { legend: { position: 'bottom' } } }
    });
}

// Update Committee Distribution
function updateCommittees() {
    const committeeList = document.getElementById('committeeList');
    const committeeCounts = {};
    
    members.forEach(m => {
        const inCommittee = m.in_executive_committee === true || m.in_executive_committee === 'TRUE';
        if (inCommittee && m.executive_committee) {
            let committeeName = m.executive_committee.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            committeeCounts[committeeName] = (committeeCounts[committeeName] || 0) + 1;
        }
    });
    
    if (Object.keys(committeeCounts).length === 0) {
        committeeList.innerHTML = '<p class="text-muted">No committee members found</p>';
        return;
    }
    
    let html = '';
    for (const [committee, count] of Object.entries(committeeCounts)) {
        html += `<div class="data-item"><span class="data-label">${committee}</span><span class="data-value">${count} member(s)</span></div>`;
    }
    committeeList.innerHTML = html;
}

// Update Skills Distribution
function updateSkills() {
    const skillsList = document.getElementById('skillsList');
    const skillsCount = {};
    const trainedCount = { yes: 0, no: 0, in_progress: 0 };
    
    members.forEach(m => {
        if (m.skills) {
            const skillsArray = m.skills.split(',').map(s => s.trim());
            skillsArray.forEach(skill => {
                if (skill) skillsCount[skill] = (skillsCount[skill] || 0) + 1;
            });
        }
        const trained = m.formally_trained_on_skills;
        if (trained) {
            if (trained.toLowerCase() === 'yes') trainedCount.yes++;
            else if (trained.toLowerCase() === 'no') trainedCount.no++;
            else if (trained.toLowerCase() === 'in_progress') trainedCount.in_progress++;
        }
    });
    
    let html = '<div class="data-item"><strong>Top Skills:</strong></div>';
    const sortedSkills = Object.entries(skillsCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (sortedSkills.length === 0) {
        html += '<div class="data-item"><span class="text-muted">No skills recorded</span></div>';
    } else {
        sortedSkills.forEach(([skill, count]) => {
            html += `<div class="data-item"><span class="data-label">${skill}</span><span class="data-value">${count} member(s)</span></div>`;
        });
    }
    
    html += '<div class="data-item" style="margin-top: 12px;"><strong>Formal Training:</strong></div>';
    html += `<div class="data-item"><span class="data-label">✅ Trained:</span><span class="data-value">${trainedCount.yes || 0}</span></div>`;
    html += `<div class="data-item"><span class="data-label">❌ Not Trained:</span><span class="data-value">${trainedCount.no || 0}</span></div>`;
    html += `<div class="data-item"><span class="data-label">🔄 In Progress:</span><span class="data-value">${trainedCount.in_progress || 0}</span></div>`;
    
    skillsList.innerHTML = html;
}

// Update Outcomes Statistics
function updateOutcomes() {
    const outcomesContainer = document.getElementById('outcomesList');
    const statusCounts = { active: 0, backslided: 0, deceased: 0, transfer: 0 };
    
    members.forEach(m => {
        const status = m.status || 'active';
        if (status === 'active') statusCounts.active++;
        else if (status === 'backslided') statusCounts.backslided++;
        else if (status === 'deceased') statusCounts.deceased++;
        else if (status === 'transfer_out') statusCounts.transfer++;
        else statusCounts.active++;
    });
    
    let html = `
        <div class="outcome-card"><div class="outcome-number">${statusCounts.active}</div><div class="outcome-label">Active Members</div></div>
        <div class="outcome-card"><div class="outcome-number">${statusCounts.backslided}</div><div class="outcome-label">Backslided</div></div>
        <div class="outcome-card"><div class="outcome-number">${statusCounts.deceased}</div><div class="outcome-label">Deceased</div></div>
        <div class="outcome-card"><div class="outcome-number">${statusCounts.transfer}</div><div class="outcome-label">Transferred Out</div></div>
    `;
    
    outcomesContainer.innerHTML = html;
}

// Render Members Data Table
function renderMembersTable() {
    const tbody = document.getElementById('membersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (members.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="text-center text-muted py-4">No members found. Register a new member.</td></tr>';
        return;
    }
    
    members.forEach(m => {
        const row = tbody.insertRow();
        const age = calculateAgeFromPin(m.pin);
        const ageGroup = getAgeGroup(age);
        
        // Age group class for styling
        let ageGroupClass = '';
        if (ageGroup === '<0') ageGroupClass = 'age-child';
        else if (ageGroup === '1-4' || ageGroup === '5-9' || ageGroup === '10-14') ageGroupClass = 'age-child';
        else if (ageGroup === '15-19') ageGroupClass = 'age-youth';
        else if (ageGroup === '20-24' || ageGroup === '25-29' || ageGroup === '30-34' || ageGroup === '35-39' || ageGroup === '40-44' || ageGroup === '45-49') ageGroupClass = 'age-adult';
        else if (ageGroup === '50+') ageGroupClass = 'age-senior';
        
        let statusClass = 'status-active';
        const memberStatus = m.status || 'active';
        if (memberStatus === 'backslided') statusClass = 'status-backslided';
        else if (memberStatus === 'deceased') statusClass = 'status-deceased';
        else if (memberStatus === 'transfer_out') statusClass = 'status-transfer';
        
        const committee = (m.in_executive_committee === true || m.in_executive_committee === 'TRUE') 
            ? (m.executive_committee ? m.executive_committee.replace(/_/g, ' ') : 'Yes') 
            : 'None';
        const skillsDisplay = m.skills ? (m.skills.length > 30 ? m.skills.substring(0, 30) + '...' : m.skills) : 'None';
        
        row.insertCell(0).innerText = m.firstname || '';
        row.insertCell(1).innerText = m.surname || '';
        row.insertCell(2).innerText = m.pin || '';
        row.insertCell(3).innerText = m.gender || 'N/A';
        row.insertCell(4).innerText = age !== null ? age : 'N/A';
        row.insertCell(5).innerHTML = `<span class="age-badge ${ageGroupClass}">${ageGroup}</span>`;
        row.insertCell(6).innerText = m.branch || 'N/A';
        row.insertCell(7).innerHTML = m.kganya_member === 'Yes' ? '<span style="color:#2e7d32;"><i class="fas fa-check-circle"></i> Yes</span>' : '<span style="color:#dc3545;"><i class="fas fa-times-circle"></i> No</span>';
        row.insertCell(8).innerText = committee;
        row.insertCell(9).innerText = skillsDisplay;
        row.insertCell(10).innerHTML = `<span class="status-badge ${statusClass}">${memberStatus === 'transfer_out' ? 'Transferred' : (memberStatus || 'Active')}</span>`;
    });
}

// Export data to CSV
function exportToCSV() {
    const csvRows = [];
    const headers = ['Firstname', 'Surname', 'PIN', 'Gender', 'Age', 'Age Group', 'Branch', 'Contact', 'Kganya Member', 'Kganya Book', 'Church Activity', 'In Committee', 'Committee Name', 'Committee Role', 'Employment Status', 'Occupation', 'Education Level', 'Skills', 'Formally Trained', 'Status'];
    csvRows.push(headers.join(','));
    
    members.forEach(m => {
        const age = calculateAgeFromPin(m.pin);
        const ageGroup = getAgeGroup(age);
        const values = [
            `"${(m.firstname || '').replace(/"/g, '""')}"`,
            `"${(m.surname || '').replace(/"/g, '""')}"`,
            `"${(m.pin || '').replace(/"/g, '""')}"`,
            `"${(m.gender || '').replace(/"/g, '""')}"`,
            age !== null ? age : '',
            `"${ageGroup.replace(/"/g, '""')}"`,
            `"${(m.branch || '').replace(/"/g, '""')}"`,
            `"${(m.contact || '').replace(/"/g, '""')}"`,
            `"${(m.kganya_member || 'No').replace(/"/g, '""')}"`,
            `"${(m.kganya_book_number || '').replace(/"/g, '""')}"`,
            `"${(m.church_activity || '').replace(/"/g, '""')}"`,
            (m.in_executive_committee === true || m.in_executive_committee === 'TRUE') ? 'Yes' : 'No',
            `"${(m.executive_committee || '').replace(/_/g, ' ').replace(/"/g, '""')}"`,
            `"${(m.executive_committee_role || '').replace(/"/g, '""')}"`,
            `"${(m.employment_status || '').replace(/"/g, '""')}"`,
            `"${(m.occupation || '').replace(/"/g, '""')}"`,
            `"${(m.education_level || '').replace(/"/g, '""')}"`,
            `"${(m.skills || '').replace(/"/g, '""')}"`,
            `"${(m.formally_trained_on_skills || '').replace(/"/g, '""')}"`,
            `"${(m.status || 'active').replace(/"/g, '""')}"`
        ];
        csvRows.push(values.join(','));
    });
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `church_members_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage('Data exported successfully!', 'success');
}

// Setup Event Listeners
function setupEventListeners() {
    const filterDaily = document.getElementById('filterDailyBtn');
    const filterMonthly = document.getElementById('filterMonthlyBtn');
    const filterQuarterly = document.getElementById('filterQuarterlyBtn');
    const filterYearly = document.getElementById('filterYearlyBtn');
    const applyDateFilter = document.getElementById('applyDateFilterBtn');
    const exportCsv = document.getElementById('exportCsvBtn');
    const exportTableCsv = document.getElementById('exportTableCsvBtn');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    const setActiveFilter = (activeBtn) => {
        [filterDaily, filterMonthly, filterQuarterly, filterYearly].forEach(btn => {
            if (btn) btn.classList.remove('active');
        });
        if (activeBtn) activeBtn.classList.add('active');
    };
    
    if (filterDaily) {
        filterDaily.addEventListener('click', () => {
            setActiveFilter(filterDaily);
            currentFilter = 'daily';
            setDateRangeFromFilter('daily');
            updateDashboard();
        });
    }
    
    if (filterMonthly) {
        filterMonthly.addEventListener('click', () => {
            setActiveFilter(filterMonthly);
            currentFilter = 'monthly';
            setDateRangeFromFilter('monthly');
            updateDashboard();
        });
    }
    
    if (filterQuarterly) {
        filterQuarterly.addEventListener('click', () => {
            setActiveFilter(filterQuarterly);
            currentFilter = 'quarterly';
            setDateRangeFromFilter('quarterly');
            updateDashboard();
        });
    }
    
    if (filterYearly) {
        filterYearly.addEventListener('click', () => {
            setActiveFilter(filterYearly);
            currentFilter = 'yearly';
            setDateRangeFromFilter('yearly');
            updateDashboard();
        });
    }
    
    if (applyDateFilter) {
        applyDateFilter.addEventListener('click', () => {
            setActiveFilter(null);
            startDate = startDateInput.value;
            endDate = endDateInput.value;
            if (!startDate && !endDate) {
                showMessage('Please select a date range', 'error');
                return;
            }
            updateDashboard();
            showMessage('Date filter applied successfully', 'success');
        });
    }
    
    if (exportCsv) exportCsv.addEventListener('click', exportToCSV);
    if (exportTableCsv) exportTableCsv.addEventListener('click', exportToCSV);
}

// Refresh data from server
async function refreshData() {
    showMessage('Refreshing data from server...', 'success');
    await loadData();
}

// Initialize Dashboard
async function init() {
    // Set default date filter
    setDateRangeFromFilter('monthly');
    updateCurrentYear();
    setupEventListeners();
    
    // Load data from API
    await loadData();
}

// Make refresh function available globally
window.refreshData = refreshData;

// Start the application
init();