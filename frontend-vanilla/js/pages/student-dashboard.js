// Student Dashboard Page
class StudentDashboardPage extends Page {
  formatMoney(amount) {
    return new Intl.NumberFormat('en-IN').format(Number(amount || 0));
  }

  formatDate(value) {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toISOString().split('T')[0];
  }

  formatDateTime(value) {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  async render(container) {
    const user = Auth.getUser();
    const studentId = Auth.getStudentId();
    const firstName = user?.full_name?.split(' ')[0] || 'Student';
    let allocationsHtml = '<p>Loading...</p>';
    let guestRequestsHtml = '<p>Loading...</p>';
    let feesHtml = '<p>Loading...</p>';
    let heroHtml = '';
    let overviewHtml = '';

    try {
      const [allocations, guestRequests, fees] = await Promise.all([
        API.getAllocations(studentId),
        API.getGuestRequests({ host_student_id: studentId }),
        API.getFees(studentId)
      ]);

      const activeAllocations = allocations.filter(allocation => allocation.active);
      const pendingGuestRequests = guestRequests.filter(request => request.status === 'pending');
      const approvedGuestRequests = guestRequests.filter(request => ['approved', 'checked_in'].includes(request.status));
      const unpaidFees = fees.filter(fee => !fee.paid);
      const outstandingAmount = unpaidFees.reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
      const latestAllocation = activeAllocations[0] || allocations[0];

      heroHtml = `
        <section class="page-hero">
          <div class="page-hero-copy">
            <span class="hero-kicker">Resident Overview</span>
            <h1 class="page-hero-title">Welcome back, ${firstName}</h1>
            <p class="page-hero-subtitle">Your stay details, guest approvals, hostel dues, and support requests now sit in one cleaner dashboard.</p>
            <div class="hero-pill-row">
              <span class="hero-pill">${latestAllocation ? `Room ${latestAllocation.room_id}` : 'Allocation pending'}</span>
              <span class="hero-pill">${pendingGuestRequests.length} guest request${pendingGuestRequests.length === 1 ? '' : 's'} pending</span>
              <span class="hero-pill">${unpaidFees.length} fee item${unpaidFees.length === 1 ? '' : 's'} unpaid</span>
            </div>
          </div>
          <div class="page-hero-panel">
            <div class="metric-card">
              <span class="metric-label">Outstanding Balance</span>
              <span class="metric-value">Rs. ${this.formatMoney(outstandingAmount)}</span>
              <span class="metric-note">${unpaidFees.length ? 'Clear pending dues to keep your account current.' : 'You are fully settled right now.'}</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">Guest Approvals</span>
              <span class="metric-value">${approvedGuestRequests.length}</span>
              <span class="metric-note">${approvedGuestRequests.length ? 'Approved or active guest visits are visible below.' : 'No approved guest stays at the moment.'}</span>
            </div>
          </div>
        </section>
      `;

      overviewHtml = `
        <section class="overview-grid">
          <article class="stat-card">
            <span class="stat-label">Active Room</span>
            <h3>${activeAllocations.length}</h3>
            <p>${latestAllocation ? `Current allocation in room ${latestAllocation.room_id}.` : 'No active room allocation found.'}</p>
          </article>
          <article class="stat-card">
            <span class="stat-label">Guest Requests</span>
            <h3>${guestRequests.length}</h3>
            <p>${pendingGuestRequests.length} awaiting approval and ${approvedGuestRequests.length} already cleared.</p>
          </article>
          <article class="stat-card">
            <span class="stat-label">Fee Items</span>
            <h3>${fees.length}</h3>
            <p>${unpaidFees.length ? `${unpaidFees.length} still need payment.` : 'All current fee records are paid.'}</p>
          </article>
          <article class="stat-card">
            <span class="stat-label">Support Status</span>
            <h3>${unpaidFees.length ? 'Action' : 'Clear'}</h3>
            <p>${unpaidFees.length ? 'A quick finance follow-up will keep your profile fully up to date.' : 'No urgent account actions are visible on your dashboard.'}</p>
          </article>
        </section>
      `;

      allocationsHtml = allocations.length ? `
        <table class="data-table">
          <thead>
            <tr>
              <th>Room ID</th>
              <th>Check-in Date</th>
              <th>Check-out Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${allocations.map(a => `
              <tr>
                <td>${a.room_id}</td>
                <td>${this.formatDate(a.check_in_date)}</td>
                <td>${a.check_out_date ? this.formatDate(a.check_out_date) : 'Active'}</td>
                <td><span class="badge badge-${a.active ? 'success' : 'secondary'}">${a.active ? 'Active' : 'Inactive'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<p>No allocations found.</p>';

      guestRequestsHtml = guestRequests.length ? `
        <table class="data-table">
          <thead>
            <tr>
              <th>Guest Name</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${guestRequests.map(g => `
              <tr>
                <td>${g.guest_name}</td>
                <td>${this.formatDateTime(g.check_in)}</td>
                <td>${this.formatDateTime(g.check_out)}</td>
                <td><span class="badge badge-${g.status === 'approved' ? 'success' : g.status === 'pending' ? 'warning' : 'danger'}">${g.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<p>No guest requests.</p>';

      feesHtml = fees.length ? `
        <table class="data-table">
          <thead>
            <tr>
              <th>Fee Type</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${fees.map(f => `
              <tr>
                <td>${f.fee_type}</td>
                <td>₹${f.amount}</td>
                <td>${f.due_date || '-'}</td>
                <td><span class="badge badge-${f.paid ? 'success' : 'danger'}">${f.paid ? 'Paid' : 'Unpaid'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<p>No fees.</p>';
    } catch (error) {
      console.error('Error loading dashboard:', error);
      allocationsHtml = `<p class="error">Error loading allocations</p>`;
      guestRequestsHtml = `<p class="error">Error loading guest requests</p>`;
      feesHtml = `<p class="error">Error loading fees</p>`;
      heroHtml = `
        <section class="page-hero">
          <div class="page-hero-copy">
            <span class="hero-kicker">Resident Overview</span>
            <h1 class="page-hero-title">Dashboard temporarily unavailable</h1>
            <p class="page-hero-subtitle">The portal is running, but your student dashboard data could not be loaded right now. You can still try the other pages from the sidebar.</p>
          </div>
          <div class="page-hero-panel">
            <div class="metric-card">
              <span class="metric-label">Status</span>
              <span class="metric-value">Retry</span>
              <span class="metric-note">Refresh the page in a moment to pull the latest student records.</span>
            </div>
          </div>
        </section>
      `;
    }

    const html = `
      <div class="dashboard">
        ${heroHtml}
        ${overviewHtml}
        <div class="dashboard-cards">
          <div class="card">
            <h3>Allocation Snapshot</h3>
            ${allocationsHtml}
          </div>
          
          <div class="card">
            <h3>Guest Request Timeline</h3>
            ${guestRequestsHtml}
          </div>
          
          <div class="card">
            <h3>Fee Status</h3>
            ${feesHtml}
          </div>
        </div>
      </div>
    `;

    Layout.render(container, html);
  }
}

Router.registerPage('student-dashboard', StudentDashboardPage);
