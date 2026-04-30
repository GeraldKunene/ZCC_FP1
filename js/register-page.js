// ========== REGISTER PAGE - GOOGLE SHEETS BACKEND ==========
let members = [];
let filteredMembers = [];
let memberToDelete = null;
let currentStep = 1;
const totalSteps = 5;
let isLoading = false;

// Load initial data from Google Sheets
async function loadInitialData() {
  showLoading(true);
  
  try {
    const result = await api.getMembers();
    console.log('API Response:', result);
    
    if (result.success && result.data) {
      members = result.data;
      filteredMembers = [...members];
      console.log('Members loaded:', members.length);
      console.log('First member sample:', members[0]);
      renderMembersTable(filteredMembers);
      updateMemberCount(filteredMembers.length);
    } else {
      members = [];
      filteredMembers = [];
      renderMembersTable(filteredMembers);
      updateMemberCount(0);
      if (result.error) {
        showMessage('Error loading members: ' + result.error, 'error');
      }
    }
  } catch (error) {
    console.error('Error loading members:', error);
    showMessage('Error connecting to server. Please check your connection.', 'error');
    members = [];
    filteredMembers = [];
    renderMembersTable(filteredMembers);
    updateMemberCount(0);
  }
  
  showLoading(false);
}

function updateMemberCount(count) {
  const memberCountBadge = document.getElementById("memberCountBadge");
  if (memberCountBadge) {
    memberCountBadge.innerText = `${count} member${count !== 1 ? 's' : ''}`;
  }
}

function showLoading(show) {
  isLoading = show;
  const tbody = document.getElementById("membersTableBody");
  if (tbody && show) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4"><div class="spinner-border text-success" role="status"><span class="visually-hidden">Loading...</span></div><p class="mt-2 text-muted">Loading members...</p></td></tr>';
  }
}

function renderMembersTable(dataArray) {
  const tbody = document.getElementById("membersTableBody");
  if (!tbody) return;
  
  tbody.innerHTML = "";
  
  if (!dataArray || dataArray.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No members found. Click "Register Member" to add one.</td></tr>';
    updateMemberCount(0);
    return;
  }
  
  dataArray.forEach(m => {
    const row = tbody.insertRow();
    row.insertCell(0).innerText = m.firstname || "";
    row.insertCell(1).innerText = m.surname || "";
    row.insertCell(2).innerText = m.pin || "";
    row.insertCell(3).innerText = m.contact || "";
    row.insertCell(4).innerText = m.branch || "N/A";
    
    let activityText = "";
    switch(m.church_activity) {
      case 'mokhukhu': activityText = 'Mokhukhu'; break;
      case 'female_choir': activityText = 'Female Choir'; break;
      case 'male_choir': activityText = 'Male Choir'; break;
      case 'sunday_school': activityText = 'Sunday School'; break;
      default: activityText = m.church_activity || 'N/A';
    }
    row.insertCell(5).innerText = activityText;
    row.insertCell(6).innerHTML = `<span class="badge-kganya"><i class="fas ${m.kganya_member === 'Yes' ? 'fa-check-circle' : 'fa-times-circle'}"></i> ${m.kganya_member === 'Yes' ? 'Yes' : 'No'}</span>`;
    
    const actionCell = row.insertCell(7);
    actionCell.className = "action-buttons";
    actionCell.innerHTML = `
      <button class="btn btn-sm btn-outline-success edit-member-btn" data-id="${m.member_id}"><i class="fas fa-edit"></i> Edit</button>
      <button class="btn btn-sm btn-outline-danger delete-member-btn" data-id="${m.member_id}"><i class="fas fa-trash-alt"></i> Del</button>
    `;
  });
  
  updateMemberCount(dataArray.length);
  attachTableEvents();
}

function attachTableEvents() {
  document.querySelectorAll(".edit-member-btn").forEach(btn => {
    btn.addEventListener("click", (e) => { 
      const id = btn.getAttribute("data-id"); 
      openEditModal(id); 
    });
  });
  
  document.querySelectorAll(".delete-member-btn").forEach(btn => {
    btn.addEventListener("click", (e) => { 
      const id = btn.getAttribute("data-id"); 
      openDeleteModal(id); 
    });
  });
}

