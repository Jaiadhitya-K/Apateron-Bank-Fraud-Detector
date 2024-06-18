const container = document.getElementById('extension-container');

let offsetX, offsetY, isDragging = false;

// Event listener for when the user presses the mouse button on the container
container.addEventListener('mousedown', function(e) {
    isDragging = true;

    // Calculate the offset between the mouse pointer and the container's top-left corner
    offsetX = e.clientX - container.getBoundingClientRect().left;
    offsetY = e.clientY - container.getBoundingClientRect().top;

    // Set the container's position to 'absolute' to enable dragging
    container.style.position = 'absolute';

    // Move the container to the initial mouse position
    moveAt(e.pageX, e.pageY);

    // Prevent text selection during drag
    e.preventDefault();

    // Event listener for when the mouse moves
    document.addEventListener('mousemove', onMouseMove);
});

// Event listener for when the user releases the mouse button
document.addEventListener('mouseup', function() {
    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
});

// Function to handle mouse movement
function onMouseMove(e) {
    if (isDragging) {
        moveAt(e.pageX, e.pageY);
    }
}

// Function to move the container to the given coordinates
function moveAt(pageX, pageY) {
    container.style.left = pageX - offsetX + 'px';
    container.style.top = pageY - offsetY + 'px';
}

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
    try {
        const response = await fetch('/simulate', {
            method: 'GET'
        });
        const result = await response.json();
        if (response.ok) {
            document.getElementById('startSimulation').disabled = true;
            document.getElementById('stopSimulation').disabled = false;
            startFetchingTransactions();
        } else {
            alert(result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while starting the simulation.');
    }
});

document.getElementById('stopSimulation').addEventListener('click', function () {
    stopFetchingTransactions();
    document.getElementById('startSimulation').disabled = false;
    document.getElementById('stopSimulation').disabled = true;
    alert('Simulation stopped.');
});



// Show the extension container
document.getElementById('extension-container').style.display = 'block';
