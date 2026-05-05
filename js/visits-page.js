// ========== VISITS PAGE - MAIN APPLICATION ==========
// Uses the shared api-client.js

// Global variables
let members = [];
let visits = [];
let currentSelectedMember = null;
let autoRefreshInterval = null;
let isRefreshing = false;

// ========== LOAD DATA FUNCTIONS ==========
async function loadData() {
    console.log('Loading data from server...');
    showMessage('Loading data from server...', 'warning');
    
    try {
        // Load members from server
        const membersResult = await api.getMembers();
        
        if (membersResult.success && membersResult.data) {
            members = membersResult.data;
            console.log('Members loaded:', members.length);
        } else {
            console.warn('Failed to load members:', membersResult.error);
            members = [];
        }
        
        // Load visits from server
        await loadVisitsFromServer();
        
        if (members.length > 0) {
            showMessage(`Loaded ${members.length} members`, 'success');
        }
        
        updateCheckedInList();
        
    } catch (error) {
        console.error('Error loading data:', error);
        showMessage('Error loading data. Please refresh the page.', 'error');
    }
}

async function loadVisitsFromServer() {
    try {
        console.log('Fetching visits from API...');
        const visitsResult = await api.getVisits();
        
        console.log('API Response for visits:', visitsResult);
        
        if (visitsResult.success && visitsResult.data) {
            visits = visitsResult.data;
            console.log('Raw visits data from server:', visits);
            
            // Log each visit for debugging
            visits.forEach((visit, index) => {
                console.log(`Visit ${index + 1}:`, {
                    member_id: visit.member_id,
                    visit_date: visit.visit_date,
                    visit_type: visit.visit_type,
                    visitor_name: visit.visitor_name
                });
            });
            
            const today = getTodayDate();
            const todayCount = visits.filter(v => {
                const visitDate = getDateOnly(v.visit_date || v.date);
                return visitDate === today;
            }).length;
            console.log(`Visits loaded from server: ${visits.length} total, ${todayCount} today`);
            return true;
        } else {
            console.warn('Failed to load visits:', visitsResult.error);
            visits = [];
            return false;
        }
    } catch (error) {
        console.error('Error loading visits:', error);
        visits = [];
        return false;
    }
}

async function refreshDataFromServer() {
    if (isRefreshing) {
        console.log('Already refreshing, skipping...');
        return;
    }
    
    isRefreshing = true;
    console.log('Refreshing data from server...');
    
    try {
        const visitsResult = await api.getVisits();
        
        if (visitsResult.success && visitsResult.data) {
            visits = visitsResult.data;
            console.log('Data refreshed from server:', visits.length, 'visits');
            updateCheckedInList();
            return true;
        } else {
            console.warn('Failed to refresh data:', visitsResult.error);
            return false;
        }
    } catch (error) {
        console.error('Error refreshing data:', error);
        return false;
    } finally {
        isRefreshing = false;
    }
}

// ========== HELPER FUNCTIONS ==========
function getTodayDate() {
    // Get today's date in local timezone (YYYY-MM-DD)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const localDate = `${year}-${month}-${day}`;
    console.log('Today\'s date (local):', localDate);
    return localDate;
}

function getDateOnly(dateString) {
    if (!dateString) return '';
    
    console.log('Parsing date:', dateString);
    
    if (typeof dateString === 'string') {
        // If it's an ISO string with time (e.g., 2026-05-04T22:00:00.000Z)
        if (dateString.includes('T')) {
            // Parse as local date to handle timezone correctly
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const parsed = `${year}-${month}-${day}`;
            console.log(`ISO string ${dateString} -> local date ${parsed}`);
            return parsed;
        }
        // If it's already YYYY-MM-DD format
        if (dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
            console.log(`Already YYYY-MM-DD: ${dateString}`);
            return dateString;
        }
        // If it's a different format like DD/MM/YYYY
        if (dateString.includes('/')) {
            const parts = dateString.split('/');
            if (parts.length === 3) {
                const formatted = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                console.log(`Converted ${dateString} -> ${formatted}`);
                return formatted;
            }
        }
    }
    
    // Try to parse as date and format
    try {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const formatted = `${year}-${month}-${day}`;
            console.log(`Parsed date ${dateString} -> ${formatted}`);
            return formatted;
        }
    } catch (e) {
        console.error('Date parsing error:', e);
    }
    
    console.log('Could not parse date, returning empty string');
    return '';
}

function getLocalDateForSaving() {
    // Get current date in local timezone for saving
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // Return as YYYY-MM-DD format (date only)
    return `${year}-${month}-${day}`;
}