// ========== FIXED SEARCH FUNCTION - WORKS WITH ANY DATA STRUCTURE ==========
function applySearchAndRender() {
  const searchInput = document.getElementById("globalSearchInput");
  if (!searchInput) {
    console.error("Search input not found");
    return;
  }
  
  const searchTerm = searchInput.value.toLowerCase().trim();
  console.log('🔍 Searching for:', searchTerm);
  console.log('Total members available:', members.length);
  
  if (searchTerm === "") {
    // Show all members
    filteredMembers = [...members];
    renderMembersTable(filteredMembers);
    console.log('Showing all members:', filteredMembers.length);
    showMessage(`Showing all ${filteredMembers.length} members`, "success");
  } else {
    // Filter members - check multiple fields safely
    filteredMembers = members.filter(m => {
      // Safely get field values (handle null/undefined)
      const firstName = (m.firstname || m.first_name || m.FirstName || "").toString().toLowerCase();
      const surname = (m.surname || m.lastname || m.last_name || m.Surname || "").toString().toLowerCase();
      const pin = (m.pin || m.id_number || m.IDNumber || m.PIN || "").toString().toLowerCase();
      const contact = (m.contact || m.phone || m.mobile || m.Contact || "").toString().toLowerCase();
      const fullName = (firstName + " " + surname).toLowerCase();
      
      // Check if any field matches the search term
      const matches = firstName.includes(searchTerm) || 
                      surname.includes(searchTerm) || 
                      fullName.includes(searchTerm) ||
                      pin.includes(searchTerm) || 
                      contact.includes(searchTerm);
      
      if (matches) {
        console.log('✅ Match found:', firstName, surname);
      }
      return matches;
    });
    
    console.log('🎯 Found matches:', filteredMembers.length);
    renderMembersTable(filteredMembers);
    
    if (filteredMembers.length === 0) {
      showMessage(`❌ No members found matching "${searchTerm}"`, "error");
    } else {
      showMessage(`✅ Found ${filteredMembers.length} member(s) matching "${searchTerm}"`, "success");
    }
  }
}

// Reset search function
function resetSearch() {
  console.log('🔄 Resetting search...');
  const searchInput = document.getElementById("globalSearchInput");
  if (searchInput) {
    searchInput.value = "";
  }
  filteredMembers = [...members];
  renderMembersTable(filteredMembers);
  showMessage(`Search cleared. Showing all ${filteredMembers.length} members.`, "success");
}

// Direct search by PIN (for quick check-in)
async function searchByPin(pin) {
  if (!pin) return null;
  
  const searchTerm = pin.toString().toLowerCase().trim();
  const found = members.find(m => {
    const memberPin = (m.pin || m.id_number || m.IDNumber || "").toString().toLowerCase();
    return memberPin === searchTerm;
  });
  
  return found || null;
}

function showStep(step) {
  document.querySelectorAll('.step-section').forEach(section => {
    section.style.display = 'none';
  });
  
  const currentSection = document.querySelector(`.step-section[data-section="${step}"]`);
  if (currentSection) {
    currentSection.style.display = 'block';
  }
  
  document.querySelectorAll('.step').forEach((stepEl, index) => {
    const stepNum = index + 1;
    stepEl.classList.remove('active', 'completed');
    
    if (stepNum < step) {
      stepEl.classList.add('completed');
    } else if (stepNum === step) {
      stepEl.classList.add('active');
    }
  });
  
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const saveBtn = document.getElementById('saveBtn');
  
  if (step === 1) {
    prevBtn.style.display = 'none';
  } else {
    prevBtn.style.display = 'inline-flex';
  }
  
  if (step === totalSteps) {
    nextBtn.style.display = 'none';
    saveBtn.style.display = 'inline-flex';
    updateReviewContent();
  } else {
    nextBtn.style.display = 'inline-flex';
    saveBtn.style.display = 'none';
  }
  
  currentStep = step;
  document.getElementById('currentStep').value = step;
}

function nextStep() {
  if (validateCurrentSection(currentStep)) {
    if (currentStep < totalSteps) {
      showStep(currentStep + 1);
    }
  }
}

function prevStep() {
  if (currentStep > 1) {
    showStep(currentStep - 1);
  }
}

function validateCurrentSection(step) {
  if (step === 1) {
    const firstname = document.getElementById('firstname').value;
    const surname = document.getElementById('surname').value;
    const pin = document.getElementById('pin').value;
    const contact = document.getElementById('contact').value;
    
    if (!firstname) {
      showMessage('Please enter first name', 'error');
      return false;
    }
    if (!surname) {
      showMessage('Please enter surname', 'error');
      return false;
    }
    if (!pin) {
      showMessage('Please enter PIN/ID number', 'error');
      return false;
    }
    if (!contact) {
      showMessage('Please enter contact number', 'error');
      return false;
    }
  }
  return true;
}

