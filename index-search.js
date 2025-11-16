// index-search.js - Handle search from homepage
document.addEventListener('DOMContentLoaded', () => {
  const searchBtn = document.querySelector('.search-btn');
  const searchInput = document.querySelector('.search-pill input[type="text"]');
  const bhkSelect = document.querySelector('.search-pill select[name="bhk"]');
  const sortSelect = document.querySelector('.search-pill select[name="filters"]');

  // Search button click handler
  searchBtn?.addEventListener('click', performSearch);

  // Enter key in search input
  searchInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });

  function performSearch() {
    const query = searchInput?.value.trim() || '';
    const bhk = bhkSelect?.value || '';
    const sort = sortSelect?.value || '';

    // Build URL with parameters
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (bhk) params.append('bhk', bhk);
    if (sort) params.append('sort', sort);

    // Redirect to search page with parameters
    window.location.href = `search.html?${params.toString()}`;
  }

  // Update nav links based on authentication status
  updateNavigation();
});

function updateNavigation() {
  const navLinks = document.querySelector('.nav-links');
  if (!navLinks) return;

  if (ApiService && ApiService.isAuthenticated()) {
    const user = ApiService.getCurrentUser();
    
    // Replace Sign Up with Profile/Logout
    const signupBtn = navLinks.querySelector('.signup-btn');
    const loginLink = navLinks.querySelector('a[href="login.html"]');
    
    if (signupBtn) {
      signupBtn.textContent = user.name;
      signupBtn.href = '#';
      signupBtn.classList.remove('signup-btn');
      signupBtn.onclick = (e) => {
        e.preventDefault();
        if (confirm('Do you want to logout?')) {
          ApiService.logout();
        }
      };
    }
    
    if (loginLink) {
      loginLink.textContent = 'Logout';
      loginLink.href = '#';
      loginLink.onclick = (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
          ApiService.logout();
        }
      };
    }
  }
}