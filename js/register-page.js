// ========== REGISTER PAGE - GOOGLE SHEETS BACKEND ==========
let members = [];
let filteredMembers = [];
let memberToDelete = null;
let currentStep = 1;
const totalSteps = 5;
let isLoading = false;

// Branch options based on Branch Level selection
const branchOptions = {
    main: [
        { value: "FP0", label: "FP0: MINISTER" },
        { value: "FP1", label: "FP1: LUHLOKOHLA" },
        { value: "FP10", label: "FP10: NTFONJENI" },
        { value: "FP2", label: "FP2: EZULWINI" },
        { value: "FP3", label: "FP3: PIGGS PEAK" },
        { value: "FP4", label: "FP4: NHLANGANO" },
        { value: "FP5", label: "FP5: MHLANGATANE" },
        { value: "FP6", label: "FP6: MBABANE" },
        { value: "FP7", label: "FP7: TSHANENI/SOHHOYE" },
        { value: "FP8", label: "FP8: SITEKI" },
        { value: "FP9", label: "FP9: LUBULINI" }
    ],
    sub: [
        { value: "FP1", label: "FP1: MALINDZA" },
        { value: "FP10", label: "FP10: NTFONJENI" },
        { value: "FP2", label: "FP2: MAPHALALENI" },
        { value: "FP4", label: "FP4: LULAKENI" },
        { value: "FP5", label: "FP5: MPOFU" },
        { value: "FP5_SIDZAKENI", label: "FP5: SIDZAKENI" },
        { value: "FP5_SITSATSAWENI", label: "FP5: SITSATSAWENI" },
        { value: "FP6", label: "FP6: JUBUKWENI" },
        { value: "FP7", label: "FP7: NKAMBENI" },
        { value: "FP7_SIDVOKODVO", label: "FP7: SIDVOKODVO" },
        { value: "FP7_TSAMBOKHULU", label: "FP7: TSAMBOKHULU" },
        { value: "FP8", label: "FP8: MPLONJENI" },
        { value: "FP9", label: "FP9: MATSANJENI" },
        { value: "FP9_THESALONIKA", label: "FP9: THESALONIKA" }
    ]
};

// ========== BRANCH LEVEL FUNCTIONS ==========
function populateBranchOptions(branchLevel) {
    const branchSelect = document.getElementById('branch');
    if (!branchSelect) return;
    
    branchSelect.innerHTML = '';
    
    if (!branchLevel || branchLevel === '') {
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = 'Select Branch Level First';
        branchSelect.appendChild(placeholderOption);
        branchSelect.disabled = true;
        return;
    }
    
    const options = branchOptions[branchLevel];
    
    if (options && options.length > 0) {
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = `Select ${branchLevel === 'main' ? 'Main' : 'Sub'} Branch`;
        branchSelect.appendChild(defaultOption);
        
        options.forEach(option => {
            const optElement = document.createElement('option');
            optElement.value = option.value;
            optElement.textContent = option.label;
            branchSelect.appendChild(optElement);
        });
        
        branchSelect.disabled = false;
    } else {
        const errorOption = document.createElement('option');
        errorOption.value = '';
        errorOption.textContent = 'No branches available';
        branchSelect.appendChild(errorOption);
        branchSelect.disabled = true;
    }
}

function onBranchLevelChange() {
    const branchLevelSelect = document.getElementById('branch_level');
    if (!branchLevelSelect) return;
    
    const selectedLevel = branchLevelSelect.value;
    populateBranchOptions(selectedLevel);
    
    const branchSelect = document.getElementById('branch');
    if (branchSelect) {
        branchSelect.value = '';
    }
}

function setupBranchLevelListener() {
    const branchLevelSelect = document.getElementById('branch_level');
    if (branchLevelSelect) {
        branchLevelSelect.removeEventListener('change', onBranchLevelChange);
        branchLevelSelect.addEventListener('change', onBranchLevelChange);
        console.log('Branch level listener setup complete');
    }
}

// ========== LOAD DATA FUNCTIONS ==========
async function loadInitialData() {
    showLoading(true);
    
    try {
        const result = await api.getMembers();
        
        if (result.success && result.data) {
            members = result.data;
            filteredMembers = [...members];
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
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4"><div class="spinner-border text-success" role="status"></div><p class="mt-2">Loading members...</p></td></tr>`;
    }
}

function renderMembersTable(dataArray) {
    const tbody = document.getElementById("membersTableBody");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    if (!dataArray || dataArray.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No members found. Click "Register Member" to add one.  </td></tr>';
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
        btn.removeEventListener("click", handleEditClick);
        btn.addEventListener("click", handleEditClick);
    });
    
    document.querySelectorAll(".delete-member-btn").forEach(btn => {
        btn.removeEventListener("click", handleDeleteClick);
        btn.addEventListener("click", handleDeleteClick);
    });
}

