// ========== GOOGLE SHEETS API CLIENT ==========
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbyw9KYnLjME_DAbeGfwlkw7erM7WwbzQt9F5tRPTkyctNWQEGdxvHx35cj_5xcebHFmgA/exec';


class ChurchAPI {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async request(action, method = 'POST', data = {}) {
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

    try {
        console.log(`📤 Calling ${action}...`);
        const response = await fetch(url, options);
        const result = await response.json();
        console.log(`📥 Response:`, result);
        return result;
    } catch (error) {
        console.error(`❌ API Error:`, error);
        return { success: false, error: error.message };
    }
  }

  // Add to your api-client.js inside the ChurchAPI class:

  // --- OUTCOMES METHODS ---
  async getOutcomes() {
    return this.request('getOutcomes', 'GET');
  }

  async createOutcome(outcomeData) {
    return this.request('createOutcome', 'POST', outcomeData);
  }

  // ========== MEMBERS METHODS ==========
  async getMembers() {
    return this.request('getMembers', 'GET');
  }

  async createMember(memberData) {
    return this.request('createMember', 'POST', memberData);
  }

  async updateMember(memberId, updateData) {
    return this.request('updateMember', 'POST', { member_id: memberId, ...updateData });
  }

  async deleteMember(memberId) {
    return this.request('deleteMember', 'POST', { member_id: memberId });
  }

  // ========== VISITS METHODS ==========
  async getVisits() {
    return this.request('getVisits', 'GET');
  }

  async createVisit(visitData) {
    return this.request('createVisit', 'POST', visitData);
  }
}




const api = new ChurchAPI(API_BASE_URL);