function updateReviewContent() {
  const reviewContent = document.getElementById('reviewContent');
  if (!reviewContent) return;
  
  const getValue = (id, defaultValue = 'Not provided') => {
    const element = document.getElementById(id);
    return element ? (element.value || defaultValue) : defaultValue;
  };
  
  const getSelectText = (id, defaultValue = 'Not selected') => {
    const element = document.getElementById(id);
    if (element && element.selectedIndex !== -1) {
      return element.options[element.selectedIndex].text || defaultValue;
    }
    return defaultValue;
  };
  
  const getCheckboxText = (id, trueText = 'Yes', falseText = 'No') => {
    const element = document.getElementById(id);
    return element && element.checked ? trueText : falseText;
  };
  
  const formatChurchActivity = (value) => {
    const activities = {
      'mokhukhu': 'Mokhukhu',
      'female_choir': 'Female Choir',
      'male_choir': 'Male Choir',
      'sunday_school': 'Sunday School',
      'other': 'Other'
    };
    return activities[value] || value || 'Not selected';
  };
  
  reviewContent.innerHTML = `
    <div class="review-section-title"><i class="fas fa-user-friends"></i> Demographics Information</div>
    <div class="review-item"><strong>Firstname:</strong> ${escapeHtml(getValue('firstname'))}</div>
    <div class="review-item"><strong>Middlename:</strong> ${escapeHtml(getValue('middlename', ''))}</div>
    <div class="review-item"><strong>Surname:</strong> ${escapeHtml(getValue('surname'))}</div>
    <div class="review-item"><strong>PIN:</strong> ${escapeHtml(getValue('pin'))}</div>
    <div class="review-item"><strong>Gender:</strong> ${getSelectText('gender')}</div>
    <div class="review-item"><strong>Contact 1:</strong> ${escapeHtml(getValue('contact'))}</div>
    <div class="review-item"><strong>Contact 2:</strong> ${escapeHtml(getValue('contact2', ''))}</div>
    <div class="review-item"><strong>Branch:</strong> ${getSelectText('branch', 'Not selected')}</div>
    <div class="review-item"><strong>Baptism Date:</strong> ${getValue('date_of_baptism', 'Not provided')}</div>
    <div class="review-item"><strong>Residential Address:</strong> ${escapeHtml(getValue('residential_address', 'Not provided'))}</div>
    <div class="review-item"><strong>Pays Kganya:</strong> ${getSelectText('kganya_member')}</div>
    <div class="review-item"><strong>Kganya Book Number:</strong> ${escapeHtml(getValue('kganya_book_number', 'Not provided'))}</div>
    <div class="review-item"><strong>Church Activity:</strong> ${formatChurchActivity(getValue('church_activity'))}</div>
    
    <div class="review-section-title"><i class="fas fa-heart"></i> Next of Kin Information</div>
    <div class="review-item"><strong>Next of Kin Name:</strong> ${escapeHtml(getValue('nok_firstname', ''))} ${escapeHtml(getValue('nok_surname', ''))}</div>
    <div class="review-item"><strong>Next of Kin Contact:</strong> ${escapeHtml(getValue('nok_contact', 'Not provided'))}</div>
    <div class="review-item"><strong>Relationship:</strong> ${getSelectText('nok_relationship', 'Not specified')}</div>
    
    <div class="review-section-title"><i class="fas fa-users"></i> Committee Information</div>
    <div class="review-item"><strong>In Executive Committee:</strong> ${getCheckboxText('in_executive_committee')}</div>
    ${document.getElementById('in_executive_committee').checked ? `
      <div class="review-item"><strong>Executive Committee:</strong> ${getSelectText('executive_committee', 'Not selected')}</div>
      <div class="review-item"><strong>Committee Role:</strong> ${escapeHtml(getValue('executive_committee_role', 'Not provided'))}</div>
    ` : ''}
    
    <div class="review-section-title"><i class="fas fa-cogs"></i> Skills Set</div>
    <div class="review-item"><strong>Employment Status:</strong> ${getSelectText('employment_status', 'Not specified')}</div>
    <div class="review-item"><strong>Occupation:</strong> ${escapeHtml(getValue('occupation', 'Not provided'))}</div>
    <div class="review-item"><strong>Education Level:</strong> ${getSelectText('education_level', 'Not specified')}</div>
    <div class="review-item"><strong>Highest Certification:</strong> ${escapeHtml(getValue('highest_certification', 'Not provided'))}</div>
    <div class="review-item"><strong>Qualification:</strong> ${escapeHtml(getValue('qualification', 'Not provided'))}</div>
    <div class="review-item"><strong>Skills:</strong> ${escapeHtml(getValue('skills', 'Not provided'))}</div>
    <div class="review-item"><strong>Formally Trained:</strong> ${getSelectText('formally_trained_on_skills', 'Not specified')}</div>
  `;
}

