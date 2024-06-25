document.addEventListener('DOMContentLoaded', function () {
    const itemsPerPage = 10;
    let currentRealTimePage = 1;
    let currentFraudPage = 1;
    let wasOnLastRealTimePage = true;
    let wasOnLastFraudPage = true;

    const realTimeTransactionsList = document.querySelector('.realtime-transactions-list');
    const realTimeTransactionsPagination = document.getElementById('realtime-transactions-pagination');
    const fraudAlertsList = document.querySelector('.fraud-alerts-list');
    const fraudAlertsPagination = document.getElementById('fraud-alerts-pagination');
    const startButton = document.getElementById('start-button');

    let intervalId = null;

    async function fetchTransactions() {
        try {
            const response = await fetch('/fetch_and_process_transactions');
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error ${response.status}: ${errorText}`);
            }
            const transactions = await response.json();
            updateRealTimeTransactions(transactions);
            updateFraudAlerts(transactions);
        } catch (error) {
            console.error('Fetch Error:', error);
            alert(`An error occurred: ${error.message}`);
        }
    }

    function updateRealTimeTransactions(transactions) {
        realTimeTransactionsList.innerHTML = '';
        transactions.forEach(transaction => {
            const transactionItem = document.createElement('li');
            transactionItem.classList.add(transaction.prediction_traditional === 1 || transaction.prediction_hybrid === 1 ? 'fraudulent' : 'non-fraudulent');
            transactionItem.innerHTML = `
                <span class="transaction-date">${transaction.Time}</span>
                <span class="transaction-description">Transaction ${transaction.Time}</span>
                <span class="transaction-amount">Rs ${transaction.Amount}</span>
                <div>
                    <p>Traditional Model Prediction: <span style="color:${transaction.prediction_traditional === 1 ? 'red' : 'green'}">${transaction.prediction_traditional}</span></p>
                    <p>Hybrid Model Prediction: <span style="color:${transaction.prediction_hybrid === 1 ? 'red' : 'green'}">${transaction.prediction_hybrid}</span></p>
                    <p>True Label: <span style="color:${transaction.true_label === 1 ? 'red' : 'green'}">${transaction.true_label}</span></p>
                </div>
            `;
            realTimeTransactionsList.appendChild(transactionItem);
        });

        const totalPages = Math.ceil(realTimeTransactionsList.children.length / itemsPerPage);
        if (wasOnLastRealTimePage) {
            currentRealTimePage = totalPages;
        }
        paginate(realTimeTransactionsList, realTimeTransactionsPagination, currentRealTimePage, itemsPerPage);
    }

    function updateFraudAlerts(transactions) {
        fraudAlertsList.innerHTML = '';
        transactions.filter(transaction => transaction.prediction_traditional === 1 || transaction.prediction_hybrid === 1).forEach(transaction => {
            const alertItem = document.createElement('li');
            alertItem.innerHTML = `
                <a href="#">
                    <span class="alert-description">Fraudulent Activity Detected</span>
                    <button class="details-button">Show Details</button>
                </a>
            `;

            alertItem.querySelector('.details-button').addEventListener('click', function () {
                const modal = document.getElementById('transactionModal');
                const modalBody = document.getElementById('modalBody');
                modalBody.innerHTML = Object.entries(transaction).map(([key, value]) => `<p><strong>${key}</strong>: ${value}</p>`).join('');
                modal.style.display = 'block';
            });

            fraudAlertsList.appendChild(alertItem);
        });

        const totalPages = Math.ceil(fraudAlertsList.children.length / itemsPerPage);
        if (wasOnLastFraudPage) {
            currentFraudPage = totalPages;
        }
        paginate(fraudAlertsList, fraudAlertsPagination, currentFraudPage, itemsPerPage);
    }

    function paginate(list, pagination, currentPage, itemsPerPage) {
        const items = list.children;
        const totalItems = items.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        pagination.innerHTML = '';

        // Previous Button
        const prevButton = document.createElement('li');
        prevButton.classList.add('page-item', 'page-prev');
        prevButton.innerHTML = `<a href="#" class="page-link">&laquo;</a>`;
        prevButton.addEventListener('click', function (event) {
            event.preventDefault();
            if (currentPage > 1) {
                currentPage--;
                updatePaginationText();
                showPage(items, currentPage, itemsPerPage);
            }
            wasOnLastRealTimePage = currentPage === totalPages;
            wasOnLastFraudPage = currentPage === totalPages;
        });
        pagination.appendChild(prevButton);

        // Pagination Text (Current Page / Total Pages)
        const paginationText = document.createElement('li');
        paginationText.classList.add('page-item', 'page-text');
        updatePaginationText(); // Initial update
        pagination.appendChild(paginationText);

        // Next Button
        const nextButton = document.createElement('li');
        nextButton.classList.add('page-item', 'page-next');
        nextButton.innerHTML = `<a href="#" class="page-link">&raquo;</a>`;
        nextButton.addEventListener('click', function (event) {
            event.preventDefault();
            if (currentPage < totalPages) {
                currentPage++;
                updatePaginationText();
                showPage(items, currentPage, itemsPerPage);
            }
            wasOnLastRealTimePage = currentPage === totalPages;
            wasOnLastFraudPage = currentPage === totalPages;
        });
        pagination.appendChild(nextButton);

        // Function to update pagination text (Current Page / Total Pages)
        function updatePaginationText() {
            paginationText.innerHTML = `<span class="page-link">${currentPage} / ${totalPages}</span>`;
        }

        // Show the current page
        showPage(items, currentPage, itemsPerPage);
    }

    function showPage(items, page, itemsPerPage) {
        const totalItems = items.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        let start = (page - 1) * itemsPerPage;
        let end = start + itemsPerPage;

        // Adjust end to ensure it doesn't exceed totalItems
        if (end > totalItems) {
            end = totalItems;
        }

        // Toggle display based on index
        for (let i = 0; i < totalItems; i++) {
            if (i >= start && i < end) {
                items[i].style.display = '';
            } else {
                items[i].style.display = 'none';
            }
        }
    }

    function startFetchingTransactions() {
        fetchTransactions(); // Fetch initially
        intervalId = setInterval(fetchTransactions, 10000); // Fetch every 10 seconds
    }

    function createStartButton() {
        startButton.addEventListener('click', function () {
            startFetchingTransactions();
            startButton.disabled = true; // Disable the button after clicking to prevent multiple intervals
        });
    }

    // Modal close functionality
    const modal = document.getElementById('transactionModal');
    const span = modal.querySelector('.close');
    span.onclick = function () {
        modal.style.display = 'none';
    }
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

    createStartButton(); // Call createStartButton function
});
