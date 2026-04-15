// Staff Dashboard Page
class StaffDashboardPage extends Page {
  async render(container) {
    const stats = await this.loadStats();
    const role = Layout.getRoleLabel(Auth.getUser()?.role);

    const html = `
      <div class="dashboard">
        <section class="page-hero">
          <div class="page-hero-copy">
            <span class="hero-kicker">${role}</span>
            <h1 class="page-hero-title">Residence operations at a glance</h1>
            <p class="page-hero-subtitle">This dashboard brings together live guest approvals, complaint pressure, room occupancy, and available capacity so the team can act faster.</p>
            <div class="hero-pill-row">
              <span class="hero-pill">${stats.pendingRequests} guest request${stats.pendingRequests === 1 ? '' : 's'} waiting</span>
              <span class="hero-pill">${stats.unresolvedComplaints} complaint${stats.unresolvedComplaints === 1 ? '' : 's'} need attention</span>
              <span class="hero-pill">${stats.availableRooms} room${stats.availableRooms === 1 ? '' : 's'} available</span>
            </div>
          </div>
          <div class="page-hero-panel">
            <div class="metric-card">
              <span class="metric-label">Occupancy Rate</span>
              <span class="metric-value">${stats.occupancyRate}%</span>
              <span class="metric-note">${stats.occupiedRooms} active allocations across ${stats.totalRooms} total rooms.</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">Pending Approvals</span>
              <span class="metric-value">${stats.pendingRequests}</span>
              <span class="metric-note">Guest workflow items still need staff action.</span>
            </div>
          </div>
        </section>

        <section class="overview-grid">
          <article class="stat-card">
            <span class="stat-label">Pending Guests</span>
            <h3>${stats.pendingRequests}</h3>
            <p>Requests currently waiting for approval or rejection.</p>
          </article>
          <article class="stat-card">
            <span class="stat-label">Open Complaints</span>
            <h3>${stats.unresolvedComplaints}</h3>
            <p>Issues still marked open or in progress for the team.</p>
          </article>
          <article class="stat-card">
            <span class="stat-label">Occupied Rooms</span>
            <h3>${stats.occupiedRooms}</h3>
            <p>Active room allocations currently in force across the hostel.</p>
          </article>
          <article class="stat-card">
            <span class="stat-label">Available Capacity</span>
            <h3>${stats.availableRooms}</h3>
            <p>Rooms still available before occupancy reaches capacity.</p>
          </article>
        </section>

        <div class="dashboard-cards">
          <div class="card">
            <h3>Operations Pulse</h3>
            <p>The residence team currently has <strong>${stats.pendingRequests}</strong> guest approvals and <strong>${stats.unresolvedComplaints}</strong> complaint workflows to watch. Use the sidebar to move straight into the queue that needs action.</p>
          </div>
          <div class="card">
            <h3>Capacity Watch</h3>
            <p>${stats.totalRooms ? `With ${stats.occupiedRooms} of ${stats.totalRooms} rooms occupied, the hostel is running at ${stats.occupancyRate}% occupancy.` : 'Room inventory data is not available yet.'} ${stats.availableRooms > 0 ? `${stats.availableRooms} room slots still appear available.` : 'Capacity looks fully utilized right now.'}</p>
          </div>
        </div>
      </div>
    `;

    Layout.render(container, html);
  }

  async loadStats() {
    try {
      const [guestRequests, complaints, rooms, allocations] = await Promise.all([
        API.getGuestRequests({ status: 'pending' }),
        API.getComplaints(),
        API.getRooms(),
        API.getAllocations()
      ]);

      const pendingRequests = guestRequests.length;
      const unresolvedComplaints = complaints.filter(c => ['open', 'in_progress'].includes(c.status)).length;
      const totalRooms = rooms.length;
      const occupiedRooms = (allocations || []).filter(allocation => allocation.active).length;
      const availableRooms = Math.max(totalRooms - occupiedRooms, 0);
      const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

      return {
        pendingRequests,
        unresolvedComplaints,
        totalRooms,
        occupiedRooms,
        availableRooms,
        occupancyRate
      };
    } catch (error) {
      return {
        pendingRequests: 0,
        unresolvedComplaints: 0,
        totalRooms: 0,
        occupiedRooms: 0,
        availableRooms: 0,
        occupancyRate: 0
      };
    }
  }
}

Router.registerPage('staff-dashboard', StaffDashboardPage);
