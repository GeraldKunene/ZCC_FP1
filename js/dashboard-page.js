// ========== DASHBOARD PAGE - MAIN APPLICATION ==========
let members = [];
let visits = [];
let visitsStartDate = null, visitsEndDate = null;
let regStartDate = null, regEndDate = null;
let currentGenderFilter = 'all';

// Chart instances
let memberGenderChart, memberAgeChart, memberCommitteeChart, memberActivityChart;
let visitGenderChart, visitAgeChart, visitCommitteeChart, visitActivityChart;
let kganyaSubscribersChart, kganyaGenderChart, kganyaVsNonChart, kganyaExecutiveChart;
let employmentGenderChart, employmentCommitteeChart, educationLevelChart;
let trainedGenderChart, trainedCommitteeChart;

// Chart.js Data Labels Plugin - Register it
Chart.register({
    id: 'dataLabels',
    afterDatasetsDraw(chart, args, options) {
        const { ctx, data, chartArea: { top, bottom, left, right, width, height } } = chart;
        ctx.save();
        chart.data.datasets.forEach((dataset, datasetIndex) => {
            const meta = chart.getDatasetMeta(datasetIndex);
            if (!meta.hidden) {
                meta.data.forEach((element, index) => {
                    const value = dataset.data[index];
                    if (value !== undefined && value !== null && value !== 0) {
                        const position = element.tooltipPosition();
                        let x = position.x;
                        let y = position.y;
                        
                        // Adjust position based on chart type
                        if (chart.config.type === 'bar') {
                            x = element.x;
                            y = element.y - 8;
                        } else if (chart.config.type === 'line') {
                            x = position.x;
                            y = position.y - 10;
                        } else if (chart.config.type === 'pie' || chart.config.type === 'doughnut') {
                            const midAngle = element.startAngle + (element.endAngle - element.startAngle) / 2;
                            x = element.x + Math.cos(midAngle) * (element.outerRadius * 0.7);
                            y = element.y + Math.sin(midAngle) * (element.outerRadius * 0.7);
                        }
                        
                        ctx.font = `bold ${options.fontSize || 12}px 'Inter'`;
                        ctx.fillStyle = options.fontColor || '#333';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(value, x, y);
                    }
                });
            }
        });
        ctx.restore();
    }
});

function showMessage(msg, type) {
    const container = document.getElementById("errorMessageContainer");
    const span = document.getElementById("errorText");
    if (!container) return;
    span.innerText = msg;
    container.style.display = "block";
    container.style.background = type === "success" ? "#d1e7dd" : "#f8d7da";
    container.style.color = type === "success" ? "#0f5132" : "#a71d2a";
    container.style.borderLeftColor = type === "success" ? "#198754" : "#dc3545";
    setTimeout(() => container.style.display = "none", 3000);
}

function updateCurrentYear() {
    const yearElement = document.getElementById('currentYear');
    if (yearElement) yearElement.textContent = new Date().getFullYear();
}

function getAgeGroup(age) {
    if (age === null) return 'Unknown';
    if (age <= 4) return '1-4'; if (age <= 9) return '5-9'; if (age <= 14) return '10-14';
    if (age <= 19) return '15-19'; if (age <= 24) return '20-24'; if (age <= 29) return '25-29';
    if (age <= 34) return '30-34'; if (age <= 39) return '35-39'; if (age <= 44) return '40-44';
    if (age <= 49) return '45-49'; return '50+';
}

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
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    } catch(e) { return null; }
}

async function loadData() {
    showMessage('Loading data from server...', 'success');
    try {
        const membersResult = await api.getMembers();
        if (membersResult.success && membersResult.data) members = membersResult.data;
        else members = [];
        
        const visitsResult = await api.getVisits();
        if (visitsResult.success && visitsResult.data) visits = visitsResult.data;
        else visits = [];
        
        updateAllDashboards();
        showMessage(`Loaded ${members.length} members and ${visits.length} visits`, 'success');
    } catch (error) {
        console.error('Error loading data:', error);
        showMessage('Error loading data', 'error');
    }
}

function updateAllDashboards() {
    updateVisitsStatistics();
    updateTotalStatisticsAndCharts();
    updateKganyaStatistics();
    updateSkillsStatistics();
}

function updateVisitsStatistics() {
    let filteredVisits = [...visits];
    if (visitsStartDate) filteredVisits = filteredVisits.filter(v => v.visit_date >= visitsStartDate);
    if (visitsEndDate) filteredVisits = filteredVisits.filter(v => v.visit_date <= visitsEndDate);
    
    const memberMap = new Map();
    members.forEach(m => memberMap.set(m.member_id, m));
    
    let total = 0, female = 0, male = 0, mokhukhu = 0, femaleChoir = 0, sundaySchool = 0, executive = 0;
    filteredVisits.forEach(v => {
        const m = memberMap.get(v.member_id);
        if (m) {
            total++;
            if (m.gender === 'Female') female++;
            if (m.gender === 'Male') male++;
            if (m.church_activity === 'mokhukhu') mokhukhu++;
            if (m.church_activity === 'female_choir') femaleChoir++;
            if (m.church_activity === 'sunday_school') sundaySchool++;
            if (m.in_executive_committee === true || m.in_executive_committee === 'TRUE') executive++;
        }
    });
    document.getElementById('totalVisitsCount').innerText = total;
    document.getElementById('femaleVisitsCount').innerText = female;
    document.getElementById('maleVisitsCount').innerText = male;
    document.getElementById('mokhukhuVisitsCount').innerText = mokhukhu;
    document.getElementById('femaleChoirVisitsCount').innerText = femaleChoir;
    document.getElementById('sundaySchoolVisitsCount').innerText = sundaySchool;
    document.getElementById('executiveVisitsCount').innerText = executive;
}

function getFilteredMembersByRegistration() {
    let filtered = [...members];
    if (regStartDate) filtered = filtered.filter(m => (m.created_at || '').split('T')[0] >= regStartDate);
    if (regEndDate) filtered = filtered.filter(m => (m.created_at || '').split('T')[0] <= regEndDate);
    if (currentGenderFilter !== 'all') filtered = filtered.filter(m => m.gender === currentGenderFilter);
    return filtered;
}

function getFilteredVisitsForCharts() {
    let filtered = [...visits];
    if (visitsStartDate) filtered = filtered.filter(v => v.visit_date >= visitsStartDate);
    if (visitsEndDate) filtered = filtered.filter(v => v.visit_date <= visitsEndDate);
    return filtered;
}

