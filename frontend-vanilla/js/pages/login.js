// Login Page
class LoginPage extends Page {
  async render(container) {
    document.body.classList.add('login-view');
    document.body.classList.remove('portal-view');
    document.body.classList.remove('student-portal-view', 'staff-portal-view');
    document.body.removeAttribute('data-page');

    const html = `
      <div class="login-portal-container">
        <div class="login-portal-card">
          <div class="portal-sidebar-area">
            <div class="logo-lockup">
              <div class="logo-mark">HM</div>
              <div class="logo-copy">
                <span class="logo-eyebrow">Campus Residence Ops</span>
                <span class="logo-title">Hostel Management</span>
              </div>
            </div>
            
            <div class="portal-sidebar-footer">
              <p>v2.4 Institutional Release</p>
              <p>&copy; 2026 Campus Operations</p>
            </div>
          </div>

          <div class="portal-main-area">
            <div class="portal-visual-decor">
              <span class="portal-badge">Authorized Access</span>
            </div>

            <div class="portal-header">
              <span class="eyebrow">Institutional Portal</span>
              <h1>Welcome back</h1>
            </div>

            <form id="login-form" class="portal-form">
              <div class="form-group">
                <label for="email">Institutional Email</label>
                <input type="email" id="email" name="email" required placeholder="name@college.edu">
              </div>

              <div class="form-group">
                <label for="password">Security Password</label>
                <input type="password" id="password" name="password" required placeholder="••••••••••••">
              </div>

              <button type="submit" class="portal-btn-login" id="login-submit">Sign In to Dashboard</button>

              <div class="portal-demo-section">
                <label>Quick Access Demo</label>
                <div class="portal-demo-grid">
                  <button class="portal-demo-chip" type="button" data-fill-email="john@student.com" data-fill-password="pass123">
                    <span class="chip-label">Resident Student</span>
                    <span class="chip-val">john@student.com</span>
                    <span class="chip-pass">Pass: pass123</span>
                  </button>
                  <button class="portal-demo-chip" type="button" data-fill-email="warden@hostel.com" data-fill-password="warden123">
                    <span class="chip-label">Hostel Warden</span>
                    <span class="chip-val">warden@hostel.com</span>
                    <span class="chip-pass">Pass: warden123</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;

    const form = container.querySelector('#login-form');
    const submitButton = container.querySelector('#login-submit');

    // Handle Demo chips
    container.querySelectorAll('[data-fill-email]').forEach(chip => {
      chip.addEventListener('click', () => {
        form.email.value = chip.dataset.fillEmail;
        form.password.value = chip.dataset.fillPassword;
        form.email.focus();
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = form.email.value;
      const password = form.password.value;

      submitButton.disabled = true;
      submitButton.textContent = 'Signing In...';

      try {
        const response = await API.login(email, password);
        const { token, user } = response;

        if (token && user) {
          Auth.setUser(user, token);
          Router.navigate(Auth.getHomePage());
        }
      } catch (error) {
        this.showError('Login failed: ' + error.message);
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Sign In';
      }
    });
  }
}

Router.registerPage('login', LoginPage);