function openRegisterModal() {
  const title = document.getElementById("registerModalTitle");
  const form = document.getElementById("memberForm");
  const editId = document.getElementById("editMemberId");
  const modal = document.getElementById("registerModal");
  
  if (title) title.innerHTML = '<i class="fas fa-user-plus"></i> Register New Member';
  if (form) form.reset();
  if (editId) editId.value = "";
  
  const committeeGroup = document.getElementById('executive_committee_group');
  const roleGroup = document.getElementById('executive_committee_role_group');
  if (committeeGroup) committeeGroup.style.display = 'none';
  if (roleGroup) roleGroup.style.display = 'none';
  const inCommitteeCheckbox = document.getElementById('in_executive_committee');
  if (inCommitteeCheckbox) inCommitteeCheckbox.checked = false;
  
  currentStep = 1;
  showStep(1);
  
  if (modal) modal.style.display = "flex";
}

function closeRegisterModal() { 
  const modal = document.getElementById("registerModal");
  if (modal) modal.style.display = "none"; 
}

function openEditModal(memberId) {
  const member = members.find(m => m.member_id === memberId);
  if(member){
    document.getElementById("editMemberId").value = member.member_id;
    document.getElementById("firstname").value = member.firstname || "";
    document.getElementById("middlename").value = member.middlename || "";
    document.getElementById("surname").value = member.surname || "";
    document.getElementById("pin").value = member.pin || "";
    document.getElementById("gender").value = member.gender || "Male";
    document.getElementById("contact").value = member.contact || "";
    document.getElementById("contact2").value = member.contact2 || "";
    document.getElementById("branch").value = member.branch || "";
    document.getElementById("date_of_baptism").value = member.date_of_baptism || "";
    document.getElementById("residential_address").value = member.residential_address || "";
    document.getElementById("kganya_member").value = member.kganya_member || "Yes";
    document.getElementById("kganya_book_number").value = member.kganya_book_number || "";
    document.getElementById("church_activity").value = member.church_activity || "";
    
    document.getElementById("nok_firstname").value = member.nok_firstname || "";
    document.getElementById("nok_surname").value = member.nok_surname || "";
    document.getElementById("nok_contact").value = member.nok_contact || "";
    document.getElementById("nok_relationship").value = member.nok_relationship || "";
    
    const inCommittee = member.in_executive_committee === true;
    document.getElementById("in_executive_committee").checked = inCommittee;
    if (inCommittee) {
      document.getElementById('executive_committee_group').style.display = 'block';
      document.getElementById('executive_committee_role_group').style.display = 'block';
    } else {
      document.getElementById('executive_committee_group').style.display = 'none';
      document.getElementById('executive_committee_role_group').style.display = 'none';
    }
    document.getElementById("executive_committee").value = member.executive_committee || "";
    document.getElementById("executive_committee_role").value = member.executive_committee_role || "";
    
    document.getElementById("employment_status").value = member.employment_status || "";
    document.getElementById("occupation").value = member.occupation || "";
    document.getElementById("education_level").value = member.education_level || "";
    document.getElementById("highest_certification").value = member.highest_certification || "";
    document.getElementById("qualification").value = member.qualification || "";
    document.getElementById("skills").value = member.skills || "";
    document.getElementById("formally_trained_on_skills").value = member.formally_trained_on_skills || "";
    
    document.getElementById("registerModalTitle").innerHTML = '<i class="fas fa-edit"></i> Edit Member';
    currentStep = 1;
    showStep(1);
    document.getElementById("registerModal").style.display = "flex";
  }
}