function isMemberCheckedInToday(memberId) {
    const today = getTodayDate();
    
    const result = visits.some(visit => {
        const visitDate = getDateOnly(visit.visit_date || visit.date);
        const isMatch = String(visit.member_id) === String(memberId) && visitDate === today;
        if (isMatch) {
            console.log(`Member ${memberId} checked in today:`, visit);
        }
        return isMatch;
    });
    
    return result;
}

function getTodayVisits() {
    const today = getTodayDate();
    console.log('Getting today\'s visits for:', today);
    console.log('Total visits in array:', visits.length);
    
    // Filter visits for today
    const todayVisitsRaw = visits.filter(v => {
        const visitDate = getDateOnly(v.visit_date || v.date);
        const isMatch = visitDate === today;
        if (isMatch) {
            console.log('Match found - Visit:', {
                id: v.visit_id,
                member_id: v.member_id,
                visit_date: v.visit_date,
                parsed_date: visitDate,
                today: today
            });
        }
        return isMatch;
    });
    
    console.log('Raw today visits count:', todayVisitsRaw.length);
    
    if (todayVisitsRaw.length === 0) {
        console.log('No visits found for today');
        return [];
    }
    
    // Remove duplicates - keep the most recent per member
    const latestVisits = new Map();
    
    todayVisitsRaw.forEach(visit => {
        const memberId = String(visit.member_id);
        const existing = latestVisits.get(memberId);
        const visitTime = visit.created_at || visit.visit_date || '';
        
        if (!existing || (visitTime > (existing.created_at || existing.visit_date || ''))) {
            latestVisits.set(memberId, visit);
        }
    });
    
    const uniqueVisits = Array.from(latestVisits.values());
    console.log('Unique today visits:', uniqueVisits.length);
    
    return uniqueVisits;
}

function formatPurpose(purpose) {
    const purposes = {
        'sunday_service': 'Sunday Service',
        'visitor': 'Visitor',
        'kganya_payment': 'Kganya Service',
        'prayer_visitor': 'Prayer Visitor',
        'youth_service': 'Youth Service',
        'choir_practice': 'Choir Practice'
    };
    return purposes[purpose] || purpose || 'Unknown';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== TOGGLE PAID KGANYA FIELD ==========
function togglePaidKganyaField() {
    const visitPurpose = document.getElementById('visitPurpose');
    const paidKganyaGroup = document.getElementById('paidKganyaGroup');
    
    if (visitPurpose && paidKganyaGroup) {
        // Hide the paid kganya checkbox when Kganya Service is selected
        if (visitPurpose.value === 'kganya_payment') {
            paidKganyaGroup.style.display = 'none';
            // Uncheck the checkbox when hidden
            document.getElementById('paidKganya').checked = false;
        } else {
            paidKganyaGroup.style.display = 'block';
        }
    }
}

// ========== SEARCH FUNCTIONS ==========
function searchMembers() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (!searchTerm) {
        showMessage('Please enter a search term', 'error');
        return;
    }

    const filtered = members.filter(m => {
        const firstname = m.firstname ? String(m.firstname).toLowerCase() : '';
        const middlename = m.middlename ? String(m.middlename).toLowerCase() : '';
        const surname = m.surname ? String(m.surname).toLowerCase() : '';
        const pin = m.pin ? String(m.pin).toLowerCase() : '';
        const contact = m.contact ? String(m.contact).toLowerCase() : '';
        
        return firstname.includes(searchTerm) ||
            middlename.includes(searchTerm) ||
            surname.includes(searchTerm) ||
            pin.includes(searchTerm) ||
            contact.includes(searchTerm);
    });

    displaySearchResults(filtered);
}

function displaySearchResults(results) {
    const resultsDiv = document.getElementById('searchResults');
    const membersListDiv = document.getElementById('membersList');
    
    if (!resultsDiv || !membersListDiv) return;

    if (results.length === 0) {
        membersListDiv.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-slash" style="font-size: 3rem;"></i>
                <p>No members found matching your search.</p>
            </div>
        `;
    } else {
        membersListDiv.innerHTML = results.map(member => {
            const alreadyCheckedIn = isMemberCheckedInToday(member.member_id);
            const buttonDisabled = alreadyCheckedIn ? 'disabled' : '';
            const buttonText = alreadyCheckedIn ? '✓ Checked In Today' : '<i class="fas fa-calendar-check"></i> Check-In';
            const buttonClass = alreadyCheckedIn ? 'btn-checked-in' : 'btn-checkin';
            
            return `
                <div class="visit-card" data-member-id="${member.member_id}">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${escapeHtml(member.firstname)} ${escapeHtml(member.surname)}</strong>
                            ${alreadyCheckedIn ? '<span class="badge-success ms-2">✓ Checked In Today</span>' : ''}
                            <br>
                            <small class="text-muted">
                                <i class="fas fa-id-card"></i> ${member.pin || 'N/A'} | 
                                <i class="fas fa-phone"></i> ${member.contact || 'N/A'}                            
                            </small>
                        </div>
                        <button class="${buttonClass} checkin-btn" data-member-id="${member.member_id}" ${buttonDisabled}>
                            ${buttonText}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        attachDynamicEventListeners();
    }

    resultsDiv.style.display = 'block';
}