function updateTotalStatisticsAndCharts() {
    const filteredMembers = getFilteredMembersByRegistration();
    const maleCount = filteredMembers.filter(m => m.gender === 'Male').length;
    const femaleCount = filteredMembers.filter(m => m.gender === 'Female').length;
    const committeeCount = filteredMembers.filter(m => m.in_executive_committee === true || m.in_executive_committee === 'TRUE').length;
    
    document.getElementById('totalMembersCount').innerText = filteredMembers.length;
    document.getElementById('genderRatioDisplay').innerText = `${maleCount}:${femaleCount}`;
    document.getElementById('committeeMembersCount').innerText = committeeCount;
    document.getElementById('totalVisitsOverall').innerText = visits.length;
    
    // Member Distribution Charts with Data Labels
    const memberAgeGroups = { '1-4':0,'5-9':0,'10-14':0,'15-19':0,'20-24':0,'25-29':0,'30-34':0,'35-39':0,'40-44':0,'45-49':0,'50+':0,'Unknown':0 };
    const memberCommittees = { 'In Committee':0, 'Not in Committee':0 };
    const memberActivities = { 'Mokhukhu':0, 'Female Choir':0, 'Male Choir':0, 'Sunday School':0, 'Other':0 };
    
    filteredMembers.forEach(m => {
        const age = calculateAgeFromPin(m.pin);
        const ageGroup = getAgeGroup(age);
        if (memberAgeGroups[ageGroup] !== undefined) memberAgeGroups[ageGroup]++;
        else memberAgeGroups['Unknown']++;
        
        if (m.in_executive_committee === true || m.in_executive_committee === 'TRUE') memberCommittees['In Committee']++;
        else memberCommittees['Not in Committee']++;
        
        const act = m.church_activity;
        if (act === 'mokhukhu') memberActivities['Mokhukhu']++;
        else if (act === 'female_choir') memberActivities['Female Choir']++;
        else if (act === 'male_choir') memberActivities['Male Choir']++;
        else if (act === 'sunday_school') memberActivities['Sunday School']++;
        else memberActivities['Other']++;
    });
    
    if (memberGenderChart) memberGenderChart.destroy();
    memberGenderChart = new Chart(document.getElementById('memberGenderChart'), { 
        type: 'pie', 
        data: { labels: ['Male', 'Female'], datasets: [{ data: [maleCount, femaleCount], backgroundColor: ['#2e7d32', '#ffc107'] }] }, 
        options: { responsive: true, plugins: { legend: { position: 'bottom' }, dataLabels: { fontSize: 14, fontColor: '#fff' } } } 
    });
    
    if (memberAgeChart) memberAgeChart.destroy();
    memberAgeChart = new Chart(document.getElementById('memberAgeChart'), { 
        type: 'bar', 
        data: { labels: Object.keys(memberAgeGroups), datasets: [{ label: 'Members', data: Object.values(memberAgeGroups), backgroundColor: '#1e3c72' }] }, 
        options: { responsive: true, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false }, dataLabels: { fontSize: 11, fontColor: '#fff' } } } 
    });
    
    if (memberCommitteeChart) memberCommitteeChart.destroy();
    memberCommitteeChart = new Chart(document.getElementById('memberCommitteeChart'), { 
        type: 'pie', 
        data: { labels: Object.keys(memberCommittees), datasets: [{ data: Object.values(memberCommittees), backgroundColor: ['#2e7d32', '#6c757d'] }] }, 
        options: { responsive: true, plugins: { legend: { position: 'bottom' }, dataLabels: { fontSize: 14, fontColor: '#fff' } } } 
    });
    
    if (memberActivityChart) memberActivityChart.destroy();
    memberActivityChart = new Chart(document.getElementById('memberActivityChart'), { 
        type: 'bar', 
        data: { labels: Object.keys(memberActivities), datasets: [{ label: 'Members', data: Object.values(memberActivities), backgroundColor: '#17a2b8' }] }, 
        options: { responsive: true, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false }, dataLabels: { fontSize: 11, fontColor: '#fff' } } } 
    });
    
    // Visit Distribution Charts
    const memberMap = new Map();
    members.forEach(m => memberMap.set(m.member_id, m));
    const filteredVisits = getFilteredVisitsForCharts();
    const visitGender = { 'Male': 0, 'Female': 0 };
    const visitAgeGroups = { '1-4':0,'5-9':0,'10-14':0,'15-19':0,'20-24':0,'25-29':0,'30-34':0,'35-39':0,'40-44':0,'45-49':0,'50+':0,'Unknown':0 };
    const visitCommittees = { 'In Committee':0, 'Not in Committee':0 };
    const visitActivities = { 'Mokhukhu':0, 'Female Choir':0, 'Male Choir':0, 'Sunday School':0, 'Other':0 };
    
    filteredVisits.forEach(v => {
        const m = memberMap.get(v.member_id);
        if (m) {
            if (m.gender === 'Male') visitGender['Male']++;
            if (m.gender === 'Female') visitGender['Female']++;
            const age = calculateAgeFromPin(m.pin);
            const ageGroup = getAgeGroup(age);
            if (visitAgeGroups[ageGroup] !== undefined) visitAgeGroups[ageGroup]++;
            else visitAgeGroups['Unknown']++;
            if (m.in_executive_committee === true || m.in_executive_committee === 'TRUE') visitCommittees['In Committee']++;
            else visitCommittees['Not in Committee']++;
            const act = m.church_activity;
            if (act === 'mokhukhu') visitActivities['Mokhukhu']++;
            else if (act === 'female_choir') visitActivities['Female Choir']++;
            else if (act === 'male_choir') visitActivities['Male Choir']++;
            else if (act === 'sunday_school') visitActivities['Sunday School']++;
            else visitActivities['Other']++;
        }
    });
    
    if (visitGenderChart) visitGenderChart.destroy();
    visitGenderChart = new Chart(document.getElementById('visitGenderChart'), { 
        type: 'pie', 
        data: { labels: ['Male', 'Female'], datasets: [{ data: Object.values(visitGender), backgroundColor: ['#2e7d32', '#ffc107'] }] }, 
        options: { responsive: true, plugins: { legend: { position: 'bottom' }, dataLabels: { fontSize: 14, fontColor: '#fff' } } } 
    });
    
    if (visitAgeChart) visitAgeChart.destroy();
    visitAgeChart = new Chart(document.getElementById('visitAgeChart'), { 
        type: 'bar', 
        data: { labels: Object.keys(visitAgeGroups), datasets: [{ label: 'Visits', data: Object.values(visitAgeGroups), backgroundColor: '#1e3c72' }] }, 
        options: { responsive: true, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false }, dataLabels: { fontSize: 11, fontColor: '#fff' } } } 
    });
    
    if (visitCommitteeChart) visitCommitteeChart.destroy();
    visitCommitteeChart = new Chart(document.getElementById('visitCommitteeChart'), { 
        type: 'pie', 
        data: { labels: Object.keys(visitCommittees), datasets: [{ data: Object.values(visitCommittees), backgroundColor: ['#2e7d32', '#6c757d'] }] }, 
        options: { responsive: true, plugins: { legend: { position: 'bottom' }, dataLabels: { fontSize: 14, fontColor: '#fff' } } } 
    });
    
    if (visitActivityChart) visitActivityChart.destroy();
    visitActivityChart = new Chart(document.getElementById('visitActivityChart'), { 
        type: 'bar', 
        data: { labels: Object.keys(visitActivities), datasets: [{ label: 'Visits', data: Object.values(visitActivities), backgroundColor: '#17a2b8' }] }, 
        options: { responsive: true, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false }, dataLabels: { fontSize: 11, fontColor: '#fff' } } } 
    });
}