function handleEditClick(e) {
    const id = e.currentTarget.getAttribute("data-id");
    openEditModal(id);
}

function handleDeleteClick(e) {
    const id = e.currentTarget.getAttribute("data-id");
    openDeleteModal(id);
}

// ========== SEARCH FUNCTIONS ==========
function applySearchAndRender() {
    const searchInput = document.getElementById("globalSearchInput");
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === "") {
        filteredMembers = [...members];
        renderMembersTable(filteredMembers);
        showMessage(`Showing all ${filteredMembers.length} members`, "success");
    } else {
        filteredMembers = members.filter(m => {
            const firstName = (m.firstname || "").toString().toLowerCase();
            const surname = (m.surname || "").toString().toLowerCase();
            const pin = (m.pin || "").toString().toLowerCase();
            const contact = (m.contact || "").toString().toLowerCase();
            const fullName = (firstName + " " + surname).toLowerCase();
            
            return firstName.includes(searchTerm) || 
                   surname.includes(searchTerm) || 
                   fullName.includes(searchTerm) ||
                   pin.includes(searchTerm) || 
                   contact.includes(searchTerm);
        });
        
        renderMembersTable(filteredMembers);
        
        if (filteredMembers.length === 0) {
            showMessage(`No members found matching "${searchTerm}"`, "error");
        } else {
            showMessage(`Found ${filteredMembers.length} member(s) matching "${searchTerm}"`, "success");
        }
    }
}

function resetSearch() {
    const searchInput = document.getElementById("globalSearchInput");
    if (searchInput) {
        searchInput.value = "";
    }
    filteredMembers = [...members];
    renderMembersTable(filteredMembers);
    showMessage(`Search cleared. Showing all ${filteredMembers.length} members.`, "success");
}

