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