function updateKganyaStatistics() {
    const kganyaYes = members.filter(m => m.kganya_member === 'Yes').length;
    const kganyaNo = members.filter(m => m.kganya_member === 'No' || !m.kganya_member).length;
    document.getElementById('kganyaSubscribersCount').innerText = kganyaYes;
    
    if (kganyaSubscribersChart) kganyaSubscribersChart.destroy();
    kganyaSubscribersChart = new Chart(document.getElementById('kganyaSubscribersChart'), { 
        type: 'pie', 
        data: { labels: ['Pays Kganya', 'Does Not Pay'], datasets: [{ data: [kganyaYes, kganyaNo], backgroundColor: ['#2e7d32', '#dc3545'] }] }, 
        options: { responsive: true, plugins: { legend: { position: 'bottom' }, dataLabels: { fontSize: 14, fontColor: '#fff' } } } 
    });
    
    const maleKganya = members.filter(m => m.gender === 'Male' && m.kganya_member === 'Yes').length;
    const maleNonKganya = members.filter(m => m.gender === 'Male' && (m.kganya_member === 'No' || !m.kganya_member)).length;
    const femaleKganya = members.filter(m => m.gender === 'Female' && m.kganya_member === 'Yes').length;
    const femaleNonKganya = members.filter(m => m.gender === 'Female' && (m.kganya_member === 'No' || !m.kganya_member)).length;
    if (kganyaGenderChart) kganyaGenderChart.destroy();
    kganyaGenderChart = new Chart(document.getElementById('kganyaGenderChart'), { 
        type: 'bar', 
        data: { labels: ['Male', 'Female'], datasets: [{ label: 'Pays Kganya', data: [maleKganya, femaleKganya], backgroundColor: '#2e7d32' }, { label: 'Does Not Pay', data: [maleNonKganya, femaleNonKganya], backgroundColor: '#dc3545' }] }, 
        options: { responsive: true, scales: { y: { beginAtZero: true } }, plugins: { legend: { position: 'bottom' }, dataLabels: { fontSize: 12, fontColor: '#333' } } } 
    });
    
    if (kganyaVsNonChart) kganyaVsNonChart.destroy();
    kganyaVsNonChart = new Chart(document.getElementById('kganyaVsNonChart'), { 
        type: 'bar', 
        data: { labels: ['Pays Kganya', 'Does Not Pay'], datasets: [{ label: 'Count', data: [kganyaYes, kganyaNo], backgroundColor: ['#2e7d32', '#dc3545'] }] }, 
        options: { responsive: true, scales: { y: { beginAtZero: true } }, plugins: { legend: { position: 'bottom' }, dataLabels: { fontSize: 14, fontColor: '#fff' } } } 
    });
    
    const execMembers = members.filter(m => m.in_executive_committee === true || m.in_executive_committee === 'TRUE');
    const execKganya = execMembers.filter(m => m.kganya_member === 'Yes').length;
    const execNonKganya = execMembers.filter(m => m.kganya_member === 'No' || !m.kganya_member).length;
    if (kganyaExecutiveChart) kganyaExecutiveChart.destroy();
    kganyaExecutiveChart = new Chart(document.getElementById('kganyaExecutiveChart'), { 
        type: 'bar', 
        data: { labels: ['Pays Kganya', 'Does Not Pay'], datasets: [{ label: 'Executive Committee', data: [execKganya, execNonKganya], backgroundColor: ['#2e7d32', '#dc3545'] }] }, 
        options: { responsive: true, scales: { y: { beginAtZero: true } }, plugins: { legend: { position: 'bottom' }, dataLabels: { fontSize: 14, fontColor: '#fff' } } } 
    });
}

