// ========== PAYMENTS PAGE - MAIN APPLICATION ==========
// Manages member payments for trips, services, and other church activities

// Global variables
let members = [];
let payments = [];
let currentSelectedMember = null;
let currentPayment = null;
let autoRefreshInterval = null;

// Service/Trip types and their default amounts
const SERVICE_TYPES = {
    'funeral': { name: 'Funeral', defaultAmount: 100 },
    'lekgotla': { name: 'Lekgotla', defaultAmount: 100 },
    'easters': { name: 'Easters', defaultAmount: 650 },
    'new_year': { name: 'New Year (Sept)', defaultAmount: 650 },
    'christmas': { name: 'Christmas', defaultAmount: 650 },
    'feela': { name: 'Feela (Umshanyelo)', defaultAmount: 650 }
};

// Payment types
const PAYMENT_TYPES = {
    'deposit': 'Deposit',
    'final': 'Final Payment',
    'full': 'Full Payment'
};

// ========== LOAD DATA FUNCTIONS ==========
async function loadData() {
    console.log('Loading data for payments...');
    showMessage('Loading data from server...', 'warning');
    
    try {
        // Check if API is available
        if (typeof api === 'undefined' || !api) {
            console.error('API not available');
            showMessage('API not available. Please check your connection.', 'error');
            return;
        }
        
        const membersResult = await api.getMembers();
        
        if (membersResult.success && membersResult.data) {
            members = membersResult.data;
            console.log('Members loaded:', members.length);
        } else {
            console.warn('Failed to load members:', membersResult.error);
            members = [];
        }
        
        await loadPaymentsFromServer();
        
        if (members.length > 0) {
            showMessage(`Loaded ${members.length} members and ${payments.length} total payments`, 'success');
        } else {
            showMessage('No members found. Please add members first.', 'warning');
        }
        
        updatePaymentSummary();
        
    } catch (error) {
        console.error('Error loading data:', error);
        showMessage('Error loading data. Please refresh the page.', 'error');
    }
}

async function loadPaymentsFromServer() {
    try {
        // Check if getPayments method exists
        if (typeof api.getPayments === 'undefined') {
            console.warn('api.getPayments not available, using localStorage fallback');
            const storedPayments = localStorage.getItem('zcc_payments');
            payments = storedPayments ? JSON.parse(storedPayments) : [];
            return true;
        }
        
        const paymentsResult = await api.getPayments();
        
        if (paymentsResult.success && paymentsResult.data) {
            payments = paymentsResult.data;
            console.log(`Payments loaded: ${payments.length} total`);
            // Store in localStorage as backup
            localStorage.setItem('zcc_payments', JSON.stringify(payments));
            return true;
        } else {
            console.warn('Failed to load payments:', paymentsResult.error);
            // Try localStorage fallback
            const storedPayments = localStorage.getItem('zcc_payments');
            payments = storedPayments ? JSON.parse(storedPayments) : [];
            return false;
        }
    } catch (error) {
        console.error('Error loading payments:', error);
        // Try localStorage fallback
        const storedPayments = localStorage.getItem('zcc_payments');
        payments = storedPayments ? JSON.parse(storedPayments) : [];
        return false;
    }
}

// ========== HELPER FUNCTIONS ==========
function getMemberPayments(memberId) {
    return payments.filter(p => String(p.member_id) === String(memberId));
}

function getMemberTotalPaid(memberId, serviceType = null) {
    let memberPayments = payments.filter(p => String(p.member_id) === String(memberId));
    
    if (serviceType) {
        memberPayments = memberPayments.filter(p => p.service_type === serviceType);
    }
    
    return memberPayments.reduce((total, payment) => total + (parseFloat(payment.payment_amount || payment.amount) || 0), 0);
}

