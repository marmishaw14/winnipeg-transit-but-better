let autoRefreshInterval = null;
const REFRESH_INTERVAL = 30000; // 30 seconds
const stopIdInput = document.getElementById('stopId');
const searchBtn = document.getElementById('searchBtn');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const stopInfo = document.getElementById('stopInfo');
const arrivals = document.getElementById('arrivals');
const autoRefreshCheckbox = document.getElementById('autoRefresh');
// Format time string to readable format
function formatTime(timeString) {
    if (!timeString)
        return 'N/A';
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}
// Calculate minutes until arrival
function getMinutesUntil(timeString) {
    if (!timeString)
        return null;
    const arrivalTime = new Date(timeString);
    const now = new Date();
    const diffMs = arrivalTime.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);
    return diffMins;
}
// Format minutes until arrival
function formatMinutesUntil(timeString) {
    const mins = getMinutesUntil(timeString);
    if (mins === null)
        return '';
    if (mins < 0)
        return ' (passed)';
    if (mins === 0)
        return ' (now)';
    if (mins === 1)
        return ' (1 min)';
    return ` (${mins} mins)`;
}
function showLoading() {
    loading.classList.remove('hidden');
    error.classList.add('hidden');
    stopInfo.classList.add('hidden');
    arrivals.innerHTML = '';
}
function showError(message) {
    loading.classList.add('hidden');
    error.classList.remove('hidden');
    error.textContent = message;
    stopInfo.classList.add('hidden');
    arrivals.innerHTML = '';
}
function displayArrivals(data) {
    loading.classList.add('hidden');
    error.classList.add('hidden');
    if (!data.arrivals || data.arrivals.length === 0) {
        arrivals.innerHTML = '<div class="no-arrivals">No upcoming arrivals found for this stop.</div>';
        stopInfo.classList.add('hidden');
        return;
    }
    // Display stop info
    const stopNameEl = document.getElementById('stopName');
    const stopIdDisplayEl = document.getElementById('stopIdDisplay');
    const updatedAtEl = document.getElementById('updatedAt');
    if (stopNameEl)
        stopNameEl.textContent = data.stopName || 'Unknown Stop';
    if (stopIdDisplayEl)
        stopIdDisplayEl.textContent = data.stopId;
    if (updatedAtEl)
        updatedAtEl.textContent = new Date(data.updatedAt).toLocaleString();
    stopInfo.classList.remove('hidden');
    // Display arrivals
    arrivals.innerHTML = data.arrivals.map(arrival => {
        const estimatedTime = arrival.estimatedArrival || arrival.scheduledArrival;
        const scheduledTime = arrival.scheduledArrival;
        return `
            <div class="arrival-card ${arrival.cancelled ? 'cancelled' : ''}">
                <div class="arrival-header">
                    <div>
                        <div class="route-badge">${arrival.route}</div>
                        ${arrival.routeName ? `<div class="route-name">${arrival.routeName}</div>` : ''}
                    </div>
                    ${arrival.cancelled ? '<div class="cancelled-badge">CANCELLED</div>' : ''}
                </div>
                <div class="time-info">
                    <div class="time-item">
                        <div class="time-label">Estimated Arrival</div>
                        <div class="time-value estimated">
                            ${formatTime(estimatedTime)}${formatMinutesUntil(estimatedTime)}
                        </div>
                    </div>
                    <div class="time-item">
                        <div class="time-label">Scheduled Arrival</div>
                        <div class="time-value scheduled">
                            ${formatTime(scheduledTime)}${formatMinutesUntil(scheduledTime)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}
async function fetchArrivals(stopId) {
    try {
        showLoading();
        const response = await fetch(`/stops/${stopId}/arrivals`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        const data = await response.json();
        displayArrivals(data);
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        showError(`Error: ${errorMessage}`);
        console.error('Error fetching arrivals:', err);
    }
}
function startAutoRefresh(stopId) {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    if (autoRefreshCheckbox.checked) {
        autoRefreshInterval = setInterval(() => {
            fetchArrivals(stopId);
        }, REFRESH_INTERVAL);
    }
}
function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}
// Event listeners
searchBtn.addEventListener('click', () => {
    const stopId = stopIdInput.value.trim();
    if (!stopId) {
        showError('Please enter a stop ID');
        return;
    }
    fetchArrivals(stopId);
    startAutoRefresh(stopId);
});
stopIdInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});
autoRefreshCheckbox.addEventListener('change', () => {
    const stopId = stopIdInput.value.trim();
    if (autoRefreshCheckbox.checked && stopId) {
        startAutoRefresh(stopId);
    }
    else {
        stopAutoRefresh();
    }
});
// Load initial data if stop ID is pre-filled
window.addEventListener('DOMContentLoaded', () => {
    const stopId = stopIdInput.value.trim();
    if (stopId) {
        fetchArrivals(stopId);
        startAutoRefresh(stopId);
    }
});
export {};
//# sourceMappingURL=app.js.map