function updateSkillsStatistics() {
    const statuses = ['employed', 'self_employed', 'unemployed', 'student', 'retired'];
    const statusLabels = ['Employed', 'Self-Employed', 'Unemployed', 'Student', 'Retired'];
    const maleData = statuses.map(s => members.filter(m => m.gender === 'Male' && m.employment_status === s).length);
    const femaleData = statuses.map(s => members.filter(m => m.gender === 'Female' && m.employment_status === s).length);
    if (employmentGenderChart) employmentGenderChart.destroy();
    employmentGenderChart = new Chart(document.getElementById('employmentGenderChart'), { 
        type: 'bar', 
        data: { labels: statusLabels, datasets: [{ label: 'Male', data: maleData, backgroundColor: '#2e7d32' }, { label: 'Female', data: femaleData, backgroundColor: '#ffc107' }] }, 
        options: { responsive: true, scales: { y: { beginAtZero: true } }, plugins: { legend: { position: 'bottom' }, dataLabels: { fontSize: 11, fontColor: '#333' } } } 
    });
    
    const execMembers = members.filter(m => m.in_executive_committee === true || m.in_executive_committee === 'TRUE');
    const nonExecMembers = members.filter(m => !(m.in_executive_committee === true || m.in_executive_committee === 'TRUE'));
    const execData = statuses.map(s => execMembers.filter(m => m.employment_status === s).length);
    const nonExecData = statuses.map(s => nonExecMembers.filter(m => m.employment_status === s).length);
    if (employmentCommitteeChart) employmentCommitteeChart.destroy();
    employmentCommitteeChart = new Chart(document.getElementById('employmentCommitteeChart'), { 
        type: 'bar', 
        data: { labels: statusLabels, datasets: [{ label: 'In Committee', data: execData, backgroundColor: '#2e7d32' }, { label: 'Not in Committee', data: nonExecData, backgroundColor: '#6c757d' }] }, 
        options: { responsive: true, scales: { y: { beginAtZero: true } }, plugins: { legend: { position: 'bottom' }, dataLabels: { fontSize: 11, fontColor: '#333' } } } 
    });
    
    const eduLevels = ['primary', 'secondary', 'certificate', 'diploma', 'degree', 'postgraduate', 'masters', 'doctorate'];
    const eduLabels = ['Primary', 'Secondary', 'Certificate', 'Diploma', 'Degree', 'Postgrad', 'Masters', 'Doctorate'];
    const eduData = eduLevels.map(l => members.filter(m => m.education_level === l).length);
    if (educationLevelChart) educationLevelChart.destroy();
    educationLevelChart = new Chart(document.getElementById('educationLevelChart'), { 
        type: 'bar', 
        data: { labels: eduLabels, datasets: [{ label: 'Count', data: eduData, backgroundColor: '#1e3c72' }] }, 
        options: { responsive: true, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false }, dataLabels: { fontSize: 11, fontColor: '#fff' } } } 
    });
    
    const trainedYesMale = members.filter(m => m.gender === 'Male' && m.formally_trained_on_skills === 'yes').length;
    const trainedNoMale = members.filter(m => m.gender === 'Male' && (m.formally_trained_on_skills !== 'yes')).length;
    const trainedYesFemale = members.filter(m => m.gender === 'Female' && m.formally_trained_on_skills === 'yes').length;
    const trainedNoFemale = members.filter(m => m.gender === 'Female' && (m.formally_trained_on_skills !== 'yes')).length;
    if (trainedGenderChart) trainedGenderChart.destroy();
    trainedGenderChart = new Chart(document.getElementById('trainedGenderChart'), { 
        type: 'bar', 
        data: { labels: ['Male', 'Female'], datasets: [{ label: 'Trained', data: [trainedYesMale, trainedYesFemale], backgroundColor: '#2e7d32' }, { label: 'Not Trained', data: [trainedNoMale, trainedNoFemale], backgroundColor: '#dc3545' }] }, 
        options: { responsive: true, scales: { y: { beginAtZero: true } }, plugins: { legend: { position: 'bottom' }, dataLabels: { fontSize: 12, fontColor: '#333' } } } 
    });
    
    const trainedYesExec = execMembers.filter(m => m.formally_trained_on_skills === 'yes').length;
    const trainedNoExec = execMembers.filter(m => m.formally_trained_on_skills !== 'yes').length;
    const trainedYesNonExec = nonExecMembers.filter(m => m.formally_trained_on_skills === 'yes').length;
    const trainedNoNonExec = nonExecMembers.filter(m => m.formally_trained_on_skills !== 'yes').length;
    if (trainedCommitteeChart) trainedCommitteeChart.destroy();
    trainedCommitteeChart = new Chart(document.getElementById('trainedCommitteeChart'), { 
        type: 'bar', 
        data: { labels: ['In Committee', 'Not in Committee'], datasets: [{ label: 'Trained', data: [trainedYesExec, trainedYesNonExec], backgroundColor: '#2e7d32' }, { label: 'Not Trained', data: [trainedNoExec, trainedNoNonExec], backgroundColor: '#dc3545' }] }, 
        options: { responsive: true, scales: { y: { beginAtZero: true } }, plugins: { legend: { position: 'bottom' }, dataLabels: { fontSize: 12, fontColor: '#333' } } } 
    });
    
    const qualificationCounts = new Map();
    members.forEach(m => {
        if (m.qualification) {
            const qual = m.qualification;
            if (!qualificationCounts.has(qual)) qualificationCounts.set(qual, { total:0, male:0, female:0, inCommittee:0 });
            const entry = qualificationCounts.get(qual);
            entry.total++;
            if (m.gender === 'Male') entry.male++;
            if (m.gender === 'Female') entry.female++;
            if (m.in_executive_committee === true || m.in_executive_committee === 'TRUE') entry.inCommittee++;
        }
    });
    const sorted = Array.from(qualificationCounts.entries()).sort((a,b) => b[1].total - a[1].total);
    const tbody = document.getElementById('qualificationsTableBody');
    tbody.innerHTML = '';
    sorted.forEach(([qual, counts]) => {
        const row = tbody.insertRow();
        row.insertCell(0).innerText = qual;
        row.insertCell(1).innerText = counts.total;
        row.insertCell(2).innerText = counts.male;
        row.insertCell(3).innerText = counts.female;
        row.insertCell(4).innerText = counts.inCommittee;
    });
    if (sorted.length === 0) tbody.innerHTML = '<tr><td colspan="5" class="text-center">No data</td></tr>';
}

function setupEventListeners() {
    document.getElementById('applyVisitsFilterBtn')?.addEventListener('click', () => {
        visitsStartDate = document.getElementById('visitsStartDate').value || null;
        visitsEndDate = document.getElementById('visitsEndDate').value || null;
        updateVisitsStatistics();
        updateTotalStatisticsAndCharts();
        showMessage('Visits filter applied', 'success');
    });
    document.getElementById('applyRegFilterBtn')?.addEventListener('click', () => {
        regStartDate = document.getElementById('regStartDate').value || null;
        regEndDate = document.getElementById('regEndDate').value || null;
        updateTotalStatisticsAndCharts();
        showMessage('Registration date filter applied', 'success');
    });
    document.getElementById('applyGenderFilterBtn')?.addEventListener('click', () => {
        currentGenderFilter = document.getElementById('genderFilter').value;
        updateTotalStatisticsAndCharts();
        showMessage('Gender filter applied', 'success');
    });
}

async function init() {
    updateCurrentYear();
    setupEventListeners();
    await loadData();
}
init();