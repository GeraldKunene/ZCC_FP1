// ========== GOOGLE SHEETS API CLIENT ==========
console.log('Loading api-client.js...');

// Use existing global variables, don't redeclare
// API_BASE_URL and API_KEY should already be defined by config.js

// If they're not defined yet, wait for them
if (typeof API_BASE_URL === 'undefined' || typeof API_KEY === 'undefined') {
    console.warn('API_BASE_URL or API_KEY not defined, waiting...');
    // They will be defined by config.js which should load first
}

class ChurchAPI {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.authToken = localStorage.getItem('auth_token');
    this.currentUser = null;
  }

  async request(action, method = 'POST', data = {}, timeout = 15000) {
    // Use global API_KEY
    const securedData = { ...data, api_key: typeof API_KEY !== 'undefined' ? API_KEY : '', timestamp: Date.now() };
    
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
    let options = { method: method, mode: 'cors', redirect: 'follow' };

    if (method === 'GET') {
      const params = new URLSearchParams({ action, ...securedData });
      url += `?${params.toString()}`;
    } else {
      options.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
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
        
        if (method === 'GET' && result.success) {
          const cacheKey = `${action}_${JSON.stringify(securedData)}`;
          this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
        }
        return result;
      } catch (error) {
        clearTimeout(timeoutId);
        console.error(`Request error for ${action}:`, error);
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

  // Authentication methods
  async authenticate(username, password) {
    const result = await this.request('authenticate', 'POST', { username, password });
    if (result.success && result.data) {
      this.currentUser = result.data;
      this.authToken = btoa(`${username}:${Date.now()}`);
      localStorage.setItem('auth_token', this.authToken);
      localStorage.setItem('current_user', JSON.stringify(result.data));
    }
    return result;
  }

  isAuthenticated() {
    // Check if user is authenticated
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('current_user');
    
    if (token && user) {
      try {
        this.currentUser = JSON.parse(user);
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  async logout() {
    // Clear local storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    this.currentUser = null;
    this.authToken = null;
    this.clearCache();
    return { success: true };
  }

  getCurrentUser() {
    if (!this.currentUser) {
      const user = localStorage.getItem('current_user');
      if (user) {
        try {
          this.currentUser = JSON.parse(user);
        } catch (e) {
          return null;
        }
      }
    }
    return this.currentUser;
  }

  // Member methods
  async getMembers() {
    return this.request('getMembers', 'GET');
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

  // Event methods
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

  // Visit methods
  async getVisits() {
    return this.request('getVisits', 'GET');
  }

  async createVisit(visitData) {
    const result = await this.request('createVisit', 'POST', visitData);
    this.clearCache();
    return result;
  }

  // Outcome methods
  async getOutcomes() {
    return this.request('getOutcomes', 'GET');
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

  // Payment methods (New)
  async getPayments() {
    return this.request('getPayments', 'GET');
  }

  async getMemberPayments(memberId) {
    return this.request('getMemberPayments', 'GET', { member_id: memberId });
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
}

// Create global api instance (use var to avoid redeclaration)
if (typeof api === 'undefined') {
    var api = new ChurchAPI(API_BASE_URL);
    window.api = api;
    console.log('✅ ChurchAPI initialized, api object created');
}