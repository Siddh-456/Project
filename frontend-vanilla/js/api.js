// API Client
class API {
  static buildQuery(params = {}) {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });

    const queryString = query.toString();
    return queryString ? `?${queryString}` : '';
  }

  static async request(method, endpoint, data = null, isFormData = false) {
    const token = localStorage.getItem(CONFIG.TOKEN_KEY);
    const headers = {
      'Authorization': token ? `Bearer ${token}` : ''
    };

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const options = {
      method,
      headers: Object.fromEntries(Object.entries(headers).filter(([_, v]) => v))
    };

    if (data && !isFormData) {
      options.body = JSON.stringify(data);
    } else if (data && isFormData) {
      options.body = data;
    }

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}`);
      }

      return result.data || result;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  static login(email, password) {
    return this.request('POST', '/auth/login', { email, password });
  }

  static getMe() {
    return this.request('GET', '/auth/me');
  }

  // Allocations
  static getAllocations(studentId) {
    return this.request('GET', `/allocations${this.buildQuery({ student_id: studentId })}`);
  }

  // Guest requests
  static getGuestRequests(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request('GET', `/guest-requests${query ? '?' + query : ''}`);
  }

  static createGuestRequest(formData) {
    return this.request('POST', '/guest-requests', formData, true);
  }

  static approveGuestRequest(id, data) {
    return this.request('POST', `/guest-requests/${id}/approve`, data);
  }

  static rejectGuestRequest(id, reason) {
    return this.request('POST', `/guest-requests/${id}/reject`, { reason });
  }

  static checkInGuest(id) {
    return this.request('POST', `/guest-requests/${id}/checkin`, {});
  }

  static checkOutGuest(id) {
    return this.request('POST', `/guest-requests/${id}/checkout`, {});
  }

  // Visitor log
  static createVisitorLog(data) {
    return this.request('POST', '/visitor-log', data);
  }

  // Fees
  static getFees(studentId) {
    return this.request('GET', `/fees${this.buildQuery({ student_id: studentId })}`);
  }

  static markFeePaid(feeId) {
    return this.request('POST', `/fees/${feeId}/mark-paid`, {});
  }

  // Payments
  static createPayment(data) {
    return this.request('POST', '/payments', data);
  }

  static getPayments(studentId) {
    return this.request('GET', `/payments${this.buildQuery({ student_id: studentId })}`);
  }

  // Complaints
  static createComplaint(data) {
    return this.request('POST', '/complaints', data);
  }

  static getComplaints() {
    return this.request('GET', '/complaints');
  }

  static updateComplaintStatus(id, status) {
    return this.request('POST', `/complaints/${id}/update-status`, { status });
  }

  // Transfer requests
  static createTransferRequest(data) {
    return this.request('POST', '/transfer-requests', data);
  }

  static getTransferRequests() {
    return this.request('GET', '/transfer-requests');
  }

  static approveTransfer(id) {
    return this.request('POST', `/transfer-requests/${id}/approve`, {});
  }

  static rejectTransfer(id) {
    return this.request('POST', `/transfer-requests/${id}/reject`, {});
  }

  // Rooms
  static getRooms() {
    return this.request('GET', '/rooms');
  }

  static createRoom(data) {
    return this.request('POST', '/rooms', data);
  }

  static updateRoom(id, data) {
    return this.request('PUT', `/rooms/${id}`, data);
  }

  // Blocks
  static getBlocks() {
    return this.request('GET', '/blocks');
  }

  static createBlock(data) {
    return this.request('POST', '/blocks', data);
  }

  // Inventory
  static getInventory(roomId = null) {
    return this.request('GET', `/inventory${this.buildQuery({ room_id: roomId })}`);
  }

  static createInventory(data) {
    return this.request('POST', '/inventory', data);
  }

  static deleteInventory(id) {
    return this.request('DELETE', `/inventory/${id}`);
  }

  // Audit & PII
  static getAuditLog() {
    return this.request('GET', '/audit-log');
  }

  static getPIIDeletionLog() {
    return this.request('GET', '/pii-deletion-log');
  }

  static triggerPIIDeletion(data) {
    return this.request('POST', '/pii-deletion-log/cleanup', data);
  }

  // File upload
  static uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request('POST', '/uploads', formData, true);
  }

  // Waitlist
  static getWaitlist() {
    return this.request('GET', '/waitlist');
  }

  static createWaitlistEntry(data) {
    return this.request('POST', '/waitlist', data);
  }
}