// Committee checkbox event listener
const committeeCheckbox = document.getElementById('in_executive_committee');
if (committeeCheckbox) {
  committeeCheckbox.addEventListener('change', function() {
    const committeeGroup = document.getElementById('executive_committee_group');
    const roleGroup = document.getElementById('executive_committee_role_group');
    if (this.checked) {
      if (committeeGroup) committeeGroup.style.display = 'block';
      if (roleGroup) roleGroup.style.display = 'block';
    } else {
      if (committeeGroup) committeeGroup.style.display = 'none';
      if (roleGroup) roleGroup.style.display = 'none';
      const execCommittee = document.getElementById('executive_committee');
      const execRole = document.getElementById('executive_committee_role');
      if (execCommittee) execCommittee.value = '';
      if (execRole) execRole.value = '';
    }
  });
}

// Save button with loading state
let saveButtonOriginalText = '';

function setSaveButtonLoading(isLoading, isEditing = false) {
  const saveBtn = document.getElementById('saveBtn');
  if (!saveBtn) return;
  
  if (isLoading) {
    if (!saveButtonOriginalText) {
      saveButtonOriginalText = saveBtn.innerHTML;
    }
    saveBtn.disabled = true;
    const actionText = isEditing ? 'Updating' : 'Saving';
    saveBtn.innerHTML = `
      <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
      ${actionText} Member...
    `;
    saveBtn.classList.add('btn-saving');
  } else {
    saveBtn.disabled = false;
    saveBtn.innerHTML = saveButtonOriginalText || '<i class="fas fa-save"></i> Save Member';
    saveBtn.classList.remove('btn-saving');
  }
}

function setDeleteButtonLoading(isLoading) {
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  if (!confirmDeleteBtn) return;
  
  if (isLoading) {
    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.innerHTML = `
      <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
      Deleting...
    `;
  } else {
    confirmDeleteBtn.disabled = false;
    confirmDeleteBtn.innerHTML = 'Permanently Delete';
  }
}

const memberForm = document.getElementById("memberForm");
if (memberForm) {
  memberForm.addEventListener("submit", async function(e){
    e.preventDefault();
    
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn && saveBtn.disabled) {
      console.log('Save already in progress, ignoring click');
      return;
    }
    
    const id = document.getElementById("editMemberId").value;
    const isEditing = !!id;
    
    setSaveButtonLoading(true, isEditing);
    
    const memberData = {
      firstname: document.getElementById("firstname").value,
      middlename: document.getElementById("middlename").value,
      surname: document.getElementById("surname").value,
      pin: document.getElementById("pin").value,
      gender: document.getElementById("gender").value,
      contact: document.getElementById("contact").value,
      contact2: document.getElementById("contact2").value,
      branch: document.getElementById("branch").value,
      date_of_baptism: document.getElementById("date_of_baptism").value,
      residential_address: document.getElementById("residential_address").value,
      kganya_member: document.getElementById("kganya_member").value,
      kganya_book_number: document.getElementById("kganya_book_number").value,
      church_activity: document.getElementById("church_activity").value,
      nok_firstname: document.getElementById("nok_firstname").value,
      nok_surname: document.getElementById("nok_surname").value,
      nok_contact: document.getElementById("nok_contact").value,
      nok_relationship: document.getElementById("nok_relationship").value,
      in_executive_committee: document.getElementById("in_executive_committee").checked,
      executive_committee: document.getElementById("executive_committee").value,
      executive_committee_role: document.getElementById("executive_committee_role").value,
      employment_status: document.getElementById("employment_status").value,
      occupation: document.getElementById("occupation").value,
      education_level: document.getElementById("education_level").value,
      highest_certification: document.getElementById("highest_certification").value,
      qualification: document.getElementById("qualification").value,
      skills: document.getElementById("skills").value,
      formally_trained_on_skills: document.getElementById("formally_trained_on_skills").value
    };
    
    let result;
    try {
      if (id) {
        result = await api.updateMember(id, memberData);
      } else {
        result = await api.createMember(memberData);
      }
      
      if (result && result.success) {
        await loadInitialData();
        closeRegisterModal();
        showMessage(id ? "Member updated successfully!" : "Member registered successfully!", "success");
      } else {
        showMessage(result?.error || "Failed to save member. Please try again.", "error");
      }
    } catch (error) {
      console.error('Save error:', error);
      showMessage("An error occurred while saving. Please try again.", "error");
    } finally {
      setSaveButtonLoading(false);
    }
  });
}

