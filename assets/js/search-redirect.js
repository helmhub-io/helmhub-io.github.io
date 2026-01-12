document.addEventListener('DOMContentLoaded', function() {
    // Search functionality
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');

    // If we are on the charts page, let charts.js handle it
    if (window.location.pathname.endsWith('charts.html')) return;

    function performSearch() {
        // Assume relative charts.html if not absolute
        const query = searchInput.value.trim();
        if (query) {
            window.location.href = `charts.html?q=${encodeURIComponent(query)}`;
        }
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
    }
});