function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const membersList = document.getElementById('membersList');
    
    if (searchInput) searchInput.value = '';
    if (searchResults) searchResults.style.display = 'none';
    if (membersList) membersList.innerHTML = '';
}

function closeSearchResults() {
    const searchResults = document.getElementById('searchResults');
    if (searchResults) searchResults.style.display = 'none';
}

// ========== CHECK-IN FUNCTIONS ==========
function openCheckInModal(memberId) {
    if (isMemberCheckedInToday(memberId)) {
        const member = members.find(m => String(m.member_id) === String(memberId));
        if (member) {
            showMessage(`${member.firstname} ${member.surname} has already been checked in today!`, 'error');
        }
        return;
    }
    
    const member = members.find(m => String(m.member_id) === String(memberId));
    if (member) {
        currentSelectedMember = member;
        document.getElementById('checkInMemberId').value = memberId;
        document.getElementById('modalMemberName').innerHTML = `<i class="fas fa-user"></i> Check-In: ${member.firstname} ${member.surname}`;
        // Set the date to local today's date
        document.getElementById('visitDate').value = getLocalDateForSaving();
        document.getElementById('paidKganya').checked = false;
        
        // Reset the paid kganya field visibility
        togglePaidKganyaField();
        
        document.getElementById('checkInModal').style.display = 'flex';
    }
}

function closeCheckInModal() {
    const modal = document.getElementById('checkInModal');
    if (modal) modal.style.display = 'none';
    document.getElementById('visitPurpose').value = 'sunday_service';
    document.getElementById('paidKganya').checked = false;
    // Reset the paid kganya field visibility
    togglePaidKganyaField();
}

async function saveCheckIn() {
    const memberId = document.getElementById('checkInMemberId').value;
    const purpose = document.getElementById('visitPurpose').value;
    const date = document.getElementById('visitDate').value;
    const paidKganya = document.getElementById('paidKganya').checked;

    if (!date) {
        showMessage('Please select a visit date', 'error');
        return;
    }

    // Final check before saving
    if (isMemberCheckedInToday(memberId)) {
        showMessage(`${currentSelectedMember.firstname} ${currentSelectedMember.surname} has already been checked in today!`, 'error');
        closeCheckInModal();
        return;
    }

    const now = new Date().toISOString();
    
    // For Kganya Service, always set paidKganya to false since it's not applicable
    const finalPaidStatus = (purpose === 'kganya_payment') ? false : paidKganya;
    
    const visitData = {
        member_id: memberId,
        visitor_name: `${currentSelectedMember.firstname} ${currentSelectedMember.surname}`,
        visit_date: date,
        visit_type: purpose,
        notes: `Paid Kganya: ${finalPaidStatus ? 'Yes' : 'No'}`,
        status: 'completed',
        created_at: now
    };

    console.log('Saving visit data:', visitData);
    console.log('Visit date being saved:', date);

    // Disable save button
    const confirmBtn = document.getElementById('confirmCheckInBtn');
    const originalBtnText = confirmBtn.innerHTML;
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    
    showMessage('Saving check-in to server...', 'warning');
    
    try {
        const result = await api.createVisit(visitData);
        console.log('API Response:', result);
        
        if (result && result.success) {
            showMessage(`${currentSelectedMember.firstname} ${currentSelectedMember.surname} checked in successfully!`, 'success');
            closeCheckInModal();
            
            // Refresh data from server immediately after save
            await refreshDataFromServer();
            
            // Refresh search results if they're open
            const searchResults = document.getElementById('searchResults');
            if (searchResults && searchResults.style.display === 'block') {
                const searchInput = document.getElementById('searchInput');
                if (searchInput && searchInput.value.trim()) {
                    searchMembers();
                }
            }
        } else {
            const errorMsg = result?.error || 'Could not save check-in. Please check your connection.';
            showMessage('Error: ' + errorMsg, 'error');
            console.error('Save check-in failed:', result);
        }
    } catch (error) {
        console.error('Exception in saveCheckIn:', error);
        showMessage('Error: Network issue. Please check your connection and try again.', 'error');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalBtnText;
    }
}

