document.addEventListener("DOMContentLoaded", function() {
    let totalSales = 0;
    let totalOrders = 0;
    let currentPage = 1;
    const ordersPerPage = 10; // Number of orders per page
    let fetchInterval;

    function fetchTransactions() {
        fetch('/fetch_transactions')
            .then(response => response.json())
            .then(data => {
                updateOverviewMetrics(data);
                updateRecentOrders(data);
            })
            .catch(error => console.error('Error fetching transactions:', error));
    }

    function updateOverviewMetrics(transactions) {
        totalSales = transactions.reduce((sum, t) => sum + parseFloat(t.Amount), 0);
        totalOrders = transactions.length;
        const totalCustomers = 100; // Mock data for customers

        document.getElementById('total-sales').innerText = `$${totalSales.toFixed(2)}`;
        document.getElementById('total-orders').innerText = totalOrders;
        document.getElementById('total-customers').innerText = totalCustomers;
    }

    function updateRecentOrders(transactions) {
        const recentOrdersBody = document.getElementById('recent-orders-body');
        recentOrdersBody.innerHTML = '';

        // Calculate pagination
        const startIndex = (currentPage - 1) * ordersPerPage;
        const endIndex = startIndex + ordersPerPage;
        const ordersToShow = transactions.slice(startIndex, endIndex);

        ordersToShow.forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${transaction.Time}</td>
                <td>$${parseFloat(transaction.Amount).toFixed(2)}</td>
                <td>Paid</td>
            `;
            recentOrdersBody.appendChild(row);
        });

        // Add pagination controls if needed
        renderPaginationControls(transactions.length);
    }

    function renderPaginationControls(totalTransactions) {
        const totalPages = Math.ceil(totalTransactions / ordersPerPage);

        let paginationHTML = `
            <div class="pagination">
                <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
                <span>Page ${currentPage} of ${totalPages}</span>
                <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
            </div>
        `;

        document.getElementById('pagination-controls').innerHTML = paginationHTML;
    }

    window.changePage = function(pageNumber) {
        if (pageNumber < 1 || pageNumber > Math.ceil(totalOrders / ordersPerPage)) {
            return;
        }
        currentPage = pageNumber;
        fetchTransactions();
    };

    function startFetchingTransactions() {
        fetchInterval = setInterval(fetchTransactions, 5000); // Poll every 5 seconds
    }

    function stopFetchingTransactions() {
        clearInterval(fetchInterval); // Clear the fetch interval
    }

    // Initialize by fetching transactions if simulation is running or paused
    fetch('/get_simulation_state')
        .then(response => response.json())
        .then(state => {
            if (state.running) {
                startFetchingTransactions();
            }
        })
        .catch(error => console.error('Error fetching simulation state:', error));

    // Periodically check the simulation state to start or stop fetching transactions
    setInterval(() => {
        fetch('/get_simulation_state')
            .then(response => response.json())
            .then(state => {
                if (state.running && !fetchInterval) {
                    startFetchingTransactions();
                } else if (!state.running && fetchInterval) {
                    stopFetchingTransactions();
                }
            })
            .catch(error => console.error('Error fetching simulation state:', error));
    }, 5000); // Check every 5 seconds

    fetchTransactions(); // Initial fetch
});
