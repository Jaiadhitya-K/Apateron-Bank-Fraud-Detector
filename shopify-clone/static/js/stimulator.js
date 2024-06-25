const container = document.getElementById('extension-container');

function updateFileName(input) {
    const filenameDisplay = document.getElementById('filenameDisplay');
    const filename = input.files[0].name;
    filenameDisplay.innerHTML = `<i class="fa fa-paperclip"></i> ${filename}`;
}

document.getElementById('uploadForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        if (response.ok) {
            document.getElementById('startSimulation').disabled = false;
            alert(result.message);
        } else {
            alert(result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while uploading the file.');
    }
});

document.getElementById('startSimulation').addEventListener('click', async function () {
    const durationHours = parseFloat(prompt("Enter simulation duration in hours:", "1"));
    if (isNaN(durationHours) || durationHours <= 0) {
        alert("Invalid duration");
        return;
    }
    
    try {
        const response = await fetch('/simulate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ duration_hours: durationHours })
        });
        const result = await response.json();
        if (response.ok) {
            updateButtonStates('start');
        } else {
            alert(result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while starting the simulation.');
    }
});

document.getElementById('pauseSimulation').addEventListener('click', async function () {
    try {
        const response = await fetch('/pause', {
            method: 'POST'
        });
        const result = await response.json();
        if (response.ok) {
            updateButtonStates('pause');
            alert(result.message);
        } else {
            alert(result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while pausing the simulation.');
    }
});

document.getElementById('resumeSimulation').addEventListener('click', async function () {
    try {
        const response = await fetch('/resume', {
            method: 'POST'
        });
        const result = await response.json();
        if (response.ok) {
            updateButtonStates('resume');
            alert(result.message);
        } else {
            alert(result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while resuming the simulation.');
    }
});

document.getElementById('stopSimulation').addEventListener('click', async function () {
    try {
        const response = await fetch('/stop', {
            method: 'POST'
        });
        const result = await response.json();
        if (response.ok) {
            updateButtonStates('stop');
            alert(result.message);
        } else {
            alert(result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while stopping the simulation.');
    }
});

function updateButtonStates(action) {
    const startBtn = document.getElementById('startSimulation');
    const pauseBtn = document.getElementById('pauseSimulation');
    const resumeBtn = document.getElementById('resumeSimulation');
    const stopBtn = document.getElementById('stopSimulation');

    switch(action) {
        case 'start':
            startBtn.style.backgroundColor = 'green';
            pauseBtn.style.backgroundColor = '';
            resumeBtn.style.backgroundColor = '';
            stopBtn.style.backgroundColor = 'red';

            startBtn.disabled = true;
            pauseBtn.disabled = false;
            resumeBtn.disabled = true;
            stopBtn.disabled = false;
            break;
        case 'pause':
            startBtn.style.backgroundColor = '';
            pauseBtn.style.backgroundColor = 'yellow';
            resumeBtn.style.backgroundColor = 'green';
            stopBtn.style.backgroundColor = 'red';

            startBtn.disabled = true;
            pauseBtn.disabled = true;
            resumeBtn.disabled = false;
            stopBtn.disabled = false;
            break;
        case 'resume':
            startBtn.style.backgroundColor = '';
            pauseBtn.style.backgroundColor = '';
            resumeBtn.style.backgroundColor = '';
            stopBtn.style.backgroundColor = 'red';

            startBtn.disabled = true;
            pauseBtn.disabled = false;
            resumeBtn.disabled = true;
            stopBtn.disabled = false;
            break;
        case 'stop':
            startBtn.style.backgroundColor = '';
            pauseBtn.style.backgroundColor = '';
            resumeBtn.style.backgroundColor = '';
            stopBtn.style.backgroundColor = '';

            startBtn.disabled = false;
            pauseBtn.disabled = true;
            resumeBtn.disabled = true;
            stopBtn.disabled = true;
            break;
    }
}

// Check and set button states on page load based on simulation state
fetch('/get_simulation_state')
    .then(response => response.json())
    .then(state => {
        if (state.running && !state.paused) {
            updateButtonStates('start');
        } else if (state.running && state.paused) {
            updateButtonStates('pause');
        } else {
            updateButtonStates('stop');
        }
    })
    .catch(error => console.error('Error fetching simulation state:', error));

// Show the extension container
document.getElementById('extension-container').style.display = 'block';