// ========== UI UPDATE FUNCTIONS ==========
function updateCheckedInList() {
    const todayVisits = getTodayVisits();
    const checkedInDiv = document.getElementById('checkedInList');
    
    if (!checkedInDiv) return;
    
    console.log('Rendering checked-in list with', todayVisits.length, 'visits');
    console.log('Today visits data:', todayVisits);
    
    if (todayVisits.length === 0) {
        checkedInDiv.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users" style="font-size: 3rem;"></i>
                <p>No members checked in yet today</p>
            </div>
        `;
    } else {
        checkedInDiv.innerHTML = todayVisits.map(visit => {
            // Find member details
            const member = members.find(m => String(m.member_id) === String(visit.member_id));
            const purpose = visit.visit_type || 'Unknown';
            const paid = visit.notes && visit.notes.includes('Paid Kganya: Yes');
            const timestamp = visit.created_at || visit.visit_date || new Date().toISOString();
            const timeString = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const memberName = member ? `${member.firstname} ${member.surname}` : (visit.visitor_name || 'Unknown Member');
            
            let badgeClass = 'badge-sunday';
            if (purpose === 'kganya_payment') badgeClass = 'badge-kganya';
            else if (purpose === 'visitor') badgeClass = 'badge-visitor';
            
            console.log(`Rendering visit for member: ${memberName}, purpose: ${purpose}`);
            
            return `
                <div class="visit-card checkedin-item" data-visit-id="${visit.visit_id || 'unknown'}">
                    <div class="d-flex justify-content-between align-items-center">
                        <div style="flex: 1;">
                            <div>
                                <strong>${escapeHtml(memberName)}</strong>
                            </div>
                            <div class="mt-1">
                                <span class="${badgeClass}" style="font-size: 0.7rem; padding: 2px 8px; border-radius: 12px; display: inline-block;">${formatPurpose(purpose)}</span>
                                ${paid && purpose !== 'kganya_payment' ? '<span class="badge-paid ms-1" style="font-size: 0.7rem; padding: 2px 8px; border-radius: 12px; background: #d4edda; color: #155724; display: inline-block;"><i class="fas fa-check-circle"></i> Paid Kganya</span>' : ''}
                            </div>
                        </div>
                        <div class="text-end">
                            <span class="visit-time" style="font-size: 0.75rem; color: #666;">
                                <i class="fas fa-clock"></i> ${timeString}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    updateStatistics(todayVisits);
}

function updateStatistics(todayVisits) {
    // Count only Sunday Service visits
    const total = todayVisits.length;
    const paidCount = todayVisits.filter(v => v.notes && v.notes.includes('Paid Kganya: Yes')).length;
    
    // Count only members with Sunday Service (exclude Kganya Service from Sunday count)
    const sundayServiceTotal = todayVisits.filter(v => v.visit_type === 'sunday_service').length;
    
    // Count only visitors (exclude Kganya Service from visitor count)
    const visitorTotal = todayVisits.filter(v => v.visit_type === 'visitor').length;
    
    const totalElement = document.getElementById('totalCheckedIn');
    const paidElement = document.getElementById('paidKganyaCount');
    const sundayElement = document.getElementById('sundayServiceCount');
    const visitorElement = document.getElementById('visitorsCount');
    
    if (totalElement) totalElement.textContent = total;
    if (paidElement) paidElement.textContent = paidCount;
    if (sundayElement) sundayElement.textContent = sundayServiceTotal;
    if (visitorElement) visitorElement.textContent = visitorTotal;
    
    console.log(`Stats: Total=${total}, Paid=${paidCount}, Sunday=${sundayServiceTotal}, Visitors=${visitorTotal}`);
}

// ========== REFRESH FUNCTION ==========
async function refreshAllData() {
    const refreshBtn = document.getElementById('refreshDataBtn');
    
    if (refreshBtn) {
        refreshBtn.classList.add('refreshing');
        refreshBtn.disabled = true;
    }
    
    try {
        showMessage('Refreshing data from server...', 'warning');
        await loadVisitsFromServer();
        updateCheckedInList();
        showMessage('Data refreshed successfully!', 'success');
    } catch (error) {
        showMessage('Error refreshing data', 'error');
    } finally {
        if (refreshBtn) {
            refreshBtn.classList.remove('refreshing');
            refreshBtn.disabled = false;
        }
    }
}

// ========== MESSAGE FUNCTIONS ==========
function showMessage(msg, type) {
    const messageDiv = document.getElementById('messageArea');
    if (!messageDiv) {
        console.log(msg);
        return;
    }
    
    if (window.messageTimeout) {
        clearTimeout(window.messageTimeout);
    }
    
    messageDiv.style.display = 'flex';
    messageDiv.style.zIndex = '10000';
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20px';
    messageDiv.style.left = '50%';
    messageDiv.style.transform = 'translateX(-50%)';
    messageDiv.style.minWidth = '300px';
    messageDiv.style.textAlign = 'center';
    messageDiv.className = `alert-message ${type}`;
    messageDiv.innerHTML = `<span>${msg}</span><button class="close-msg" onclick="hideMessage()">&times;</button>`;
    
    window.messageTimeout = setTimeout(() => hideMessage(), 4000);
}

function hideMessage() {
    const messageDiv = document.getElementById('messageArea');
    if (messageDiv) {
        messageDiv.style.display = 'none';
    }
    if (window.messageTimeout) {
        clearTimeout(window.messageTimeout);
        window.messageTimeout = null;
    }
}

// ========== EVENT LISTENERS ==========
function attachDynamicEventListeners() {
    document.querySelectorAll('.checkin-btn').forEach(btn => {
        btn.removeEventListener('click', handleCheckInClick);
        btn.addEventListener('click', handleCheckInClick);
    });
}

function handleCheckInClick(e) {
    e.stopPropagation();
    const memberId = e.currentTarget.getAttribute('data-member-id');
    
    if (isMemberCheckedInToday(memberId)) {
        const member = members.find(m => String(m.member_id) === String(memberId));
        if (member) {
            showMessage(`${member.firstname} ${member.surname} has already been checked in today!`, 'error');
        }
        return;
    }
    
    openCheckInModal(memberId);
}

function setupEventListeners() {
    const searchBtn = document.getElementById('searchMembersBtn');
    if (searchBtn) searchBtn.addEventListener('click', searchMembers);
    
    const clearBtn = document.getElementById('clearSearchBtn');
    if (clearBtn) clearBtn.addEventListener('click', clearSearch);
    
    const refreshBtn = document.getElementById('refreshDataBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', refreshAllData);
    
    const closeResultsBtn = document.getElementById('closeResultsBtn');
    if (closeResultsBtn) closeResultsBtn.addEventListener('click', closeSearchResults);
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchMembers();
        });
    }
    
    const closeCheckInModalBtn = document.getElementById('closeCheckInModalBtn');
    if (closeCheckInModalBtn) closeCheckInModalBtn.addEventListener('click', closeCheckInModal);
    
    const cancelCheckInBtn = document.getElementById('cancelCheckInBtn');
    if (cancelCheckInBtn) cancelCheckInBtn.addEventListener('click', closeCheckInModal);
    
    const confirmCheckInBtn = document.getElementById('confirmCheckInBtn');
    if (confirmCheckInBtn) confirmCheckInBtn.addEventListener('click', saveCheckIn);
    
    // Add event listener for visit purpose change to toggle paid kganya field
    const visitPurpose = document.getElementById('visitPurpose');
    if (visitPurpose) {
        visitPurpose.addEventListener('change', togglePaidKganyaField);
    }
    
    window.addEventListener('click', closeModalOnOutsideClick);
    document.addEventListener('keydown', closeAllModalsOnEscape);
}