function getMemberPaymentStatus(memberId, serviceType, totalAmount) {
    const totalPaid = getMemberTotalPaid(memberId, serviceType);
    
    if (totalPaid >= totalAmount) {
        return { status: 'paid', text: 'Paid in Full', class: 'status-paid' };
    } else if (totalPaid > 0) {
        return { status: 'partial', text: `Partial (${formatCurrency(totalPaid)} paid)`, class: 'status-partial' };
    } else {
        return { status: 'pending', text: 'Pending', class: 'status-pending' };
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
            return `
                <div class="member-card" data-member-id="${member.member_id}">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${escapeHtml(member.firstname)} ${escapeHtml(member.surname)}</strong>
                            <br>
                            <small class="text-muted">
                                <i class="fas fa-id-card"></i> ${member.pin || 'N/A'} | 
                                <i class="fas fa-phone"></i> ${member.contact || 'N/A'}
                            </small>
                        </div>
                        <div>
                            <button class="btn-view-payment view-payments-btn" data-member-id="${member.member_id}">
                                <i class="fas fa-history"></i> View Payments
                            </button>
                            <button class="btn-payment make-payment-btn" data-member-id="${member.member_id}">
                                <i class="fas fa-money-bill-wave"></i> Make Payment
                            </button>
                        </div>
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

// ========== PAYMENT MODAL FUNCTIONS ==========
function openPaymentModal(memberId) {
    console.log('openPaymentModal called with memberId:', memberId);
    const member = members.find(m => String(m.member_id) === String(memberId));
    
    if (!member) {
        console.error('Member not found with ID:', memberId);
        showMessage('Member not found', 'error');
        return;
    }
    
    console.log('Opening payment modal for:', member.firstname, member.surname);
    currentSelectedMember = member;
    document.getElementById('paymentMemberId').value = memberId;
    document.getElementById('modalMemberName').innerHTML = `<i class="fas fa-user"></i> Payment for: ${member.firstname} ${member.surname}`;
    
    // Reset form
    document.getElementById('serviceType').value = 'easters';
    document.getElementById('customAmount').style.display = 'none';
    document.getElementById('paymentAmount').value = '';
    document.getElementById('paymentAmount').readOnly = false;
    document.getElementById('paymentType').value = 'full';
    document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('paymentNotes').value = '';
    
    updateTotalAmount();
    
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.style.display = 'flex';
        console.log('Modal displayed');
    } else {
        console.error('Payment modal element not found');
    }
}

function updateTotalAmount() {
    const serviceType = document.getElementById('serviceType').value;
    const totalAmountSpan = document.getElementById('totalAmount');
    
    if (serviceType === 'other') {
        document.getElementById('customAmount').style.display = 'block';
        totalAmountSpan.textContent = 'Enter amount below';
    } else {
        document.getElementById('customAmount').style.display = 'none';
        const amount = SERVICE_TYPES[serviceType]?.defaultAmount || 500;
        totalAmountSpan.textContent = formatCurrency(amount);
        const paymentAmountInput = document.getElementById('paymentAmount');
        if (paymentAmountInput) {
            paymentAmountInput.placeholder = `Enter amount (max ${formatCurrency(amount)})`;
        }
    }
}

function setCustomAmount() {
    const customAmountInput = document.getElementById('customAmountInput');
    const totalAmountSpan = document.getElementById('totalAmount');
    const amount = parseFloat(customAmountInput.value);
    
    if (amount && amount > 0) {
        totalAmountSpan.textContent = formatCurrency(amount);
        const paymentAmountInput = document.getElementById('paymentAmount');
        if (paymentAmountInput) {
            paymentAmountInput.placeholder = `Enter amount (max ${formatCurrency(amount)})`;
        }
    } else {
        totalAmountSpan.textContent = 'Enter valid amount';
    }
}

function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) modal.style.display = 'none';
    currentSelectedMember = null;
}

async function savePayment() {
    const memberId = document.getElementById('paymentMemberId').value;
    const serviceType = document.getElementById('serviceType').value;
    const paymentType = document.getElementById('paymentType').value;
    let totalAmount = SERVICE_TYPES[serviceType]?.defaultAmount || 500;
    
    if (serviceType === 'other') {
        const customAmount = parseFloat(document.getElementById('customAmountInput').value);
        if (!customAmount || customAmount <= 0) {
            showMessage('Please enter a valid total amount', 'error');
            return;
        }
        totalAmount = customAmount;
    }
    
    const paymentAmount = parseFloat(document.getElementById('paymentAmount').value);
    if (!paymentAmount || paymentAmount <= 0) {
        showMessage('Please enter a valid payment amount', 'error');
        return;
    }
    
    if (paymentAmount > totalAmount) {
        showMessage(`Payment amount cannot exceed total amount of ${formatCurrency(totalAmount)}`, 'error');
        return;
    }
    
    const paymentDate = document.getElementById('paymentDate').value;
    if (!paymentDate) {
        showMessage('Please select a payment date', 'error');
        return;
    }
    
    const notes = document.getElementById('paymentNotes').value;
    
    const totalPaidSoFar = getMemberTotalPaid(memberId, serviceType);
    const newTotalPaid = totalPaidSoFar + paymentAmount;
    
    if (newTotalPaid > totalAmount) {
        showMessage(`This payment would exceed the total amount. Remaining: ${formatCurrency(totalAmount - totalPaidSoFar)}`, 'error');
        return;
    }
    
    const paymentData = {
        member_id: parseInt(memberId),
        member_name: `${currentSelectedMember.firstname} ${currentSelectedMember.surname}`,
        service_type: serviceType,
        service_name: SERVICE_TYPES[serviceType]?.name || serviceType,
        total_amount: totalAmount,
        payment_amount: paymentAmount,
        payment_type: paymentType,
        payment_date: paymentDate,
        notes: notes,
        status: newTotalPaid >= totalAmount ? 'completed' : 'partial'
    };
    
    console.log('Saving payment data:', paymentData);
    showMessage('Saving payment...', 'warning');
    
    try {
        // Check if createPayment method exists
        let result;
        if (typeof api.createPayment !== 'undefined') {
            result = await api.createPayment(paymentData);
        } else {
            // Fallback: store in localStorage
            console.log('api.createPayment not available, using localStorage fallback');
            const existingPayments = localStorage.getItem('zcc_payments');
            let paymentsList = existingPayments ? JSON.parse(existingPayments) : [];
            const newPayment = {
                ...paymentData,
                payment_id: Date.now(),
                created_at: new Date().toISOString()
            };
            paymentsList.push(newPayment);
            localStorage.setItem('zcc_payments', JSON.stringify(paymentsList));
            result = { success: true, data: newPayment };
        }
        
        console.log('API result:', result);
        
        if (result && result.success) {
            showMessage(`Payment of ${formatCurrency(paymentAmount)} recorded successfully!`, 'success');
            closePaymentModal();
            
            // Add to local payments array
            const newPayment = {
                payment_id: result.data?.payment_id || 'local_' + Date.now(),
                ...paymentData,
                created_at: new Date().toISOString()
            };
            payments.push(newPayment);
            
            // Update localStorage
            localStorage.setItem('zcc_payments', JSON.stringify(payments));
            
            updatePaymentSummary();
            
            // If search results are open, refresh them
            const searchResults = document.getElementById('searchResults');
            if (searchResults && searchResults.style.display === 'block') {
                const searchInput = document.getElementById('searchInput');
                if (searchInput && searchInput.value.trim()) {
                    searchMembers();
                }
            }
        } else {
            const errorMsg = result?.error || 'Could not save payment. Please check your connection.';
            showMessage('Error: ' + errorMsg, 'error');
            console.error('Save payment failed:', result);
        }
    } catch (error) {
        console.error('Exception in savePayment:', error);
        showMessage('Error: Network issue. Please check your connection and try again.', 'error');
    }
}

// ========== VIEW MEMBER PAYMENTS ==========
function viewMemberPayments(memberId) {
    console.log('viewMemberPayments called with memberId:', memberId);
    const member = members.find(m => String(m.member_id) === String(memberId));
    if (!member) {
        console.error('Member not found for view:', memberId);
        return;
    }
    
    currentSelectedMember = member;
    const memberPayments = getMemberPayments(memberId);
    console.log('Found payments:', memberPayments.length);
    
    // Group payments by service type
    const paymentsByService = {};
    memberPayments.forEach(payment => {
        const key = payment.service_type;
        if (!paymentsByService[key]) {
            paymentsByService[key] = {
                service_name: payment.service_name,
                total_amount: payment.total_amount,
                payments: []
            };
        }
        paymentsByService[key].payments.push(payment);
    });
    
    let html = `
        <div class="mb-3">
            <h6><i class="fas fa-user"></i> Member: ${escapeHtml(member.firstname)} ${escapeHtml(member.surname)}</h6>
            <p class="text-muted"><i class="fas fa-id-card"></i> PIN: ${member.pin || 'N/A'} | <i class="fas fa-phone"></i> ${member.contact || 'N/A'}</p>
        </div>
    `;
    
    if (memberPayments.length === 0) {
        html += `
            <div class="empty-state">
                <i class="fas fa-receipt" style="font-size: 3rem;"></i>
                <p>No payment records found for this member.</p>
            </div>
        `;
    } else {
        for (const [serviceType, data] of Object.entries(paymentsByService)) {
            const totalPaid = data.payments.reduce((sum, p) => sum + (p.payment_amount || p.amount || 0), 0);
            const remaining = data.total_amount - totalPaid;
            const statusClass = totalPaid >= data.total_amount ? 'status-paid' : 'status-partial';
            
            html += `
                <div class="payment-card" style="margin-bottom: 1rem;">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <strong><i class="fas fa-bus"></i> ${escapeHtml(data.service_name)}</strong>
                        <span class="${statusClass}" style="padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.7rem; font-weight: 600;">${totalPaid >= data.total_amount ? 'PAID' : 'PARTIAL'}</span>
                    </div>
                    <div class="mb-2">
                        <small>Total Amount: <strong>${formatCurrency(data.total_amount)}</strong></small><br>
                        <small>Total Paid: <strong>${formatCurrency(totalPaid)}</strong></small><br>
                        <small>Remaining: <strong class="${remaining > 0 ? 'text-danger' : 'text-success'}">${formatCurrency(remaining)}</strong></small>
                    </div>
                    <hr class="my-2">
                    <div class="payment-history">
                        <small class="text-muted"><i class="fas fa-history"></i> Payment History:</small>
                        ${data.payments.map(p => `
                            <div class="d-flex justify-content-between align-items-center mt-1" style="font-size: 0.8rem;">
                                <span>
                                    <span class="payment-type ${p.payment_type === 'deposit' ? 'type-deposit' : (p.payment_type === 'final' ? 'type-final' : 'type-full')}">
                                        ${PAYMENT_TYPES[p.payment_type]}
                                    </span>
                                    ${formatCurrency(p.payment_amount || p.amount || 0)}
                                </span>
                                <span class="text-muted">${formatDate(p.payment_date)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }
    
    const memberPaymentsList = document.getElementById('memberPaymentsList');
    const viewModal = document.getElementById('viewPaymentsModal');
    
    if (memberPaymentsList) memberPaymentsList.innerHTML = html;
    if (viewModal) viewModal.style.display = 'flex';
}

function closeViewPaymentsModal() {
    const modal = document.getElementById('viewPaymentsModal');
    if (modal) modal.style.display = 'none';
    currentSelectedMember = null;
}

// ========== UI UPDATE FUNCTIONS ==========
function updatePaymentSummary() {
    // Calculate summary statistics
    const totalPayments = payments.reduce((sum, p) => sum + (p.payment_amount || p.amount || 0), 0);
    const totalMembersWithPayments = new Set(payments.map(p => p.member_id)).size;
    
    // Payments by service type
    const eastersPayments = payments.filter(p => p.service_type === 'easters')
        .reduce((sum, p) => sum + (p.payment_amount || p.amount || 0), 0);
    const newYearPayments = payments.filter(p => p.service_type === 'new_year')
        .reduce((sum, p) => sum + (p.payment_amount || p.amount || 0), 0);
    const otherPayments = payments.filter(p => !['easters', 'new_year', 'christmas', 'lekgotla', 'funeral', 'feela'].includes(p.service_type))
        .reduce((sum, p) => sum + (p.payment_amount || p.amount || 0), 0);
    
    const totalElement = document.getElementById('totalPayments');
    const membersElement = document.getElementById('membersWithPayments');
    const kganyaElement = document.getElementById('kganyaTotal');
    const conferenceElement = document.getElementById('conferenceTotal');
    const otherElement = document.getElementById('otherTotal');
    
    if (totalElement) totalElement.textContent = formatCurrency(totalPayments);
    if (membersElement) membersElement.textContent = totalMembersWithPayments;
    if (kganyaElement) kganyaElement.textContent = formatCurrency(eastersPayments);
    if (conferenceElement) conferenceElement.textContent = formatCurrency(newYearPayments);
    if (otherElement) otherElement.textContent = formatCurrency(otherPayments);
    
    // Display recent payments
    displayRecentPayments();
}

function displayRecentPayments() {
    const paymentsListDiv = document.getElementById('paymentsList');
    if (!paymentsListDiv) return;
    
    const recentPayments = [...payments]
        .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
        .slice(0, 10);
    
    if (recentPayments.length === 0) {
        paymentsListDiv.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt" style="font-size: 3rem;"></i>
                <p>No payments recorded yet</p>
            </div>
        `;
    } else {
        paymentsListDiv.innerHTML = recentPayments.map(payment => {
            const member = members.find(m => String(m.member_id) === String(payment.member_id));
            const memberName = member ? `${member.firstname} ${member.surname}` : payment.member_name;
            const paymentTypeClass = payment.payment_type === 'deposit' ? 'type-deposit' : 
                                     (payment.payment_type === 'final' ? 'type-final' : 'type-full');
            
            return `
                <div class="payment-card">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${escapeHtml(memberName)}</strong>
                            <br>
                            <small class="text-muted">
                                <i class="fas fa-tag"></i> ${escapeHtml(payment.service_name)}
                            </small>
                        </div>
                        <div class="text-end">
                            <div class="payment-amount">${formatCurrency(payment.payment_amount || payment.amount || 0)}</div>
                            <small class="text-muted">
                                <span class="payment-type ${paymentTypeClass}">${PAYMENT_TYPES[payment.payment_type]}</span>
                                <br>
                                <i class="fas fa-calendar"></i> ${formatDate(payment.payment_date)}
                            </small>
                        </div>
                    </div>
                    ${payment.notes ? `<small class="text-muted mt-1 d-block"><i class="fas fa-sticky-note"></i> ${escapeHtml(payment.notes)}</small>` : ''}
                </div>
            `;
        }).join('');
    }
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
        await loadData();
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
    // Make Payment buttons
    const makePaymentBtns = document.querySelectorAll('.make-payment-btn');
    console.log('Attaching event listeners to', makePaymentBtns.length, 'Make Payment buttons');
    
    makePaymentBtns.forEach(btn => {
        btn.removeEventListener('click', handleMakePaymentClick);
        btn.addEventListener('click', handleMakePaymentClick);
        // Also add inline onclick as backup
        const memberId = btn.getAttribute('data-member-id');
        btn.setAttribute('onclick', `openPaymentModal(${memberId})`);
    });
    
    // View Payments buttons
    const viewPaymentsBtns = document.querySelectorAll('.view-payments-btn');
    console.log('Attaching event listeners to', viewPaymentsBtns.length, 'View Payments buttons');
    
    viewPaymentsBtns.forEach(btn => {
        btn.removeEventListener('click', handleViewPaymentsClick);
        btn.addEventListener('click', handleViewPaymentsClick);
        // Also add inline onclick as backup
        const memberId = btn.getAttribute('data-member-id');
        btn.setAttribute('onclick', `viewMemberPayments(${memberId})`);
    });
}

function handleMakePaymentClick(e) {
    e.stopPropagation();
    const memberId = e.currentTarget.getAttribute('data-member-id');
    console.log('Make Payment clicked for member ID:', memberId);
    if (memberId) {
        openPaymentModal(memberId);
    } else {
        console.error('No member ID found on button');
    }
}

function handleViewPaymentsClick(e) {
    e.stopPropagation();
    const memberId = e.currentTarget.getAttribute('data-member-id');
    console.log('View Payments clicked for member ID:', memberId);
    if (memberId) {
        viewMemberPayments(memberId);
    } else {
        console.error('No member ID found on button');
    }
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
    
    // Payment modal events
    const serviceType = document.getElementById('serviceType');
    if (serviceType) serviceType.addEventListener('change', updateTotalAmount);
    
    const customAmountInput = document.getElementById('customAmountInput');
    if (customAmountInput) customAmountInput.addEventListener('input', setCustomAmount);
    
    const closePaymentModalBtn = document.getElementById('closePaymentModalBtn');
    if (closePaymentModalBtn) closePaymentModalBtn.addEventListener('click', closePaymentModal);
    
    const cancelPaymentBtn = document.getElementById('cancelPaymentBtn');
    if (cancelPaymentBtn) cancelPaymentBtn.addEventListener('click', closePaymentModal);
    
    const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');
    if (confirmPaymentBtn) confirmPaymentBtn.addEventListener('click', savePayment);
    
    // View payments modal events
    const closeViewModalBtn = document.getElementById('closeViewModalBtn');
    if (closeViewModalBtn) closeViewModalBtn.addEventListener('click', closeViewPaymentsModal);
    
    const closeViewModalFooterBtn = document.getElementById('closeViewModalFooterBtn');
    if (closeViewModalFooterBtn) closeViewModalFooterBtn.addEventListener('click', closeViewPaymentsModal);
    
    window.addEventListener('click', closeModalOnOutsideClick);
    document.addEventListener('keydown', closeAllModalsOnEscape);
    
    console.log('Event listeners setup complete');
}

// ========== MODAL CLOSING FUNCTIONS ==========
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

// Make functions globally available
window.openPaymentModal = openPaymentModal;
window.viewMemberPayments = viewMemberPayments;
window.closePaymentModal = closePaymentModal;
window.closeViewPaymentsModal = closeViewPaymentsModal;
window.savePayment = savePayment;
window.searchMembers = searchMembers;
window.clearSearch = clearSearch;
window.refreshAllData = refreshAllData;
window.hideMessage = hideMessage;

// ========== INITIALIZATION ==========
function updateCurrentYear() {
    const yearElement = document.getElementById('currentYear');
    if (yearElement) yearElement.textContent = new Date().getFullYear();
}

// MutationObserver for dynamically added buttons
function setupMutationObserver() {
    const membersList = document.getElementById('membersList');
    if (!membersList) return;
    
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                attachDynamicEventListeners();
            }
        });
    });
    
    observer.observe(membersList, { childList: true, subtree: true });
}

async function init() {
    console.log('Initializing Payments Page...');
    console.log('API available:', typeof api !== 'undefined');
    console.log('API methods:', api ? Object.keys(api) : 'none');
    
    await loadData();
    updateCurrentYear();
    setupEventListeners();
    setupMutationObserver();
    console.log('Initialization complete');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}