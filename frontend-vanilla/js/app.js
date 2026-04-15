// Main App Initialization
document.addEventListener('DOMContentLoaded', async () => {
  const getTargetPage = () => window.location.hash.slice(1) || Auth.getHomePage();
  await Router.navigate(getTargetPage());

  window.addEventListener('hashchange', () => {
    Router.navigate(getTargetPage());
  });
});