function openDeleteModal(memberId) {
  const member = members.find(m => m.member_id === memberId);
  if (member) {
    memberToDelete = member;
    
    const deleteMemberInfo = document.getElementById('deleteMemberInfo');
    if (deleteMemberInfo) {
      deleteMemberInfo.innerHTML = `
        <div class="member-detail-row">
          <div class="member-detail-label">Full Name:</div>
          <div class="member-detail-value"><strong>${escapeHtml(member.firstname)} ${escapeHtml(member.surname)}</strong></div>
        </div>
        <div class="member-detail-row">
          <div class="member-detail-label">PIN/ID:</div>
          <div class="member-detail-value">${escapeHtml(member.pin)}</div>
        </div>
        <div class="member-detail-row">
          <div class="member-detail-label">Contact:</div>
          <div class="member-detail-value">${escapeHtml(member.contact || 'N/A')}</div>
        </div>
        <div class="member-detail-row">
          <div class="member-detail-label">Branch:</div>
          <div class="member-detail-value">${member.branch || 'N/A'}</div>
        </div>
      `;
    }
    
    const confirmationInput = document.getElementById('deleteConfirmationInput');
    if (confirmationInput) confirmationInput.value = '';
    
    const deleteModal = document.getElementById('deleteModal');
    if (deleteModal) deleteModal.style.display = 'flex';
  }
}

async function confirmDelete() {
  const confirmationText = document.getElementById('deleteConfirmationInput');
  if (!confirmationText || confirmationText.value !== 'CONFIRM DELETE') {
    showMessage('Please type "CONFIRM DELETE" to proceed with deletion', 'error');
    return;
  }
  
  if (memberToDelete) {
    setDeleteButtonLoading(true);
    
    const result = await api.deleteMember(memberToDelete.member_id);
    
    setDeleteButtonLoading(false);
    
    if (result && result.success) {
      showMessage(`${memberToDelete.firstname} ${memberToDelete.surname} has been permanently deleted.`, 'success');
      closeDeleteModal();
      await loadInitialData();
      memberToDelete = null;
    } else {
      showMessage(result?.error || "Failed to delete member. Please try again.", "error");
    }
  }
}

function closeDeleteModal() {
  const deleteModal = document.getElementById('deleteModal');
  if (deleteModal) deleteModal.style.display = 'none';
  memberToDelete = null;
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

function setupEventListeners() {
  const searchBtn = document.getElementById("searchBtn");
  const resetBtn = document.getElementById("resetBtn");
  const openRegisterBtn = document.getElementById("openRegisterModalBtn");
  const closeRegisterBtn = document.getElementById("closeRegisterModalBtn");
  const cancelFormBtn = document.getElementById("cancelFormBtn");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const closeDeleteBtn = document.getElementById("closeDeleteModalBtn");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
  const searchInput = document.getElementById("globalSearchInput");
  
  // Search button event
  if (searchBtn) {
    searchBtn.addEventListener("click", function(e) {
      e.preventDefault();
      console.log("🔍 Search button clicked");
      applySearchAndRender();
    });
  }
  
  // Reset button event
  if (resetBtn) {
    resetBtn.addEventListener("click", function(e) {
      e.preventDefault();
      console.log("🔄 Reset button clicked");
      resetSearch();
    });
  }
  
  // Enter key on search input
  if (searchInput) {
    searchInput.addEventListener("keypress", function(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        console.log("⏎ Enter key pressed in search");
        applySearchAndRender();
      }
    });
  }
  
  if (openRegisterBtn) openRegisterBtn.addEventListener("click", openRegisterModal);
  if (closeRegisterBtn) closeRegisterBtn.addEventListener("click", closeRegisterModal);
  if (cancelFormBtn) cancelFormBtn.addEventListener("click", closeRegisterModal);
  if (prevBtn) prevBtn.addEventListener("click", prevStep);
  if (nextBtn) nextBtn.addEventListener("click", nextStep);
  if (closeDeleteBtn) closeDeleteBtn.addEventListener("click", closeDeleteModal);
  if (cancelDeleteBtn) cancelDeleteBtn.addEventListener("click", closeDeleteModal);
  if (confirmDeleteBtn) confirmDeleteBtn.addEventListener("click", confirmDelete);
  
  window.onclick = function(event) {
    if (event.target.classList && event.target.classList.contains('custom-modal')) {
      closeRegisterModal();
      closeDeleteModal();
    }
  };
}

async function init() {
  console.log("🚀 Initializing Register Page...");
  await loadInitialData();
  updateCurrentYear();
  setupEventListeners();
  console.log("✅ Register Page Ready");
}

// Start the app
init();