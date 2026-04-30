// ========== EVENTS PAGE - MAIN APPLICATION ==========
// Data Storage
let events = [];
let members = [];
let eventAttendances = [];
let currentEventForCheckin = null;
let eventToDelete = null;

// Flag to track if we're using API or localStorage
let useAPI = true;
const API_BASE_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

// ========== API FUNCTIONS ==========
async function apiRequest(action, method = 'POST', data = {}) {
    let url = API_BASE_URL;
    
    let options = {
        method: method,
        mode: 'cors', 
        redirect: 'follow'
    };

    if (method === 'GET') {
        const params = new URLSearchParams({ action, ...data });
        url += `?${params.toString()}`;
    } else {
        options.headers = {
            'Content-Type': 'text/plain;charset=utf-8' 
        };
        options.body = JSON.stringify({ action, ...data });
    }

    try {
        const response = await fetch(url, options);
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, error: error.toString() };
    }
}

// Event API methods
async function getEventsFromAPI() {
    return apiRequest('getEvents', 'GET');
}

async function createEventInAPI(eventData) {
    return apiRequest('createEvent', 'POST', eventData);
}

async function updateEventInAPI(eventId, eventData) {
    return apiRequest('updateEvent', 'POST', { event_id: eventId, ...eventData });
}

async function deleteEventFromAPI(eventId) {
    return apiRequest('deleteEvent', 'POST', { event_id: eventId });
}

async function getEventAttendancesFromAPI(eventId) {
    return apiRequest('getEventAttendances', 'GET', { event_id: eventId });
}

async function createAttendanceInAPI(attendanceData) {
    return apiRequest('createAttendance', 'POST', attendanceData);
}

async function deleteAttendanceFromAPI(attendanceId) {
    return apiRequest('deleteAttendance', 'POST', { attendance_id: attendanceId });
}

async function getMembersFromAPI() {
    return apiRequest('getMembers', 'GET');
}

// Load initial data from API
async function loadData() {
    console.log('Loading data from API...');
    
    // Load members from API
    if (useAPI) {
        try {
            const membersResult = await getMembersFromAPI();
            if (membersResult.success && membersResult.data) {
                members = membersResult.data;
                localStorage.setItem('zcc_members', JSON.stringify(members));
                console.log('Members loaded from API:', members.length);
            } else {
                loadMembersFromLocal();
            }
        } catch (error) {
            console.error('API error, loading members from localStorage:', error);
            loadMembersFromLocal();
        }
    } else {
        loadMembersFromLocal();
    }
    
    // Load events from API
    if (useAPI) {
        try {
            const eventsResult = await getEventsFromAPI();
            if (eventsResult.success && eventsResult.data) {
                events = eventsResult.data;
                localStorage.setItem('zcc_events', JSON.stringify(events));
                console.log('Events loaded from API:', events.length);
            } else {
                loadEventsFromLocal();
            }
        } catch (error) {
            console.error('API error, loading events from localStorage:', error);
            loadEventsFromLocal();
        }
    } else {
        loadEventsFromLocal();
    }
    
    // Load attendances from API
    if (useAPI) {
        try {
            // For each event, load its attendances
            const allAttendances = [];
            for (const event of events) {
                const attendanceResult = await getEventAttendancesFromAPI(event.event_id);
                if (attendanceResult.success && attendanceResult.data) {
                    allAttendances.push(...attendanceResult.data);
                }
            }
            eventAttendances = allAttendances;
            localStorage.setItem('zcc_event_attendances', JSON.stringify(eventAttendances));
            console.log('Attendances loaded from API:', eventAttendances.length);
        } catch (error) {
            console.error('API error, loading attendances from localStorage:', error);
            loadAttendancesFromLocal();
        }
    } else {
        loadAttendancesFromLocal();
    }
}

function loadMembersFromLocal() {
    const storedMembers = localStorage.getItem("zcc_members");
    if (storedMembers) {
        members = JSON.parse(storedMembers);
    } else {
        members = [];
        localStorage.setItem("zcc_members", JSON.stringify(members));
    }
}

