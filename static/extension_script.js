document.getElementById('uploadForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    const response = await fetch('/upload', {
        method: 'POST',
        body: formData
    });
    const result = await response.json();
    if (result.message) {
        document.getElementById('startSimulation').disabled = false;
        alert(result.message);
    } else {
        alert(result.error);
    }
});

let simulationInterval;

document.getElementById('startSimulation').addEventListener('click', function () {
    document.getElementById('stopSimulation').disabled = false;
    document.getElementById('startSimulation').disabled = true;
    simulationInterval = setInterval(async function () {
        const response = await fetch('/simulate');
        const result = await response.json();
        if (result.message) {
            alert(result.message);
            clearInterval(simulationInterval);
            document.getElementById('startSimulation').disabled = false;
            document.getElementById('stopSimulation').disabled = true;
        } else {
            const resultDiv = document.getElementById('result');
            const transactionDiv = document.createElement('div');
            transactionDiv.classList.add('transaction-tile');
            transactionDiv.innerHTML = `
                <p><strong>Transaction ID:</strong> ${result.transaction.Time}</p>
                <p>Traditional Model Prediction: <span style="color:${result.prediction_traditional === 1 ? 'red' : 'green'}">${result.prediction_traditional}</span></p>
                <p>Hybrid Model Prediction: <span style="color:${result.prediction_hybrid === 1 ? 'red' : 'green'}">${result.prediction_hybrid}</span></p>
                <p>True Label: <span style="color:${result.true_label === 1 ? 'red' : 'green'}">${result.true_label}</span></p>
                <button class="details-button">Show Details</button>
                <div class="transaction-details">
                    ${Object.entries(result.transaction).map(([key, value]) => `<p>${key}: ${value}</p>`).join('')}
                </div>
            `;
            transactionDiv.addEventListener('click', function () {
                const details = this.querySelector('.transaction-details');
                details.style.display = details.style.display === 'none' ? 'block' : 'none';
            });
            resultDiv.appendChild(transactionDiv);
        }
    }, 1000);
});

document.getElementById('stopSimulation').addEventListener('click', function () {
    clearInterval(simulationInterval);
    document.getElementById('startSimulation').disabled = false;
    document.getElementById('stopSimulation').disabled = true;
});

// Show the extension container
document.getElementById('extension-container').style.display = 'block';
