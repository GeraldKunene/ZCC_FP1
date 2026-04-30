// ========== UPDATE PAGE - MAIN APPLICATION ==========
let members = [];
let currentSelectedMember = null;

// Load data from localStorage
function loadData() {
    const stored = localStorage.getItem("kganya_members");
    if (stored) {
        members = JSON.parse(stored);
    } else {
        members = [];
        saveToLocal();
    }
    renderMembersTable(members);
}

function saveToLocal() {
    localStorage.setItem("kganya_members", JSON.stringify(members));
}

// Render members table
function renderMembersTable(dataArray) {
    const tbody = document.getElementById("membersTableBody");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    if (dataArray.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No members found.</td></tr>';
        const memberCountBadge = document.getElementById("memberCountBadge");
        if (memberCountBadge) memberCountBadge.innerText = "0 members";
        return;
    }
    
    dataArray.forEach(m => {
        const row = tbody.insertRow();
        row.insertCell(0).innerText = m.firstname || "";
        row.insertCell(1).innerText = m.surname || "";
        row.insertCell(2).innerText = m.pin || "";
        row.insertCell(3).innerText = m.contact || "";
        row.insertCell(4).innerText = m.branch || "N/A";
        
        // Status badge
        let statusClass = "status-active";
        let statusText = "Active";
        if (m.status === "backslided") { statusClass = "status-backslided"; statusText = "Backslided"; }
        else if (m.status === "deceased") { statusClass = "status-deceased"; statusText = "Deceased"; }
        else if (m.status === "transfer_out") { statusClass = "status-transfer"; statusText = "Transferred Out"; }
        else if (m.status === "transfer_in") { statusClass = "status-transfer"; statusText = "Transferred In"; }
        else if (m.status === "converts") { statusClass = "status-active"; statusText = "Convert"; }
        
        row.insertCell(5).innerHTML = `<span class="status-badge ${statusClass}">${statusText}</span>`;
        row.insertCell(6).innerHTML = `<span class="badge-kganya"><i class="fas ${m.kganya_member === 'Yes' ? 'fa-check-circle' : 'fa-times-circle'}"></i> ${m.kganya_member === 'Yes' ? 'Yes' : 'No'}</span>`;
        
        const actionCell = row.insertCell(7);
        actionCell.className = "action-buttons";
        actionCell.innerHTML = `
            <button class="btn btn-sm btn-info update-status-btn" data-id="${m.member_id}">
                <i class="fas fa-chart-line"></i> Update Status
            </button>
        `;
    });
    
    const memberCountBadge = document.getElementById("memberCountBadge");
    if (memberCountBadge) {
        memberCountBadge.innerText = `${dataArray.length} member${dataArray.length !== 1 ? 's' : ''}`;
    }
    attachTableEvents();
}

function attachTableEvents() {
    document.querySelectorAll(".update-status-btn").forEach(btn => {
        btn.addEventListener("click", (e) => { 
            const id = btn.getAttribute("data-id"); 
            openStatusModal(id); 
        });
    });
}

// Search handling
function applySearchAndRender() {
    const searchInput = document.getElementById("globalSearchInput");
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm === "") {
        renderMembersTable(members);
    } else {
        const filtered = members.filter(m => 
            (m.firstname && m.firstname.toLowerCase().includes(searchTerm)) ||
            (m.surname && m.surname.toLowerCase().includes(searchTerm)) ||
            (m.pin && m.pin.toLowerCase().includes(searchTerm)) ||
            (m.contact && m.contact.toLowerCase().includes(searchTerm))
        );
        renderMembersTable(filtered);
        if (filtered.length === 0) {
            showMessage(`No members found matching "${searchTerm}"`, "error");
        }
    }
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

// Open Status Modal
function openStatusModal(memberId) {
    const member = members.find(m => m.member_id === memberId);
    if (member) {
        currentSelectedMember = member;
        document.getElementById("statusMemberId").value = memberId;
        
        // Display member info
        const memberInfoDiv = document.getElementById("selectedMemberInfo");
        memberInfoDiv.innerHTML = `
            <div class="member-detail-row"><strong>Name:</strong> ${escapeHtml(member.firstname)} ${escapeHtml(member.surname)}</div>
            <div class="member-detail-row"><strong>PIN:</strong> ${escapeHtml(member.pin)}</div>
            <div class="member-detail-row"><strong>Branch:</strong> ${member.branch || 'N/A'}</div>
            <div class="member-detail-row"><strong>Current Status:</strong> ${member.status || 'Active'}</div>
        `;
        
        resetStatusForm();
        document.getElementById("statusModal").style.display = "flex";
    }
}

function closeStatusModal() { 
    document.getElementById("statusModal").style.display = "none"; 
}

function resetStatusForm() {
    document.getElementById("memberOutcome").value = "";
    document.getElementById("convertFrom").value = "";
    document.getElementById("receivingBranch").value = "";
    document.getElementById("sendingBranch").value = "";
    document.getElementById("dateOfStatus").value = "";
    document.getElementById("statusNotes").value = "";
    document.getElementById("transferredToGroup").style.display = "none";
    document.getElementById("transferredFromGroup").style.display = "none";
    document.getElementById("convertFromGroup").style.display = "block";
    document.getElementById("dateOfStatusLabel").innerHTML = "Outcome Date";
}