function loadEventsFromLocal() {
    const storedEvents = localStorage.getItem("zcc_events");
    if (storedEvents) {
        events = JSON.parse(storedEvents);
    } else {
        events = [];
        localStorage.setItem("zcc_events", JSON.stringify(events));
    }
}

function loadAttendancesFromLocal() {
    const storedAttendances = localStorage.getItem("zcc_event_attendances");
    if (storedAttendances) {
        eventAttendances = JSON.parse(storedAttendances);
    } else {
        eventAttendances = [];
        localStorage.setItem("zcc_event_attendances", JSON.stringify(eventAttendances));
    }
}

function saveEventsToLocal() {
    localStorage.setItem("zcc_events", JSON.stringify(events));
}

function saveAttendancesToLocal() {
    localStorage.setItem("zcc_event_attendances", JSON.stringify(eventAttendances));
}

function generateId() {
    return Date.now().toString();
}

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

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getEventTypeLabel(type) {
    const types = {
        'sunday_service': 'Sunday Service',
        'lekgotla_la_baruti': 'Lekgotla la Baruti',
        'mpogo': 'Mpogo',
        'meeting': 'Meeting',
        'prayer_meeting': 'Prayer Meeting',
        'youth_service': 'Youth Service',
        'choir_practice': 'Choir Practice',
        'conference': 'Conference',
        'workshop': 'Workshop',
        'other': 'Other'
    };
    return types[type] || type;
}