function closeModalOnOutsideClick(event) {
    const modals = document.querySelectorAll('.custom-modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

function closeAllModalsOnEscape(event) {
    if (event.key === 'Escape') {
        const modals = document.querySelectorAll('.custom-modal');
        modals.forEach(modal => {
            if (modal.style.display === 'flex') {
                modal.style.display = 'none';
            }
        });
        hideMessage();
    }
}

// ========== AUTO REFRESH ==========
function startAutoRefresh() {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    // Refresh every 30 seconds from server
    autoRefreshInterval = setInterval(() => {
        console.log('Auto-refreshing data from server...');
        refreshDataFromServer();
    }, 30000);
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

// ========== INITIALIZATION ==========
function updateCurrentYear() {
    const yearElement = document.getElementById('currentYear');
    if (yearElement) yearElement.textContent = new Date().getFullYear();
}

async function init() {
    console.log('Initializing Visits Page...');
    updateCurrentYear();
    setupEventListeners();
    await loadData();
    startAutoRefresh();
    console.log('Initialization complete');
}

// Make debug function available in console
window.debugVisits = function() {
    console.log('=== DEBUG VISITS ===');
    console.log('Total visits:', visits.length);
    console.log('Today\'s date (local):', getTodayDate());
    console.log('All visits:', visits);
    console.log('Today\'s visits:', getTodayVisits());
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

window.addEventListener('beforeunload', () => {
    stopAutoRefresh();
});