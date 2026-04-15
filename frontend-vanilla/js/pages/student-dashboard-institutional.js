// Student Dashboard Page Override
class InstitutionalStudentDashboardPage extends Page {
  formatDate(value) {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatShortDate(value) {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short'
    });
  }

  formatMoney(amount) {
    return new Intl.NumberFormat('en-IN').format(Number(amount || 0));
  }

  formatComplaintCategory(category) {
    return String(category || 'support issue')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  formatStatusLabel(status) {
    return String(status || 'pending')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  getIconSvg(iconName) {
    const icons = {
      room: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 11.5L12 5l8 6.5"></path>
          <path d="M6 10.5V19h12v-8.5"></path>
          <path d="M9 19v-5h6v5"></path>
        </svg>
      `,
      fees: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8"></circle>
          <path d="M12 8v8"></path>
          <path d="M9.5 10c0-1 1-2 2.5-2s2.5.8 2.5 2-1 1.7-2.5 2-2.5 1-2.5 2 1 2 2.5 2 2.5-1 2.5-2"></path>
        </svg>
      `,
      requests: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14.5 6.5l3 3"></path>
          <path d="M5 19l4.5-1 9-9a2.1 2.1 0 0 0-3-3l-9 9L5 19Z"></path>
        </svg>
      `,
      status: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 12h4l2-5 4 10 2-5h4"></path>
        </svg>
      `
    };

    return icons[iconName] || icons.room;
  }

  async render(container) {
    const user = Auth.getUser();
    const studentId = Auth.getStudentId();
    const firstName = user?.full_name?.split(' ')[0] || 'Student';
    let html;

    try {
      const [allocations, guestRequests, fees, complaints] = await Promise.all([
        API.getAllocations(studentId),
        API.getGuestRequests({ host_student_id: studentId }),
        API.getFees(studentId),
        API.getComplaints()
      ]);

      const activeAllocation = allocations.find(allocation => allocation.active) || null;
      const latestAllocation = activeAllocation || allocations[0] || null;
      const pendingGuestRequests = guestRequests.filter(request => request.status === 'pending');
      const unpaidFees = fees.filter(fee => !fee.paid);
      const openComplaints = complaints.filter(complaint => ['open', 'in_progress'].includes(complaint.status));
      const outstandingAmount = unpaidFees.reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
      const nextFee = unpaidFees
        .slice()
        .sort((a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0))[0] || null;
      const latestComplaint = openComplaints[0] || complaints[0] || null;
      const primaryRequestCount = pendingGuestRequests.length + openComplaints.length;
      const stayStatus = activeAllocation ? 'Occupied' : 'Pending';

      const attentionItems = [];

      if (nextFee) {
        attentionItems.push({
          iconClass: 'coral',
          iconText: '!',
          title: 'Pay hostel fee',
          note: `Rs. ${this.formatMoney(nextFee.amount)} is due on ${this.formatDate(nextFee.due_date)}.`,
          status: 'Due',
          statusClass: 'danger',
          page: 'pay-fees'
        });
      }

      if (latestComplaint && ['open', 'in_progress'].includes(latestComplaint.status)) {
        attentionItems.push({
          iconClass: 'blue',
          iconText: 'i',
          title: `Track ${this.formatComplaintCategory(latestComplaint.category)}`,
          note: `Latest status: ${this.formatStatusLabel(latestComplaint.status)}.`,
          status: this.formatStatusLabel(latestComplaint.status),
          statusClass: 'info',
          page: 'raise-complaint'
        });
      } else if (pendingGuestRequests.length) {
        attentionItems.push({
          iconClass: 'mint',
          iconText: 'G',
          title: 'Guest request pending',
          note: `${pendingGuestRequests[0].guest_name || 'Latest guest request'} is waiting for approval.`,
          status: 'Pending',
          statusClass: 'warning',
          page: 'guest-request'
        });
      }

      const attentionHtml = attentionItems.length
        ? attentionItems.slice(0, 2).map(item => `
            <a href="#" data-page="${item.page}" class="student-action-item">
              <span class="student-action-icon ${item.iconClass}">${item.iconText}</span>
              <span class="student-action-meta">
                <strong>${item.title}</strong>
                <span>${item.note}</span>
              </span>
              <span class="student-action-status student-action-status-${item.statusClass}">${item.status}</span>
            </a>
          `).join('')
        : `
            <div class="student-action-item student-action-item-static">
              <span class="student-action-icon mint">OK</span>
              <span class="student-action-meta">
                <strong>No urgent tasks</strong>
                <span>Your room, dues, and active requests are all under control right now.</span>
              </span>
              <span class="student-action-status student-action-status-clear">Clear</span>
            </div>
          `;

      const nextDueText = nextFee
        ? `Rs. ${this.formatMoney(nextFee.amount)} due ${this.formatDate(nextFee.due_date)}`
        : 'No pending dues';

      const roomValue = latestAllocation ? `Room ${latestAllocation.room_id}` : 'Pending';
      const requestsCopy = openComplaints.length
        ? `${openComplaints.length} support issue${openComplaints.length === 1 ? '' : 's'} open`
        : pendingGuestRequests.length
          ? `${pendingGuestRequests.length} guest request${pendingGuestRequests.length === 1 ? '' : 's'} pending`
          : 'No active requests';

      html = `
        <div class="student-dashboard-shell">
          <section class="student-dashboard-hero student-dashboard-hero-minimal">
            <article class="student-hero-card student-hero-card-minimal">
              <div class="student-hero-main">
                <p class="student-hero-kicker">Resident overview</p>
                <h1><span>Good morning,</span> ${firstName}</h1>
                <p>Your room, dues, and active requests in one clean workspace.</p>
              </div>
              <div class="student-hero-tags">
                <span class="student-hero-tag">${roomValue}</span>
                <span class="student-hero-tag">${primaryRequestCount} active request${primaryRequestCount === 1 ? '' : 's'}</span>
                <span class="student-hero-tag">${nextDueText}</span>
              </div>
              <div class="student-hero-summary">
                <span class="student-hero-summary-label">Next due</span>
                <strong>${nextFee ? this.formatShortDate(nextFee.due_date) : 'Clear'}</strong>
                <span>${nextFee ? `Rs. ${this.formatMoney(nextFee.amount)} hostel fee` : 'No action needed right now'}</span>
              </div>
            </article>
          </section>

          <section class="student-cards-row student-cards-row-minimal" aria-label="Main hostel overview">
            <article class="student-overview-card student-overview-card-minimal">
              <div class="student-card-head">
                <span class="student-card-icon student-card-icon-room">
                  ${this.getIconSvg('room')}
                </span>
              </div>
              <h2>Room</h2>
              <p class="student-card-value">${roomValue}</p>
              <p class="subtle">${activeAllocation ? 'Current allocation is active.' : 'Waiting for room allocation update.'}</p>
              <a href="#" data-page="my-allocations" class="student-card-button">Open Room</a>
            </article>

            <article class="student-overview-card student-overview-card-minimal">
              <div class="student-card-head">
                <span class="student-card-icon student-card-icon-fees">
                  ${this.getIconSvg('fees')}
                </span>
              </div>
              <h2>Fees</h2>
              <p class="student-card-value">${nextFee ? `Rs. ${this.formatMoney(nextFee.amount)}` : 'Clear'}</p>
              <p class="subtle">${nextFee ? `Due on ${this.formatDate(nextFee.due_date)}` : 'No pending hostel fee right now.'}</p>
              <a href="#" data-page="pay-fees" class="student-card-button">${nextFee ? 'Pay Now' : 'Review Fees'}</a>
            </article>

            <article class="student-overview-card student-overview-card-minimal">
              <div class="student-card-head">
                <span class="student-card-icon student-card-icon-requests">
                  ${this.getIconSvg('requests')}
                </span>
              </div>
              <h2>Requests</h2>
              <p class="student-card-value">${primaryRequestCount}</p>
              <p class="subtle">${requestsCopy}</p>
              <a href="#" data-page="${openComplaints.length ? 'raise-complaint' : 'guest-request'}" class="student-card-button">Track Status</a>
            </article>
          </section>

          <section class="student-dashboard-bottom student-dashboard-bottom-minimal">
            <article class="student-panel">
              <h2>Need attention</h2>
              <div class="student-panel-copy">Only urgent items are shown here.</div>
              <div class="student-action-list">
                ${attentionHtml}
              </div>
            </article>
          </section>
        </div>
      `;
    } catch (error) {
      console.error('Error loading dashboard:', error);
      html = `
        <div class="student-dashboard-shell student-dashboard-shell-error">
          <section class="student-dashboard-hero student-dashboard-hero-minimal">
            <article class="student-hero-card student-hero-card-minimal">
              <div class="student-hero-main">
                <p class="student-hero-kicker">Resident overview</p>
                <h1><span>Good morning,</span> ${firstName}</h1>
                <p>The dashboard is available, but the latest room, fee, and request data could not be loaded right now.</p>
              </div>
              <div class="student-hero-tags">
                <span class="student-hero-tag">Retry in a moment</span>
              </div>
              <div class="student-hero-summary">
                <span class="student-hero-summary-label">Status</span>
                <strong>Retry</strong>
                <span>Refresh the page after a moment.</span>
              </div>
            </article>
          </section>

          <section class="student-dashboard-bottom student-dashboard-bottom-single student-dashboard-bottom-minimal">
            <article class="student-panel">
              <h2>Dashboard error</h2>
              <div class="student-panel-copy">Unable to load room allocations, requests, fees, or complaints right now.</div>
            </article>
          </section>
        </div>
      `;
    }

    Layout.render(container, html);
  }
}

Router.registerPage('student-dashboard', InstitutionalStudentDashboardPage);