// ========== STEP NAVIGATION ==========
function showStep(step) {
    console.log('Showing step:', step);
    
    // Hide all step sections
    document.querySelectorAll('.step-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show current step section
    const currentSection = document.querySelector(`.step-section[data-section="${step}"]`);
    if (currentSection) {
        currentSection.style.display = 'block';
        console.log('Displayed section for step:', step);
    } else {
        console.error('Section not found for step:', step);
    }
    
    // Update step indicators
    document.querySelectorAll('.step').forEach((stepEl, index) => {
        const stepNum = index + 1;
        stepEl.classList.remove('active', 'completed');
        
        if (stepNum < step) {
            stepEl.classList.add('completed');
        } else if (stepNum === step) {
            stepEl.classList.add('active');
        }
    });
    
    // Update navigation buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelFormBtn');
    
    if (step === 1) {
        if (prevBtn) prevBtn.style.display = 'none';
    } else {
        if (prevBtn) prevBtn.style.display = 'inline-flex';
    }
    
    if (step === totalSteps) {
        if (nextBtn) nextBtn.style.display = 'none';
        if (saveBtn) saveBtn.style.display = 'inline-flex';
        updateReviewContent();
    } else {
        if (nextBtn) nextBtn.style.display = 'inline-flex';
        if (saveBtn) saveBtn.style.display = 'none';
    }
    
    // Cancel button always visible
    if (cancelBtn) cancelBtn.style.display = 'inline-flex';
    
    currentStep = step;
}

function nextStep() {
    console.log('Next step clicked, current step:', currentStep);
    if (validateCurrentSection(currentStep)) {
        if (currentStep < totalSteps) {
            showStep(currentStep + 1);
        }
    }
}

function prevStep() {
    console.log('Prev step clicked, current step:', currentStep);
    if (currentStep > 1) {
        showStep(currentStep - 1);
    }
}

// ========== VALIDATION FUNCTIONS ==========
function validateContactNumber(contact, fieldName) {
    const phoneRegex = /^[0-9]{8,15}$/;
    if (!phoneRegex.test(contact)) {
        showMessage(`${fieldName} must contain only numbers and be 8-15 digits long`, 'error');
        return false;
    }
    return true;
}

function validatePIN(pin) {
    const pinRegex = /^[0-9]{6,20}$/;
    if (!pinRegex.test(pin)) {
        showMessage('PIN must contain only numbers and be 6-20 digits long', 'error');
        return false;
    }
    return true;
}

function validateCurrentSection(step) {
    console.log('Validating section:', step);
    
    if (step === 1) {
        const firstname = document.getElementById('firstname')?.value.trim();
        const surname = document.getElementById('surname')?.value.trim();
        const pin = document.getElementById('pin')?.value.trim();
        const contact = document.getElementById('contact')?.value.trim();
        const branchLevel = document.getElementById('branch_level')?.value;
        const branch = document.getElementById('branch')?.value;
        const joinMethod = document.getElementById('join_method')?.value;
        
        console.log('Validation values:', { firstname, surname, pin, contact, branchLevel, branch, joinMethod });
        
        if (!firstname) {
            alert('Please enter first name');
            showMessage('Please enter first name', 'error');
            return false;
        }
        if (!surname) {
            alert('Please enter surname');
            showMessage('Please enter surname', 'error');
            return false;
        }
        if (!pin) {
            alert('Please enter PIN/ID number');
            showMessage('Please enter PIN/ID number', 'error');
            return false;
        }
        if (!validatePIN(pin)) {
            return false;
        }
        if (!contact) {
            alert('Please enter contact number');
            showMessage('Please enter contact number', 'error');
            return false;
        }
        if (!validateContactNumber(contact, 'Contact number')) {
            return false;
        }
        if (!branchLevel) {
            alert('Please select Branch Level (Main or Sub)');
            showMessage('Please select Branch Level (Main or Sub)', 'error');
            return false;
        }
        if (!branch) {
            alert('Please select a Branch');
            showMessage('Please select a Branch', 'error');
            return false;
        }
        if (!joinMethod) {
            alert('Please select Join Method');
            showMessage('Please select Join Method', 'error');
            return false;
        }
        
        const contact2 = document.getElementById('contact2')?.value.trim();
        if (contact2 && !validateContactNumber(contact2, 'Secondary contact number')) {
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
        <div class="review-item"><strong>Date of Birth:</strong> ${getValue('date_of_birth', 'Not provided')}</div>
        <div class="review-item"><strong>Gender:</strong> ${getSelectText('gender')}</div>
        <div class="review-item"><strong>Contact 1:</strong> ${escapeHtml(getValue('contact'))}</div>
        <div class="review-item"><strong>Contact 2:</strong> ${escapeHtml(getValue('contact2', ''))}</div>
        <div class="review-item"><strong>Branch Level:</strong> ${getSelectText('branch_level')}</div>
        <div class="review-item"><strong>Branch:</strong> ${getSelectText('branch')}</div>
        <div class="review-item"><strong>Join Method:</strong> ${getSelectText('join_method')}</div>
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
        ${document.getElementById('in_executive_committee')?.checked ? `
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
    
    if (!modal) {
        alert('Modal element not found');
        return;
    }
    
    if (title) title.innerHTML = '<i class="fas fa-user-plus"></i> Register New Member';
    if (form) form.reset();
    if (editId) editId.value = "";
    
    const branchLevelSelect = document.getElementById('branch_level');
    if (branchLevelSelect) branchLevelSelect.value = "";
    populateBranchOptions("");
    
    const dateOfBirth = document.getElementById('date_of_birth');
    if (dateOfBirth) dateOfBirth.value = "";
    
    const joinMethod = document.getElementById('join_method');
    if (joinMethod) joinMethod.value = "";
    
    const committeeGroup = document.getElementById('executive_committee_group');
    const roleGroup = document.getElementById('executive_committee_role_group');
    if (committeeGroup) committeeGroup.style.display = 'none';
    if (roleGroup) roleGroup.style.display = 'none';
    
    const inCommitteeCheckbox = document.getElementById('in_executive_committee');
    if (inCommitteeCheckbox) inCommitteeCheckbox.checked = false;
    
    currentStep = 1;
    showStep(1);
    
    modal.style.display = "flex";
    console.log('Modal opened');
}

function closeRegisterModal() { 
    const modal = document.getElementById("registerModal");
    if (modal) modal.style.display = "none"; 
}
// Add this function at the top of your register.js file or before openEditModal
function formatDateForInput(dateString) {
    if (!dateString) return "";
    
    console.log("Original date value:", dateString, "Type:", typeof dateString);
    
    try {
        // If it's already in YYYY-MM-DD format
        if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateString)) {
            return dateString.split('T')[0];
        }
        
        // If it's a timestamp (number)
        if (typeof dateString === 'number') {
            let date = new Date(dateString);
            if (!isNaN(date.getTime())) {
                let year = date.getFullYear();
                let month = String(date.getMonth() + 1).padStart(2, '0');
                let day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
        }
        
        // If it's a string, try parsing different formats
        if (typeof dateString === 'string') {
            // Try DD/MM/YYYY format (common in some databases)
            let parts = dateString.split(/[/.-]/);
            if (parts.length === 3) {
                // Check if it's DD/MM/YYYY (day first)
                if (parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
                    // Try to detect if it's DD/MM/YYYY
                    let day = parseInt(parts[0]);
                    let month = parseInt(parts[1]);
                    let year = parseInt(parts[2]);
                    if (day <= 31 && month <= 12) {
                        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    }
                }
                // Check if it's MM/DD/YYYY (month first)
                if (parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
                    let month = parseInt(parts[0]);
                    let day = parseInt(parts[1]);
                    let year = parseInt(parts[2]);
                    if (month <= 12 && day <= 31) {
                        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    }
                }
            }
            
            // Try parsing with Date constructor
            let parsedDate = new Date(dateString);
            if (!isNaN(parsedDate.getTime())) {
                let year = parsedDate.getFullYear();
                let month = String(parsedDate.getMonth() + 1).padStart(2, '0');
                let day = String(parsedDate.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
        }
        
        // If it's a Date object
        if (dateString instanceof Date) {
            let year = dateString.getFullYear();
            let month = String(dateString.getMonth() + 1).padStart(2, '0');
            let day = String(dateString.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        
        console.warn("Could not format date:", dateString);
        return "";
    } catch (error) {
        console.error("Error formatting date:", error);
        return "";
    }
}

function openEditModal(memberId) {
    // Make sure members array exists and is populated
    if (!members || members.length === 0) {
        showMessage('Member data not loaded. Please refresh the page.', 'error');
        return;
    }
    
    const member = members.find(m => m.member_id === memberId);
    if (!member) {
        showMessage('Member not found', 'error');
        return;
    }
    
    console.log("Opening edit for member:", member);
    
    // Basic Information
    document.getElementById("editMemberId").value = member.member_id || "";
    document.getElementById("firstname").value = member.firstname || "";
    document.getElementById("middlename").value = member.middlename || "";
    document.getElementById("surname").value = member.surname || "";
    document.getElementById("pin").value = member.pin || "";
    document.getElementById("gender").value = member.gender || "Male";
    document.getElementById("contact").value = member.contact || "";
    document.getElementById("contact2").value = member.contact2 || "";
    
    // DATE OF BIRTH - Fixed with proper formatting
    const dobField = document.getElementById("date_of_birth");
    if (dobField) {
        let formattedDOB = formatDateForInput(member.date_of_birth);
        dobField.value = formattedDOB;
        console.log("DOB set to:", formattedDOB, "Original:", member.date_of_birth);
    }
    
    document.getElementById("join_method").value = member.join_method || "";
    
    // Branch handling
    const branchValue = member.branch || "";
    let detectedLevel = "";
    
    const mainBranchValues = branchOptions.main.map(b => b.value);
    const subBranchValues = branchOptions.sub.map(b => b.value);
    
    if (mainBranchValues.includes(branchValue)) {
        detectedLevel = "main";
    } else if (subBranchValues.includes(branchValue)) {
        detectedLevel = "sub";
    }
    
    const branchLevelSelect = document.getElementById('branch_level');
    if (detectedLevel) {
        branchLevelSelect.value = detectedLevel;
        populateBranchOptions(detectedLevel);
        
        setTimeout(() => {
            const branchSelect = document.getElementById("branch");
            if (branchSelect) {
                branchSelect.value = branchValue;
            }
        }, 100);
    } else {
        branchLevelSelect.value = "";
        populateBranchOptions("");
    }
    
    // Date of Baptism - Also format this
    const baptismField = document.getElementById("date_of_baptism");
    if (baptismField) {
        baptismField.value = formatDateForInput(member.date_of_baptism);
    }
    
    document.getElementById("residential_address").value = member.residential_address || "";
    document.getElementById("kganya_member").value = member.kganya_member || "Yes";
    document.getElementById("kganya_book_number").value = member.kganya_book_number || "";
    document.getElementById("church_activity").value = member.church_activity || "";
    
    // Next of Kin
    document.getElementById("nok_firstname").value = member.nok_firstname || "";
    document.getElementById("nok_surname").value = member.nok_surname || "";
    document.getElementById("nok_contact").value = member.nok_contact || "";
    document.getElementById("nok_relationship").value = member.nok_relationship || "";
    
    // Executive Committee
    const inCommittee = member.in_executive_committee === true || member.in_executive_committee === 1 || member.in_executive_committee === "yes";
    document.getElementById("in_executive_committee").checked = inCommittee;
    
    if (inCommittee) {
        const committeeGroup = document.getElementById('executive_committee_group');
        const roleGroup = document.getElementById('executive_committee_role_group');
        if (committeeGroup) committeeGroup.style.display = 'block';
        if (roleGroup) roleGroup.style.display = 'block';
    } else {
        const committeeGroup = document.getElementById('executive_committee_group');
        const roleGroup = document.getElementById('executive_committee_role_group');
        if (committeeGroup) committeeGroup.style.display = 'none';
        if (roleGroup) roleGroup.style.display = 'none';
    }
    
    document.getElementById("executive_committee").value = member.executive_committee || "";
    document.getElementById("executive_committee_role").value = member.executive_committee_role || "";
    
    // Skills & Qualifications
    document.getElementById("employment_status").value = member.employment_status || "";
    document.getElementById("occupation").value = member.occupation || "";
    document.getElementById("education_level").value = member.education_level || "";
    document.getElementById("highest_certification").value = member.highest_certification || "";
    document.getElementById("qualification").value = member.qualification || "";
    document.getElementById("skills").value = member.skills || "";
    document.getElementById("formally_trained_on_skills").value = member.formally_trained_on_skills || "";
    
    // Show modal
    document.getElementById("registerModalTitle").innerHTML = '<i class="fas fa-edit"></i> Edit Member';
    currentStep = 1;
    showStep(1);
    document.getElementById("registerModal").style.display = "flex";
}

// ========== COMMITTEE FUNCTIONS ==========
function setupCommitteeListener() {
    const committeeCheckbox = document.getElementById('in_executive_committee');
    if (committeeCheckbox) {
        committeeCheckbox.removeEventListener('change', handleCommitteeChange);
        committeeCheckbox.addEventListener('change', handleCommitteeChange);
    }
}

function handleCommitteeChange() {
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
}

// ========== SAVE FUNCTIONS ==========
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
        saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${actionText} Member...`;
    } else {
        saveBtn.disabled = false;
        saveBtn.innerHTML = saveButtonOriginalText || '<i class="fas fa-save"></i> Save Member';
    }
}

function setDeleteButtonLoading(isLoading) {
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (!confirmDeleteBtn) return;
    
    if (isLoading) {
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Deleting...';
    } else {
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.innerHTML = 'Permanently Delete';
    }
}

// ========== FORM SUBMIT ==========
const memberForm = document.getElementById("memberForm");
if (memberForm) {
    memberForm.addEventListener("submit", async function(e){
        e.preventDefault();
        
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn && saveBtn.disabled) {
            return;
        }
        
        const nokContact = document.getElementById("nok_contact")?.value.trim();
        if (nokContact && !validateContactNumber(nokContact, 'Next of kin contact number')) {
            return;
        }
        
        const id = document.getElementById("editMemberId").value;
        const isEditing = !!id;
        
        setSaveButtonLoading(true, isEditing);
        
        const memberData = {
            firstname: document.getElementById("firstname")?.value.trim() || "",
            middlename: document.getElementById("middlename")?.value.trim() || "",
            surname: document.getElementById("surname")?.value.trim() || "",
            pin: document.getElementById("pin")?.value.trim() || "",
            date_of_birth: document.getElementById("date_of_birth")?.value || "",
            gender: document.getElementById("gender")?.value || "",
            contact: document.getElementById("contact")?.value.trim() || "",
            contact2: document.getElementById("contact2")?.value.trim() || "",
            branch_level: document.getElementById("branch_level")?.value || "",
            branch: document.getElementById("branch")?.value || "",
            join_method: document.getElementById("join_method")?.value || "",
            date_of_baptism: document.getElementById("date_of_baptism")?.value || "",
            residential_address: document.getElementById("residential_address")?.value || "",
            kganya_member: document.getElementById("kganya_member")?.value || "Yes",
            kganya_book_number: document.getElementById("kganya_book_number")?.value || "",
            church_activity: document.getElementById("church_activity")?.value || "",
            nok_firstname: document.getElementById("nok_firstname")?.value.trim() || "",
            nok_surname: document.getElementById("nok_surname")?.value.trim() || "",
            nok_contact: nokContact || "",
            nok_relationship: document.getElementById("nok_relationship")?.value || "",
            in_executive_committee: document.getElementById("in_executive_committee")?.checked || false,
            executive_committee: document.getElementById("executive_committee")?.value || "",
            executive_committee_role: document.getElementById("executive_committee_role")?.value || "",
            employment_status: document.getElementById("employment_status")?.value || "",
            occupation: document.getElementById("occupation")?.value || "",
            education_level: document.getElementById("education_level")?.value || "",
            highest_certification: document.getElementById("highest_certification")?.value || "",
            qualification: document.getElementById("qualification")?.value || "",
            skills: document.getElementById("skills")?.value || "",
            formally_trained_on_skills: document.getElementById("formally_trained_on_skills")?.value || ""
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

// ========== DELETE FUNCTIONS ==========
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

// ========== UTILITY FUNCTIONS ==========
function showMessage(msg, type) {
    console.log('Show message called:', msg, type);
    
    // Try to get the container
    const container = document.getElementById("errorMessageContainer");
    const span = document.getElementById("errorText");
    
    if (!container || !span) {
        // Fallback to alert if container doesn't exist
        alert(msg);
        return;
    }
    
    span.innerText = msg;
    container.style.display = "block";
    
    if(type === "success") {
        container.style.background = "#d1e7dd";
        container.style.color = "#0f5132";
        container.style.borderLeftColor = "#198754";
        container.style.borderLeft = "4px solid #198754";
    } else {
        container.style.background = "#f8d7da";
        container.style.color = "#a71d2a";
        container.style.borderLeftColor = "#dc3545";
        container.style.borderLeft = "4px solid #dc3545";
    }
    
    setTimeout(() => { 
        container.style.display = "none"; 
    }, 5000);
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

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
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
    
    // Log button existence
    console.log('Buttons found:', {
        searchBtn: !!searchBtn,
        resetBtn: !!resetBtn,
        openRegisterBtn: !!openRegisterBtn,
        closeRegisterBtn: !!closeRegisterBtn,
        cancelFormBtn: !!cancelFormBtn,
        prevBtn: !!prevBtn,
        nextBtn: !!nextBtn
    });
    
    if (searchBtn) {
        searchBtn.addEventListener("click", function(e) {
            e.preventDefault();
            applySearchAndRender();
        });
    }
    
    if (resetBtn) {
        resetBtn.addEventListener("click", function(e) {
            e.preventDefault();
            resetSearch();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                e.preventDefault();
                applySearchAndRender();
            }
        });
    }
    
    if (openRegisterBtn) {
        openRegisterBtn.addEventListener("click", openRegisterModal);
        console.log('Register button listener added');
    }
    
    if (closeRegisterBtn) closeRegisterBtn.addEventListener("click", closeRegisterModal);
    
    if (cancelFormBtn) {
        cancelFormBtn.addEventListener("click", closeRegisterModal);
        console.log('Cancel button listener added');
    }
    
    if (prevBtn) {
        prevBtn.addEventListener("click", prevStep);
        console.log('Prev button listener added');
    }
    
    if (nextBtn) {
        nextBtn.addEventListener("click", nextStep);
        console.log('Next button listener added');
    }
    
    if (closeDeleteBtn) closeDeleteBtn.addEventListener("click", closeDeleteModal);
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener("click", closeDeleteModal);
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener("click", confirmDelete);
    
    setupBranchLevelListener();
    setupCommitteeListener();
    
    // Close modals on outside click
    window.onclick = function(event) {
        const modals = document.querySelectorAll('.custom-modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    };
    
    console.log('Event listeners setup complete');
}

// ========== INITIALIZATION ==========
async function init() {
    console.log("Initializing Register Page...");
    await loadInitialData();
    updateCurrentYear();
    setupEventListeners();
    populateBranchOptions("");
    
    // Verify button connections
    console.log('Final button check:');
    console.log('- Next button exists:', document.getElementById('nextBtn') !== null);
    console.log('- Prev button exists:', document.getElementById('prevBtn') !== null);
    console.log('- Save button exists:', document.getElementById('saveBtn') !== null);
    console.log('- Cancel button exists:', document.getElementById('cancelFormBtn') !== null);
    
    console.log("Register Page Ready");
}

// Start the app
init();