// Toggle fields based on outcome
function toggleStatusFields() {
    const outcome = document.getElementById("memberOutcome").value;
    const transferredToGroup = document.getElementById("transferredToGroup");
    const transferredFromGroup = document.getElementById("transferredFromGroup");
    const convertFromGroup = document.getElementById("convertFromGroup");
    const dateLabel = document.getElementById("dateOfStatusLabel");
    
    // Hide all conditional groups first
    if (transferredToGroup) transferredToGroup.style.display = "none";
    if (transferredFromGroup) transferredFromGroup.style.display = "none";
    if (convertFromGroup) convertFromGroup.style.display = "none";
    
    if (outcome === "transfer_out") {
        if (transferredToGroup) transferredToGroup.style.display = "block";
        if (dateLabel) dateLabel.innerHTML = "Transfer Date";
    } else if (outcome === "transfer_in") {
        if (transferredFromGroup) transferredFromGroup.style.display = "block";
        if (dateLabel) dateLabel.innerHTML = "Transfer Date";
    } else if (outcome === "deceased") {
        if (dateLabel) dateLabel.innerHTML = "Decease Date";
    } else if (outcome === "backslided") {
        if (dateLabel) dateLabel.innerHTML = "Date Backslided";
    } else if (outcome === "converts") {
        if (convertFromGroup) convertFromGroup.style.display = "block";
        if (dateLabel) dateLabel.innerHTML = "Date Converted";
    } else if (outcome === "active") {
        if (dateLabel) dateLabel.innerHTML = "Reactivation Date";
    } else {
        if (dateLabel) dateLabel.innerHTML = "Outcome Date";
    }
}

// Update date label based on convert from selection
function updateDateLabel() {
    const convertFromVal = document.getElementById("convertFrom");
    const outcome = document.getElementById("memberOutcome");
    const dateLabel = document.getElementById("dateOfStatusLabel");
    
    if (outcome && outcome.value === "converts" && convertFromVal && convertFromVal.value && dateLabel) {
        const selectedText = convertFromVal.options[convertFromVal.selectedIndex]?.text || "";
        if (selectedText) dateLabel.innerHTML = `Date converted from ${selectedText}`;
        else dateLabel.innerHTML = "Date Converted";
    }
}

// Handle status form submission
const statusForm = document.getElementById("statusForm");
if (statusForm) {
    statusForm.addEventListener("submit", function(e) {
        e.preventDefault();
        
        const memberId = document.getElementById("statusMemberId").value;
        const outcome = document.getElementById("memberOutcome").value;
        const convertFrom = document.getElementById("convertFrom").value;
        const receivingBranch = document.getElementById("receivingBranch").value;
        const sendingBranch = document.getElementById("sendingBranch").value;
        const statusDate = document.getElementById("dateOfStatus").value;
        const notes = document.getElementById("statusNotes").value;
        
        if (!outcome || !statusDate) {
            showMessage("Please select outcome and date", "error");
            return;
        }
        
        if (outcome === "transfer_out" && !receivingBranch) {
            showMessage("Please select receiving branch for transfer out", "error");
            return;
        }
        
        if (outcome === "transfer_in" && !sendingBranch) {
            showMessage("Please select sending branch for transfer in", "error");
            return;
        }
        
        if (outcome === "converts" && !convertFrom) {
            showMessage("Please select Convert From option", "error");
            return;
        }
        
        const memberIndex = members.findIndex(m => m.member_id === memberId);
        if (memberIndex !== -1) {
            const statusRecord = {
                outcome: outcome,
                convertFrom: convertFrom,
                receivingBranch: receivingBranch,
                sendingBranch: sendingBranch,
                date: statusDate,
                notes: notes,
                recordedAt: new Date().toISOString()
            };
            
            if (!members[memberIndex].statusHistory) {
                members[memberIndex].statusHistory = [];
            }
            
            members[memberIndex].statusHistory.push(statusRecord);
            members[memberIndex].status = outcome;
            
            if (outcome === "transfer_out" && receivingBranch) {
                members[memberIndex].transferredTo = receivingBranch;
            }
            if (outcome === "transfer_in" && sendingBranch) {
                members[memberIndex].transferredFrom = sendingBranch;
                members[memberIndex].branch = sendingBranch; // Update current branch
            }
            
            saveToLocal();
            showMessage(`Status updated for ${members[memberIndex].firstname} ${members[memberIndex].surname}`, "success");
            closeStatusModal();
            applySearchAndRender();
        } else {
            showMessage("Member not found", "error");
        }
    });
}

// Event Listeners
function setupEventListeners() {
    const searchBtn = document.getElementById("searchBtn");
    const resetBtn = document.getElementById("resetBtn");
    const closeStatusBtn = document.getElementById("closeStatusModalBtn");
    const cancelStatusBtn = document.getElementById("cancelStatusBtn");
    const memberOutcome = document.getElementById("memberOutcome");
    const convertFrom = document.getElementById("convertFrom");
    const searchInput = document.getElementById("globalSearchInput");
    
    if (searchBtn) searchBtn.addEventListener("click", () => applySearchAndRender());
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            if (searchInput) searchInput.value = "";
            applySearchAndRender();
        });
    }
    if (closeStatusBtn) closeStatusBtn.addEventListener("click", closeStatusModal);
    if (cancelStatusBtn) cancelStatusBtn.addEventListener("click", closeStatusModal);
    if (memberOutcome) memberOutcome.addEventListener("change", toggleStatusFields);
    if (convertFrom) convertFrom.addEventListener("change", updateDateLabel);
    
    if (searchInput) {
        searchInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                applySearchAndRender();
            }
        });
    }
    
    window.onclick = function(event) {
        if (event.target.classList.contains('custom-modal')) {
            closeStatusModal();
        }
    };
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

// Initialize
function init() {
    loadData();
    updateCurrentYear();
    setupEventListeners();
}

init();