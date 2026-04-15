// Layout Component
class Layout {
  static PAGE_META = {
    'student-dashboard': {
      kicker: 'Student Portal',
      title: 'Student Dashboard',
      subtitle: 'Stay on top of room details, visitor approvals, fee dues, and support requests from one calm workspace.'
    },
    'guest-request': {
      kicker: 'Student Portal',
      title: 'Guest Visit Request',
      subtitle: 'Plan a compliant guest stay with timing, contact details, and ID documentation in one submission.'
    },
    'visitor-log': {
      kicker: 'Student Portal',
      title: 'Visitor Log',
      subtitle: 'Record day visitors quickly so entry history stays clear for the residence team.'
    },
    'pay-fees': {
      kicker: 'Student Finance',
      title: 'Fee Payments',
      subtitle: 'Review hostel dues, track payment status, and clear pending balances without leaving the portal.'
    },
    'raise-complaint': {
      kicker: 'Student Support',
      title: 'Raise Complaint',
      subtitle: 'Report maintenance, cleanliness, or room issues with enough context for faster resolution.'
    },
    'transfer-request': {
      kicker: 'Student Allocation',
      title: 'Transfer Request',
      subtitle: 'Request a room move with clear reasons so wardens can review placement changes efficiently.'
    },
    'my-allocations': {
      kicker: 'Student Allocation',
      title: 'My Allocations',
      subtitle: 'View your current and previous room assignments, dates, and allocation history in one place.'
    },
    'staff-dashboard': {
      kicker: 'Operations Hub',
      title: 'Staff Dashboard',
      subtitle: 'Monitor requests, occupancy, complaints, and daily residence activity from a single operational snapshot.'
    },
    'guest-queue': {
      kicker: 'Operations Hub',
      title: 'Guest Requests Queue',
      subtitle: 'Approve or decline pending guest stays while keeping fee, timing, and compliance information visible.'
    },
    kiosk: {
      kicker: 'Front Desk',
      title: 'Check-in / Check-out',
      subtitle: 'Run live arrival and departure control for approved guests without losing request context.'
    },
    'guest-calendar': {
      kicker: 'Planning',
      title: 'Guest Calendar',
      subtitle: 'See upcoming guest room occupancy and booking overlap at a glance across the residence blocks.'
    },
    'rooms-management': {
      kicker: 'Administration',
      title: 'Rooms & Blocks',
      subtitle: 'Manage room inventory, block capacity, and availability with a cleaner operational overview.'
    },
    'transfers-waitlist': {
      kicker: 'Administration',
      title: 'Transfers & Waitlist',
      subtitle: 'Review transfer requests and waitlist demand side by side for better room planning decisions.'
    },
    'fees-payments': {
      kicker: 'Finance Desk',
      title: 'Fees & Payments',
      subtitle: 'Track unpaid hostel fees, mark settlements, and keep payment history auditable for the team.'
    },
    'complaints-board': {
      kicker: 'Support Desk',
      title: 'Complaints Board',
      subtitle: 'Prioritize open complaints, assign action, and move issues to resolution without losing visibility.'
    },
    inventory: {
      kicker: 'Caretaker Desk',
      title: 'Inventory',
      subtitle: 'Keep an eye on assets, availability, and replacement workflows used across hostel operations.'
    },
    'audit-pii': {
      kicker: 'Governance',
      title: 'Audit & PII',
      subtitle: 'Review audit trails and privacy cleanup events with the right level of administrative control.'
    }
  };

  static getRoleLabel(role) {
    const labels = {
      student: 'Resident Student',
      warden: 'Warden',
      superadmin: 'Super Admin',
      accountant: 'Accounts',
      caretaker: 'Caretaker'
    };

    return labels[role] || role || 'User';
  }

  static getPageMeta(pageName) {
    return this.PAGE_META[pageName] || {
      kicker: 'Residence Portal',
      title: 'Hostel Management',
      subtitle: 'A shared workspace for student services, room operations, guest control, and finance tracking.'
    };
  }

  static buildNavGroup(label, items, activePage) {
    const links = items
      .filter(Boolean)
      .map(item => `
        <a href="#" data-page="${item.page}" class="nav-link ${activePage === item.page ? 'nav-link-active' : ''}">
          ${item.label}
        </a>
      `)
      .join('');

    if (!links) {
      return '';
    }

    return `
      <div class="nav-group">
        <span class="nav-section-label">${label}</span>
        ${links}
      </div>
    `;
  }

