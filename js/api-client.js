// ========== GOOGLE SHEETS API CLIENT ==========
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbxQ61QPDm2VQyVZTz93J3GXUrHMzsV1upHehCkSdvL3TpcsCD3h1pRX-mmlc1QELLiYSQ/exec';

class ChurchAPI {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cache = new Map();
    this.pendingRequests = new Map();
  }

  // Add timeout to requests
  async request(action, method = 'POST', data = {}, timeout = 15000) {
    // Check cache for GET requests (cache for 30 seconds)
    if (method === 'GET') {
      const cacheKey = `${action}_${JSON.stringify(data)}`;
      const cached = this.cache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < 30000) {
        console.log(`📦 Using cached data for ${action}`);
        return cached.data;
      }
    }

    // Prevent duplicate simultaneous requests
    const requestKey = `${action}_${method}_${JSON.stringify(data)}`;
    if (this.pendingRequests.has(requestKey)) {
      console.log(`⏳ Waiting for pending request: ${action}`);
      return this.pendingRequests.get(requestKey);
    }

    let url = this.baseUrl;
    
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

    // Add abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    options.signal = controller.signal;

    // Create promise for this request
    const requestPromise = (async () => {
      try {
        console.log(`📤 Calling ${action}...`);
        const startTime = Date.now();
        const response = await fetch(url, options);
        clearTimeout(timeoutId);
        const result = await response.json();
        console.log(`📥 Response for ${action} took ${Date.now() - startTime}ms`, result);
        
        // Cache GET requests
        if (method === 'GET') {
          const cacheKey = `${action}_${JSON.stringify(data)}`;
          this.cache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
          });
        }
        
        return result;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          console.error(`❌ API Timeout for ${action}`);
          return { success: false, error: 'Request timeout. Please check your connection.' };
        }
        console.error(`❌ API Error for ${action}:`, error);
        return { success: false, error: error.message };
      } finally {
        // Remove from pending requests
        this.pendingRequests.delete(requestKey);
      }
    })();

    this.pendingRequests.set(requestKey, requestPromise);
    return requestPromise;
  }

  // Clear cache (useful after mutations)
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Cache cleared');
  }

  // Preload data in background
  async preload() {
    console.log('🔄 Preloading data...');
    const promises = [];
    
    // Only preload if cache is empty
    if (!this.cache.has('getMembers_{}')) {
      promises.push(this.getMembers());
    }
    if (!this.cache.has('getVisits_{}')) {
      promises.push(this.getVisits());
    }
    if (!this.cache.has('getOutcomes_{}')) {
      promises.push(this.getOutcomes());
    }
    
    if (promises.length > 0) {
      await Promise.allSettled(promises);
      console.log('✅ Preloading complete');
    }
  }

  // ========== AUTHENTICATION METHODS ==========
  async authenticate(username, password) {
    return this.request('authenticate', 'POST', { username, password });
  }

  async createUser(username, password, role) {
    return this.request('createUser', 'POST', { username, password, role });
  }

  // ========== OUTCOMES METHODS ==========
  async getOutcomes() {
    return this.request('getOutcomes', 'GET');
  }

  async createOutcome(outcomeData) {
    const result = await this.request('createOutcome', 'POST', outcomeData);
    this.clearCache(); // Clear cache after mutation
    return result;
  }

  async deleteOutcome(outcomeId) {
    const result = await this.request('deleteOutcome', 'POST', { outcome_id: outcomeId });
    this.clearCache(); // Clear cache after mutation
    return result;
  }

  // ========== MEMBERS METHODS ==========
  async getMembers() {
    return this.request('getMembers', 'GET');
  }

  async createMember(memberData) {
    const result = await this.request('createMember', 'POST', memberData);
    this.clearCache(); // Clear cache after mutation
    return result;
  }

  async updateMember(memberId, updateData) {
    const result = await this.request('updateMember', 'POST', { member_id: memberId, ...updateData });
    this.clearCache(); // Clear cache after mutation
    return result;
  }

  async deleteMember(memberId) {
    const result = await this.request('deleteMember', 'POST', { member_id: memberId });
    this.clearCache(); // Clear cache after mutation
    return result;
  }

  // ========== VISITS METHODS ==========
  async getVisits() {
    return this.request('getVisits', 'GET');
  }

  async createVisit(visitData) {
    const result = await this.request('createVisit', 'POST', visitData);
    this.clearCache(); // Clear cache after mutation
    return result;
  }
}

const api = new ChurchAPI(API_BASE_URL);

// Auto-preload data when page is idle
if (typeof window !== 'undefined') {
  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => api.preload());
  } else {
    setTimeout(() => api.preload(), 100);
  }
}