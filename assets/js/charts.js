
document.addEventListener('DOMContentLoaded', async () => {
    const chartsGrid = document.querySelector('.charts-grid');
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'loading';
    loadingSpinner.innerHTML = '<i class="fas fa-spinner fa-spin fa-3x"></i>';
    
    // Check if we are on the charts page with a container
    if (!chartsGrid) return;

    chartsGrid.appendChild(loadingSpinner);

    let allCharts = [];

    try {
        // Fetch the index.yaml from the charts repository
        // Using the GitHub Pages URL as this is a static site
        const response = await fetch('https://helmhub-io.github.io/charts/index.yaml');
        if (!response.ok) throw new Error('Failed to fetch charts index');
        
        const yamlText = await response.text();
        const data = jsyaml.load(yamlText); // Assumes js-yaml is loaded globally
        
        // Process entries to get the latest version of each chart
        allCharts = Object.entries(data.entries).map(([name, versions]) => {
            const latest = versions[0]; // First entry is usually the latest in Helm index
            return {
                name: name,
                version: latest.version,
                appVersion: latest.appVersion,
                description: latest.description,
                icon: latest.icon || 'assets/logo/helm-white.png', // Fallback icon
                home: latest.home,
                sources: latest.sources,
                keywords: latest.keywords || []
            };
        });

        // Check for search query params
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');
        
        if (query) {
            searchInput.value = query;
            renderCharts(filterCharts(allCharts, query));
        } else {
            renderCharts(allCharts);
        }

    } catch (error) {
        console.error('Error loading charts:', error);
        chartsGrid.innerHTML = `<p class="error">Error loading charts: ${error.message}</p>`;
    } finally {
        if (chartsGrid.contains(loadingSpinner)) {
            chartsGrid.removeChild(loadingSpinner);
        }
    }

    // Search functionality
    function handleSearch() {
        const query = searchInput.value.trim();
        const filtered = filterCharts(allCharts, query);
        renderCharts(filtered);
        
        // Update URL without reloading
        const url = new URL(window.location);
        if (query) {
            url.searchParams.set('q', query);
        } else {
            url.searchParams.delete('q');
        }
        window.history.pushState({}, '', url);
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
    }

    function filterCharts(charts, query) {
        if (!query) return charts;
        const lowerQuery = query.toLowerCase();
        return charts.filter(chart => 
            chart.name.toLowerCase().includes(lowerQuery) ||
            (chart.description && chart.description.toLowerCase().includes(lowerQuery)) ||
            (chart.keywords && chart.keywords.some(k => k.toLowerCase().includes(lowerQuery)))
        );
    }

    function renderCharts(charts) {
        chartsGrid.innerHTML = '';
        if (charts.length === 0) {
            chartsGrid.innerHTML = '<p class="no-results">No charts found matching your search.</p>';
            return;
        }

        charts.forEach(chart => {
            const card = document.createElement('div');
            card.className = 'chart-card';
            
            // Handle long descriptions
            const description = chart.description ? 
                (chart.description.length > 100 ? chart.description.substring(0, 100) + '...' : chart.description) : 
                'No description available';

            card.innerHTML = `
                <div class="chart-icon-container">
                    <img src="${chart.icon}" alt="${chart.name}" onerror="this.src='/assets/logo/helm-white.png'">
                </div>
                <h3>${chart.name}</h3>
                <p class="chart-version">v${chart.version} (App v${chart.appVersion})</p>
                <p class="chart-desc">${description}</p>
                <div class="chart-links">
                    <button class="btn-small" onclick="showInstallModal('${chart.name}')">Install</button>
                    ${chart.home ? `<a href="${chart.home}" target="_blank" class="btn-small github"><i class="fa-solid fa-external-link"></i></a>` : ''}
                </div>
            `;
            chartsGrid.appendChild(card);
        });
    }
    
    // Helper function for debouncing
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
});

// Simple modal for install instructions
function showInstallModal(chartName) {
    const modalHtml = `
        <div class="modal-overlay" onclick="this.remove()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <button class="close-modal" onclick="this.closest('.modal-overlay').remove()">×</button>
                <h2>Install ${chartName}</h2>
                <div class="install-steps">
                    <p>1. Add the repo:</p>
                    <pre><code>helm repo add helmhub https://helmhub-io.github.io/charts</code></pre>
                    <p>2. Install the chart:</p>
                    <pre><code>helm install my-${chartName} helmhub/${chartName} --version <latest_version></code></pre>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}