  static render(container, content) {
    const layout = document.createElement('div');
    layout.className = 'layout';

    document.body.classList.remove('login-view', 'portal-view', 'student-portal-view', 'staff-portal-view');

    const user = Auth.getUser() || {};
    const isSidebarVisible = Auth.isLoggedIn();
    const isStudentPortal = Auth.isStudent();
    const activePage = Router.currentPageName || Auth.getHomePage();
    const pageMeta = this.getPageMeta(activePage);
    const todayLabel = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    document.body.setAttribute('data-page', activePage);

    const studentNav = [
      {
        label: 'Resident Workspace',
        items: [
          { page: 'student-dashboard', label: 'Dashboard' },
          { page: 'my-allocations', label: 'My Allocations' },
          { page: 'pay-fees', label: 'Pay Fees' }
        ]
      },
      {
        label: 'Requests & Support',
        items: [
          { page: 'guest-request', label: 'Guest Visit Request' },
          { page: 'visitor-log', label: 'Visitor Log' },
          { page: 'raise-complaint', label: 'Raise Complaint' },
          { page: 'transfer-request', label: 'Transfer Request' }
        ]
      }
    ];

    const staffNav = [
      {
        label: 'Operations',
        items: [
          { page: 'staff-dashboard', label: 'Dashboard' },
          Auth.hasRole(['superadmin', 'warden', 'caretaker']) ? { page: 'guest-queue', label: 'Guest Requests' } : null,
          Auth.hasRole(['superadmin', 'warden', 'caretaker']) ? { page: 'kiosk', label: 'Check-in / Check-out' } : null,
          { page: 'guest-calendar', label: 'Guest Calendar' },
          { page: 'complaints-board', label: 'Complaints Board' }
        ]
      },
      {
        label: 'Administration',
        items: [
          Auth.hasRole(['superadmin', 'warden']) ? { page: 'rooms-management', label: 'Rooms & Blocks' } : null,
          Auth.hasRole(['superadmin', 'warden']) ? { page: 'transfers-waitlist', label: 'Transfers & Waitlist' } : null,
          Auth.hasRole(['superadmin', 'warden', 'accountant']) ? { page: 'fees-payments', label: 'Fees & Payments' } : null,
          Auth.hasRole(['superadmin', 'warden', 'caretaker']) ? { page: 'inventory', label: 'Inventory' } : null,
          Auth.hasRole(['superadmin', 'warden']) ? { page: 'audit-pii', label: 'Audit & PII' } : null
        ]
      }
    ];

    const navGroups = isStudentPortal ? studentNav : staffNav;

    document.title = `${pageMeta.title} | Hostel Management`;

    layout.innerHTML = `
      <div class="layout-wrapper">
        ${isSidebarVisible ? `
          <aside class="sidebar">
            <div class="sidebar-header">
              <div class="logo-lockup">
                <div class="logo-mark">HM</div>
                <div class="logo-copy">
                  <span class="logo-eyebrow">Campus Residence Ops</span>
                  <h1 class="logo-title">Hostel Management</h1>
                  <p class="logo-subtitle">A clearer operating space for rooms, guest approvals, support, and fee workflows.</p>
                </div>
              </div>
              <span class="sidebar-role-chip">${this.getRoleLabel(user.role)}</span>
            </div>
            <nav class="sidebar-nav">
              ${navGroups.map(group => this.buildNavGroup(group.label, group.items, activePage)).join('')}
            </nav>
            <div class="sidebar-footer">
              <strong>Live Operations</strong>
              <span>Requests, rooms, visitor flow, and finance actions stay connected across the portal.</span>
            </div>
          </aside>
        ` : ''}
        <div class="main-content">
          <header class="topbar">
            <div class="topbar-left">
              <span class="topbar-kicker">${pageMeta.kicker}</span>
              <h2>${pageMeta.title}</h2>
              <p class="topbar-subtitle">${pageMeta.subtitle}</p>
            </div>
            <div class="topbar-right">
              ${isSidebarVisible ? `
                <span class="topbar-meta-chip topbar-date">${todayLabel}</span>
                <span class="topbar-divider" aria-hidden="true"></span>
                <div class="user-info">
                  <span class="user-name">${user.full_name || 'Hostel User'}</span>
                  <span class="user-role">${this.getRoleLabel(user.role)}</span>
                </div>
                <button class="btn btn-logout" id="logout-btn">Sign Out</button>
              ` : ''}
            </div>
          </header>
          <main class="page-content">
            ${content}
          </main>
        </div>
      </div>
    `;

    container.appendChild(layout);

    layout.querySelectorAll('[data-page]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        Router.navigate(link.dataset.page);
      });
    });

    const logoutBtn = layout.querySelector('#logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        Auth.logout();
        Router.navigate('login');
      });
    }
  }
}
