// ========== GOOGLE SHEETS API CLIENT - SECURE VERSION ==========
console.log('Loading secure api-client.js...');

class ChurchAPI {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cache = new Map();
    this.pendingRequests = new Map();
  }

  /**
   * Make an authenticated request to the API
   * Uses Bearer token in Authorization header (secure)
   */
  async request(action, method = 'POST', data = {}, timeout = 15000) {
    // Get session token from localStorage
    const sessionToken = localStorage.getItem('zcc_session_token');
    
    const securedData = { 
      ...data, 
      timestamp: Date.now() 
    };
    
    if (method === 'GET') {
      const cacheKey = `${action}_${JSON.stringify(securedData)}`;
      const cached = this.cache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < 30000) {
        return cached.data;
      }
    }

    const requestKey = `${action}_${method}_${JSON.stringify(securedData)}`;
    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey);
    }

    let url = this.baseUrl;
    let options = { 
      method: method, 
      mode: 'cors', 
      redirect: 'follow',
      headers: {}
    };

    // IMPORTANT: Use Authorization header instead of URL parameter
    if (sessionToken) {
      options.headers['Authorization'] = `Bearer ${sessionToken}`;
    }

    if (method === 'GET') {
      const params = new URLSearchParams({ action, ...securedData });
      url += `?${params.toString()}`;
    } else {
      options.headers['Content-Type'] = 'text/plain;charset=utf-8';
      options.body = JSON.stringify({ action, ...securedData });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    options.signal = controller.signal;

    const requestPromise = (async () => {
      try {
        const response = await fetch(url, options);
        clearTimeout(timeoutId);
        const result = await response.json();
        
        // If session expired, redirect to login
        if (!result.success && (result.error === 'Session expired' || result.error?.includes('Session'))) {
          await this.logout();
          window.location.href = '../index.html';
          return result;
        }
        
        if (method === 'GET' && result.success) {
          const cacheKey = `${action}_${JSON.stringify(securedData)}`;
          this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
        }
        return result;
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('API Request Error:', error);
        return { success: false, error: error.message };
      } finally {
        this.pendingRequests.delete(requestKey);
      }
    })();

    this.pendingRequests.set(requestKey, requestPromise);
    return requestPromise;
  }

  clearCache() {
    this.cache.clear();
  }

  // Auth methods
  async authenticate(username, password) {
    const result = await this.request('authenticate', 'POST', { username, password });
    if (result.success && result.data?.session_token) {
      localStorage.setItem('zcc_session_token', result.data.session_token);
      localStorage.setItem('zcc_auth', 'true');
      localStorage.setItem('zcc_user', result.data.username);
      localStorage.setItem('zcc_role', result.data.role || 'user');
      localStorage.setItem('zcc_login_time', new Date().toISOString());
    }
    return result;
  }
  
  async logout() {
    const sessionToken = localStorage.getItem('zcc_session_token');
    const result = await this.request('logout', 'POST', {});
    
    // Clear ALL localStorage items
    localStorage.removeItem('zcc_session_token');
    localStorage.removeItem('zcc_csrf_token');
    localStorage.removeItem('zcc_auth');
    localStorage.removeItem('zcc_user');
    localStorage.removeItem('zcc_role');
    localStorage.removeItem('zcc_login_time');
    
    // Clear cache
    this.clearCache();
    
    return result;
  }

  async changePassword(currentPassword, newPassword) {
    const result = await this.request('changePassword', 'POST', { 
      currentPassword, 
      newPassword 
    });
    return result;
  }

  // All other methods remain the same...
  async getEvents() {
    return this.request('getEvents', 'GET');
  }

  async createEvent(eventData) {
    const result = await this.request('createEvent', 'POST', eventData);
    this.clearCache();
    return result;
  }

  async updateEvent(eventId, eventData) {
    const result = await this.request('updateEvent', 'POST', { event_id: eventId, ...eventData });
    this.clearCache();
    return result;
  }

  async deleteEvent(eventId) {
    const result = await this.request('deleteEvent', 'POST', { event_id: eventId });
    this.clearCache();
    return result;
  }

  async getEventAttendances(eventId) {
    return this.request('getEventAttendances', 'GET', { event_id: eventId });
  }

  async createAttendance(attendanceData) {
    const result = await this.request('createAttendance', 'POST', attendanceData);
    this.clearCache();
    return result;
  }

  async deleteAttendance(attendanceId) {
    const result = await this.request('deleteAttendance', 'POST', { attendance_id: attendanceId });
    this.clearCache();
    return result;
  }

  async getMembers() {
    return this.request('getMembers', 'GET');
  }

  async getVisits() {
    return this.request('getVisits', 'GET');
  }

  async getOutcomes() {
    return this.request('getOutcomes', 'GET');
  }

  async getPayments() {
    return this.request('getPayments', 'GET');
  }

  async createPayment(paymentData) {
    const result = await this.request('createPayment', 'POST', paymentData);
    this.clearCache();
    return result;
  }

  async updatePayment(paymentId, paymentData) {
    const result = await this.request('updatePayment', 'POST', { payment_id: paymentId, ...paymentData });
    this.clearCache();
    return result;
  }

  async deletePayment(paymentId) {
    const result = await this.request('deletePayment', 'POST', { payment_id: paymentId });
    this.clearCache();
    return result;
  }

  async getMemberPayments(memberId) {
    return this.request('getMemberPayments', 'GET', { member_id: memberId });
  }

  async createOutcome(outcomeData) {
    const result = await this.request('createOutcome', 'POST', outcomeData);
    this.clearCache();
    return result;
  }

  async deleteOutcome(outcomeId) {
    const result = await this.request('deleteOutcome', 'POST', { outcome_id: outcomeId });
    this.clearCache();
    return result;
  }

  async createMember(memberData) {
    const result = await this.request('createMember', 'POST', memberData);
    this.clearCache();
    return result;
  }

  async updateMember(memberId, updateData) {
    const result = await this.request('updateMember', 'POST', { member_id: memberId, ...updateData });
    this.clearCache();
    return result;
  }

  async deleteMember(memberId) {
    const result = await this.request('deleteMember', 'POST', { member_id: memberId });
    this.clearCache();
    return result;
  }

  async createVisit(visitData) {
    const result = await this.request('createVisit', 'POST', visitData);
    this.clearCache();
    return result;
  }
}

// Create global api instance
if (typeof api === 'undefined') {
    var api = new ChurchAPI(API_BASE_URL);
    window.api = api;
    console.log('✅ Secure ChurchAPI initialized');
}

// Session health check (optional)
setInterval(async () => {
  const sessionToken = localStorage.getItem('zcc_session_token');
  if (sessionToken) {
    // Simple ping to check if session is still valid
    try {
      const result = await api.getVisits(); // light request
      if (!result.success && result.error?.includes('Session')) {
        console.log('Session expired, redirecting to login');
        localStorage.clear();
        window.location.href = '../index.html';
      }
    } catch (e) {
      console.log('Session check failed');
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes