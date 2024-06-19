// Mock data for users and transactions (replace with actual backend integration)
const users = [
    { id: 1, name: "John Doe", balance: 10000.0 },
    { id: 2, name: "Jane Smith", balance: 7500.0 },
    { id: 3, name: "Mike Johnson", balance: 5000.0 }
  ];
  
  const transactions = [
    { userId: 1, date: "2024-06-15", description: "Online Payment", amount: 50.0 },
    { userId: 1, date: "2024-06-14", description: "ATM Withdrawal", amount: 100.0 },
    { userId: 2, date: "2024-06-13", description: "POS Purchase", amount: 30.0 },
    { userId: 3, date: "2024-06-12", description: "Online Transfer", amount: 200.0 }
  ];
  
  // Function to populate user account details based on selected user
  function populateUserDetails(userId) {
    const user = users.find(u => u.id === userId);
    if (user) {
      document.getElementById("user-name").textContent = user.name;
      document.getElementById("account-balance").textContent = `$${user.balance.toFixed(2)}`;
  
      const transactionList = document.getElementById("transaction-list");
      transactionList.innerHTML = "";
      transactions.filter(t => t.userId === userId).forEach(transaction => {
        const li = document.createElement("li");
        li.innerHTML = `
          <span class="transaction-date">${transaction.date}</span>
          <span class="transaction-description">${transaction.description}</span>
          <span class="transaction-amount">$${transaction.amount.toFixed(2)}</span>
        `;
        transactionList.appendChild(li);
      });
    }
  }
  
  // Populate initial details for the first user (mock)
  populateUserDetails(1);
  
  // Function to handle clicking on a user in the user list
  const userList = document.querySelectorAll(".user-list li a");
  userList.forEach(user => {
    user.addEventListener("click", function(event) {
      event.preventDefault();
      const userId = parseInt(this.getAttribute("data-userid"));
      populateUserDetails(userId);
    });
  });



let fetchInterval;

async function startFetchingTransactions() {
    fetchInterval = setInterval(async function () {
        try {
            const response = await fetch('/simulate');
            const result = await response.json();
            if (response.ok) {
                if (result.message === "Simulation complete") {
                    stopFetchingTransactions();
                    alert(result.message);
                    return;
                }
                updateTransactionList(result.transaction, result.prediction_traditional, result.prediction_hybrid);
                updateFraudAlerts(result.transaction, result.prediction_traditional, result.prediction_hybrid);
            } else {
                console.error('Error:', result.error);
                alert(result.error);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while fetching the transaction.');
        }
    }, 1000);
}

function stopFetchingTransactions() {
    clearInterval(fetchInterval);
}

function updateTransactionList(transaction, prediction_traditional, prediction_hybrid, true_label) {
    const transactionList = document.querySelector('.realtime-transactions-list');
    const transactionItem = document.createElement('li');
    transactionItem.classList.add(prediction_traditional === 1 || prediction_hybrid === 1 ? 'fraudulent' : 'non-fraudulent');
    transactionItem.innerHTML = `
        <span class="transaction-date">${transaction.Time}</span>
        <span class="transaction-description">Transaction ${transaction.Time}</span>
        <span class="transaction-amount">Rs ${transaction.Amount}</span>
        <div>
            <p>Traditional Model Prediction: <span style="color:${prediction_traditional === 1 ? 'red' : 'green'}">${prediction_traditional}</span></p>
            <p>Hybrid Model Prediction: <span style="color:${prediction_hybrid === 1 ? 'red' : 'green'}">${prediction_hybrid}</span></p>
            <p>True Label: <span style="color:${true_label === 1 ? 'red' : 'green'}">${true_label}</span></p>
        </div>
    `;
    transactionList.appendChild(transactionItem);
}

function updateFraudAlerts(transaction, prediction_traditional, prediction_hybrid) {
    if (prediction_traditional === 1 || prediction_hybrid === 1) {
        const alertList = document.querySelector('.fraud-alerts-list');
        const alertItem = document.createElement('li');
        alertItem.innerHTML = `
            <a href="#">
                <span class="alert-date">${transaction.Time}</span>
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


        alertList.appendChild(alertItem);
    }
}

// Get the modal
const modal = document.getElementById('transactionModal');

// Get the <span> element that closes the modal
const span = modal.querySelector('.close');

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
    modal.style.display = 'none';
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}