function renderEvents() {
    const eventsContainer = document.getElementById('eventsList');
    const eventCountBadge = document.getElementById('eventCountBadge');
    
    if (!eventsContainer) return;
    
    if (events.length === 0) {
        eventsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <p>No events created yet. Click "Create New Event" to get started.</p>
            </div>
        `;
        if (eventCountBadge) eventCountBadge.innerText = "0 events";
        return;
    }
    
    const sortedEvents = [...events].sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    
    let html = '';
    sortedEvents.forEach(event => {
        const attendanceCount = eventAttendances.filter(a => a.event_id === event.event_id).length;
        const eventDate = new Date(event.event_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isUpcoming = eventDate >= today;
        
        html += `
            <div class="event-card" data-event-id="${event.event_id}">
                <div class="event-card-header">
                    <span class="event-type-badge"><i class="fas fa-tag"></i> ${getEventTypeLabel(event.event_type)}</span>
                    <span style="font-size: 0.75rem;"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(event.event_venue)}</span>
                </div>
                <div class="event-card-body">
                    <div class="event-title">${escapeHtml(event.event_name)}</div>
                    <div class="event-detail"><i class="fas fa-calendar"></i> ${formatDate(event.event_date)}</div>
                    <div class="event-detail"><i class="fas fa-clock"></i> ${event.event_time || 'Time TBA'}</div>
                    ${event.event_description ? `<div class="event-description">${escapeHtml(event.event_description.substring(0, 100))}${event.event_description.length > 100 ? '...' : ''}</div>` : ''}
                </div>
                <div class="event-card-footer">
                    <div class="attendance-count"><i class="fas fa-users"></i> ${attendanceCount} checked in</div>
                    <div class="event-actions">
                        <button class="btn-view-event" onclick="openEventDetails('${event.event_id}')" title="View & Check-in"><i class="fas fa-eye"></i></button>
                        <button class="btn-delete-event" onclick="openDeleteEventModal('${event.event_id}')" title="Delete Event"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
            </div>
        `;
    });
    
    eventsContainer.innerHTML = html;
    if (eventCountBadge) eventCountBadge.innerText = `${events.length} event${events.length !== 1 ? 's' : ''}`;
}

function openCreateEventModal() {
    document.getElementById('eventModalTitle').innerHTML = '<i class="fas fa-calendar-plus"></i> Create New Event';
    document.getElementById('editEventId').value = '';
    document.getElementById('eventForm').reset();
    document.getElementById('eventDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('eventModal').style.display = 'flex';
}

function closeEventModal() {
    document.getElementById('eventModal').style.display = 'none';
}

// Save event to API and localStorage
async function saveEvent(event) {
    event.preventDefault();
    
    const eventId = document.getElementById('editEventId').value;
    const eventName = document.getElementById('eventName').value;
    const eventType = document.getElementById('eventType').value;
    const eventVenue = document.getElementById('eventVenue').value;
    const eventDate = document.getElementById('eventDate').value;
    const eventTime = document.getElementById('eventTime').value;
    const eventDescription = document.getElementById('eventDescription').value;
    
    if (!eventName || !eventType || !eventVenue || !eventDate) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }
    
    const newEvent = {
        event_id: eventId || generateId(),
        event_name: eventName,
        event_type: eventType,
        event_venue: eventVenue,
        event_date: eventDate,
        event_time: eventTime,
        event_description: eventDescription,
        created_at: new Date().toISOString()
    };
    
    let apiSuccess = false;
    
    if (eventId) {
        // Update existing event
        if (useAPI) {
            try {
                const result = await updateEventInAPI(eventId, newEvent);
                if (result.success) {
                    apiSuccess = true;
                    console.log('Event updated in API');
                }
            } catch (error) {
                console.error('API update failed:', error);
            }
        }
        
        const index = events.findIndex(e => e.event_id === eventId);
        if (index !== -1) {
            events[index] = newEvent;
            if (!apiSuccess) {
                showMessage('Event updated successfully (saved locally only)', 'success');
            } else {
                showMessage('Event updated successfully and synced to Google Sheets!', 'success');
            }
        }
    } else {
        // Create new event
        if (useAPI) {
            try {
                const result = await createEventInAPI(newEvent);
                if (result.success) {
                    apiSuccess = true;
                    console.log('Event created in API');
                }
            } catch (error) {
                console.error('API create failed:', error);
            }
        }
        
        events.push(newEvent);
        if (!apiSuccess) {
            showMessage('Event created successfully (saved locally only)', 'success');
        } else {
            showMessage('Event created successfully and synced to Google Sheets!', 'success');
        }
    }
    
    saveEventsToLocal();
    renderEvents();
    closeEventModal();
}

async function openEventDetails(eventId) {
    const event = events.find(e => e.event_id === eventId);
    if (!event) return;
    
    currentEventForCheckin = event;
    
    // Refresh attendances from API
    if (useAPI) {
        try {
            const attendanceResult = await getEventAttendancesFromAPI(eventId);
            if (attendanceResult.success && attendanceResult.data) {
                // Update local attendances
                const otherAttendances = eventAttendances.filter(a => a.event_id !== eventId);
                eventAttendances = [...otherAttendances, ...attendanceResult.data];
                saveAttendancesToLocal();
            }
        } catch (error) {
            console.error('Failed to refresh attendances:', error);
        }
    }
    
    const eventInfoHtml = `
        <div class="event-info-row"><i class="fas fa-calendar-alt"></i> <strong>Event:</strong> ${escapeHtml(event.event_name)}</div>
        <div class="event-info-row"><i class="fas fa-tag"></i> <strong>Type:</strong> ${getEventTypeLabel(event.event_type)}</div>
        <div class="event-info-row"><i class="fas fa-map-marker-alt"></i> <strong>Venue:</strong> ${escapeHtml(event.event_venue)}</div>
        <div class="event-info-row"><i class="fas fa-calendar"></i> <strong>Date:</strong> ${formatDate(event.event_date)}</div>
        <div class="event-info-row"><i class="fas fa-clock"></i> <strong>Time:</strong> ${event.event_time || 'Time TBA'}</div>
        ${event.event_description ? `<div class="event-info-row"><i class="fas fa-info-circle"></i> <strong>Description:</strong> ${escapeHtml(event.event_description)}</div>` : ''}
    `;
    
    document.getElementById('eventInfo').innerHTML = eventInfoHtml;
    document.getElementById('detailsEventTitle').innerHTML = `<i class="fas fa-calendar-alt"></i> ${escapeHtml(event.event_name)}`;
    
    document.getElementById('memberSearchInput').value = '';
    document.getElementById('memberSearchResults').style.display = 'none';
    
    renderCheckedInMembers(eventId);
    
    document.getElementById('eventDetailsModal').style.display = 'flex';
}

function closeEventDetailsModal() {
    document.getElementById('eventDetailsModal').style.display = 'none';
    currentEventForCheckin = null;
}

function renderCheckedInMembers(eventId) {
    const container = document.getElementById('checkedInMembersList');
    const attendances = eventAttendances.filter(a => a.event_id === eventId);
    const countSpan = document.getElementById('checkedInCount');
    
    if (countSpan) countSpan.innerText = attendances.length;
    
    if (attendances.length === 0) {
        container.innerHTML = '<div class="empty-small">No members checked in yet</div>';
        return;
    }
    
    let html = '';
    attendances.forEach(att => {
        const member = members.find(m => m.member_id === att.member_id);
        if (member) {
            const checkinTime = new Date(att.checkin_time).toLocaleTimeString();
            html += `
                <div class="checkedin-member-item">
                    <div class="checkedin-member-info">
                        <span class="checkedin-member-name">${escapeHtml(member.firstname)} ${escapeHtml(member.surname)}</span>
                        <span class="checkedin-member-time"><i class="fas fa-clock"></i> Checked in at ${checkinTime}</span>
                    </div>
                    <button class="btn-remove-checkin" onclick="removeCheckin('${att.attendance_id}', '${eventId}')" title="Remove check-in"><i class="fas fa-times-circle"></i></button>
                </div>
            `;
        }
    });
    
    container.innerHTML = html;
}

function searchMembersForCheckin() {
    const searchTerm = document.getElementById('memberSearchInput').value.toLowerCase().trim();
    const resultsContainer = document.getElementById('memberSearchResults');
    
    if (!searchTerm) {
        resultsContainer.style.display = 'none';
        return;
    }
    
    const checkedInIds = eventAttendances.filter(a => a.event_id === currentEventForCheckin.event_id).map(a => a.member_id);
    
    const filtered = members.filter(m => 
        !checkedInIds.includes(m.member_id) &&
        ((m.firstname && m.firstname.toLowerCase().includes(searchTerm)) ||
         (m.surname && m.surname.toLowerCase().includes(searchTerm)) ||
         (m.pin && m.pin.toLowerCase().includes(searchTerm)) ||
         (m.contact && m.contact.toLowerCase().includes(searchTerm)))
    );
    
    if (filtered.length === 0) {
        resultsContainer.innerHTML = '<div class="member-result-item">No members found</div>';
        resultsContainer.style.display = 'block';
        return;
    }
    
    let html = '';
    filtered.forEach(member => {
        html += `
            <div class="member-result-item">
                <div class="member-result-info">
                    <span class="member-result-name">${escapeHtml(member.firstname)} ${escapeHtml(member.surname)}</span>
                    <span class="member-result-details">PIN: ${member.pin || 'N/A'} | Contact: ${member.contact || 'N/A'} | Branch: ${member.branch || 'N/A'}</span>
                </div>
                <button class="btn-checkin-member" onclick="checkinMember('${member.member_id}')"><i class="fas fa-check-circle"></i> Check In</button>
            </div>
        `;
    });
    
    resultsContainer.innerHTML = html;
    resultsContainer.style.display = 'block';
}

// Check in a member to API and localStorage
async function checkinMember(memberId) {
    if (!currentEventForCheckin) return;
    
    const member = members.find(m => m.member_id === memberId);
    if (!member) return;
    
    const alreadyCheckedIn = eventAttendances.some(a => a.event_id === currentEventForCheckin.event_id && a.member_id === memberId);
    if (alreadyCheckedIn) {
        showMessage(`${member.firstname} ${member.surname} is already checked in!`, 'error');
        return;
    }
    
    const attendance = {
        attendance_id: generateId(),
        event_id: currentEventForCheckin.event_id,
        member_id: memberId,
        checkin_time: new Date().toISOString(),
        member_name: `${member.firstname} ${member.surname}`
    };
    
    let apiSuccess = false;
    
    if (useAPI) {
        try {
            const result = await createAttendanceInAPI(attendance);
            if (result.success) {
                apiSuccess = true;
                console.log('Attendance saved to API');
            }
        } catch (error) {
            console.error('API save failed:', error);
        }
    }
    
    eventAttendances.push(attendance);
    saveAttendancesToLocal();
    
    if (apiSuccess) {
        showMessage(`${member.firstname} ${member.surname} checked in successfully and synced to Google Sheets!`, 'success');
    } else {
        showMessage(`${member.firstname} ${member.surname} checked in successfully (saved locally only)`, 'success');
    }
    
    document.getElementById('memberSearchInput').value = '';
    document.getElementById('memberSearchResults').style.display = 'none';
    renderCheckedInMembers(currentEventForCheckin.event_id);
}

// Remove check-in from API and localStorage
async function removeCheckin(attendanceId, eventId) {
    let apiSuccess = false;
    
    if (useAPI) {
        try {
            const result = await deleteAttendanceFromAPI(attendanceId);
            if (result.success) {
                apiSuccess = true;
                console.log('Attendance removed from API');
            }
        } catch (error) {
            console.error('API delete failed:', error);
        }
    }
    
    const index = eventAttendances.findIndex(a => a.attendance_id === attendanceId);
    if (index !== -1) {
        eventAttendances.splice(index, 1);
        saveAttendancesToLocal();
        
        if (apiSuccess) {
            showMessage('Check-in removed and synced to Google Sheets', 'success');
        } else {
            showMessage('Check-in removed (saved locally only)', 'success');
        }
        
        renderCheckedInMembers(eventId);
    }
}

function exportAttendance() {
    if (!currentEventForCheckin) return;
    
    const attendances = eventAttendances.filter(a => a.event_id === currentEventForCheckin.event_id);
    
    const csvRows = [];
    csvRows.push(['Member Name', 'PIN', 'Contact', 'Branch', 'Check-in Time'].join(','));
    
    attendances.forEach(att => {
        const member = members.find(m => m.member_id === att.member_id);
        if (member) {
            const row = [
                `"${member.firstname} ${member.surname}"`,
                `"${member.pin || ''}"`,
                `"${member.contact || ''}"`,
                `"${member.branch || ''}"`,
                `${new Date(att.checkin_time).toLocaleString()}`
            ];
            csvRows.push(row.join(','));
        }
    });
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentEventForCheckin.event_name.replace(/[^a-z0-9]/gi, '_')}_attendance_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage('Attendance exported successfully!', 'success');
}

function openDeleteEventModal(eventId) {
    const event = events.find(e => e.event_id === eventId);
    if (event) {
        eventToDelete = event;
        document.getElementById('deleteEventName').innerText = `${event.event_name} (${formatDate(event.event_date)})`;
        document.getElementById('deleteEventConfirmation').value = '';
        document.getElementById('deleteEventModal').style.display = 'flex';
    }
}

function closeDeleteEventModal() {
    document.getElementById('deleteEventModal').style.display = 'none';
    eventToDelete = null;
}

async function confirmDeleteEvent() {
    const confirmation = document.getElementById('deleteEventConfirmation').value;
    if (confirmation !== 'DELETE') {
        showMessage('Please type "DELETE" to confirm deletion', 'error');
        return;
    }
    
    if (eventToDelete) {
        let apiSuccess = false;
        
        if (useAPI) {
            try {
                const result = await deleteEventFromAPI(eventToDelete.event_id);
                if (result.success) {
                    apiSuccess = true;
                    console.log('Event deleted from API');
                }
            } catch (error) {
                console.error('API delete failed:', error);
            }
        }
        
        const eventIndex = events.findIndex(e => e.event_id === eventToDelete.event_id);
        if (eventIndex !== -1) events.splice(eventIndex, 1);
        
        eventAttendances = eventAttendances.filter(a => a.event_id !== eventToDelete.event_id);
        
        saveEventsToLocal();
        saveAttendancesToLocal();
        renderEvents();
        
        if (apiSuccess) {
            showMessage(`Event "${eventToDelete.event_name}" deleted successfully from Google Sheets!`, 'success');
        } else {
            showMessage(`Event "${eventToDelete.event_name}" deleted successfully (saved locally only)`, 'success');
        }
        
        closeDeleteEventModal();
    }
}

function setupEventListeners() {
    const createEventBtn = document.getElementById('createEventBtn');
    const refreshEventsBtn = document.getElementById('refreshEventsBtn');
    const closeEventModalBtn = document.getElementById('closeEventModalBtn');
    const cancelEventBtn = document.getElementById('cancelEventBtn');
    const eventForm = document.getElementById('eventForm');
    const closeDetailsModalBtn = document.getElementById('closeDetailsModalBtn');
    const closeDetailsFooterBtn = document.getElementById('closeDetailsFooterBtn');
    const searchMemberBtn = document.getElementById('searchMemberBtn');
    const memberSearchInput = document.getElementById('memberSearchInput');
    const exportAttendanceBtn = document.getElementById('exportEventAttendanceBtn');
    const closeDeleteEventModalBtn = document.getElementById('closeDeleteEventModalBtn');
    const cancelDeleteEventBtn = document.getElementById('cancelDeleteEventBtn');
    const confirmDeleteEventBtn = document.getElementById('confirmDeleteEventBtn');
    
    if (createEventBtn) createEventBtn.addEventListener('click', openCreateEventModal);
    if (refreshEventsBtn) refreshEventsBtn.addEventListener('click', () => renderEvents());
    if (closeEventModalBtn) closeEventModalBtn.addEventListener('click', closeEventModal);
    if (cancelEventBtn) cancelEventBtn.addEventListener('click', closeEventModal);
    if (eventForm) eventForm.addEventListener('submit', saveEvent);
    if (closeDetailsModalBtn) closeDetailsModalBtn.addEventListener('click', closeEventDetailsModal);
    if (closeDetailsFooterBtn) closeDetailsFooterBtn.addEventListener('click', closeEventDetailsModal);
    if (searchMemberBtn) searchMemberBtn.addEventListener('click', searchMembersForCheckin);
    if (exportAttendanceBtn) exportAttendanceBtn.addEventListener('click', exportAttendance);
    if (closeDeleteEventModalBtn) closeDeleteEventModalBtn.addEventListener('click', closeDeleteEventModal);
    if (cancelDeleteEventBtn) cancelDeleteEventBtn.addEventListener('click', closeDeleteEventModal);
    if (confirmDeleteEventBtn) confirmDeleteEventBtn.addEventListener('click', confirmDeleteEvent);
    
    if (memberSearchInput) {
        memberSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchMembersForCheckin();
            }
        });
    }
    
    window.onclick = function(event) {
        if (event.target.classList.contains('custom-modal')) {
            closeEventModal();
            closeEventDetailsModal();
            closeDeleteEventModal();
        }
    };
}

async function init() {
    console.log('Initializing Events Page...');
    await loadData();
    renderEvents();
    updateCurrentYear();
    setupEventListeners();
    console.log('Initialization complete');
}

window.openEventDetails = openEventDetails;
window.openDeleteEventModal = openDeleteEventModal;
window.checkinMember = checkinMember;
window.removeCheckin = removeCheckin;

init();