let pearl = `.pearl {
    width: 30px;
    height: 30px;
    background: radial-gradient(circle at 35% 35%, white 20%, #f2f2f2 50%, #e0e0e0 80%, #c0c0c0 100%);
    border-radius: 50%;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.2), inset 0 0 10px rgba(255, 255, 255, 0.8);
    /* margin: 50px auto; */
    right: 50px;
    top: 50%;
    /* position: absolute; */
    transform: translateY(-50%);
    justify-content: center;
    align-items: center;
    z-index: 20;
}
    
.line {
    position: absolute;
    background-color: red;
    height: 2px;
    transform-origin: 0 0; /* Set rotation origin */
    z-index: -2000000;
}`

window.lines = {};

const style = document.createElement('style');
// Append the CSS rules to the <style> element
style.appendChild(document.createTextNode(pearl));
// Append the <style> element to the <head> of the document
document.head.appendChild(style);

function generate_lineBall() {
    const ball = document.createElement('div');
    ball.draggable = true;
    ball.className = "pearl";
    ball.id = "pearl"
    return ball;
}

function add_lineBall_to(container) {
    const ball = generate_lineBall();
    container.appendChild(ball);

    // When dragging starts on element X
    ball.addEventListener('pointerdown', (event) => {
        window.dragSourceT = container.getElementsByClassName('_terminal')[0];
        window.dragSourceB = ball;
        // event.dataTransfer.effectAllowed = 'move';
        console.log("dragSourceT:" + dragSourceT.id);
        console.log("dragSourceB:" + dragSourceB.id);
        ball.style.background = "radial-gradient(circle at 35% 35%, white 20%, #f22222 50%, #e0e0e0 80%, #c0c0c0 100%)"
    });

    ball.addEventListener('mouseenter', (e) => {
        ball.style.background = "radial-gradient(circle at 35% 35%, white 20%, #2222f2 50%, #e0e0e0 80%, #c0c0c0 100%)"
    });

    ball.addEventListener('mouseleave', (e) => {
        ball.style.background = "radial-gradient(circle at 35% 35%, white 20%, #f2f2f2 50%, #e0e0e0 80%, #c0c0c0 100%)"
    });



}


// Function to get the center coordinates of an element, accounting for scroll
// element is terminalDiv
function getCenterCoordinates(element, get_pearl = false) {
    if (!(element instanceof HTMLElement)) {
        element = document.getElementById(element);
    }
    if (get_pearl)
        element = element.closest('.container').children.pearl;
    const rect = element.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2 + window.scrollX, // Add horizontal scroll offset
        y: rect.top + rect.height / 2 + window.scrollY   // Add vertical scroll offset
    };
}

// Function to create and position a line between two points
function drawLine(start, end, parent_id, child_id) {
    const length = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
    const angle = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI);
    let line;
    const id = parent_id + '>' + child_id;

    if (!lines[id]) {
        line = document.createElement('div');
        line.classList.add('line');
        lines[id] = line;
        document.body.appendChild(line);
    }
    else
        line = lines[id];

    // Set the position, length, and rotation of the line
    line.style.width = length + 'px';
    line.style.top = start.y + 'px';
    line.style.left = start.x + 'px';
    line.style.transform = `rotate(${angle}deg)`;
}

function refresh_lines() {
    document.querySelectorAll('._terminal').forEach(t => {
        if (t.hasAttribute('child')) {
            // Get the center coordinates of both elements
            const start = getCenterCoordinates(t, true);
            const child = document.getElementById(t.getAttribute('child'));
            const end = getCenterCoordinates(child);

            // Draw a line between the centers of X and Y
            drawLine(start, end, t.id, child.id);
            // add_lineBall_to(t.closest('.container'));
        }
    });
}


function destroy_lines() {
    document.querySelectorAll('.line').forEach(t => {
        document.body.removeChild(t);
    });
    lines = {};
}



// /* Style for the dragball */
// .dragball {
//     width: 30px;
//     height: 30px;
//     background-color: silver;
//     border-radius: 50%;
//     position: absolute;
//     top: 50%; /* Vertically center the ball */
//     left: -40px; /* Position it 10px to the left of the parent */
//     transform: translateY(-50%); /* Adjust for center alignment */
//     cursor: pointer;
// }

/*
const elementX = document.getElementById('elementX');
const elementY = document.getElementById('elementY');
let dragSource = null;
let line = null;

// Function to get the center coordinates of an element, accounting for scroll
function getCenterCoordinates(element) {
    const rect = element.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2 + window.pageXOffset, // Add horizontal scroll offset
        y: rect.top + rect.height / 2 + window.pageYOffset   // Add vertical scroll offset
    };
}

// Function to create and position a line between two points
function drawLine(start, end) {
    const length = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
    const angle = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI);

    // Create or update the line
    if (!line) {
        line = document.createElement('div');
        line.classList.add('line');
        document.body.appendChild(line);
    }

    // Set the position, length, and rotation of the line
    line.style.width = length + 'px';
    line.style.top = start.y + 'px';
    line.style.left = start.x + 'px';
    line.style.transform = `rotate(${angle}deg)`;
}

// When dragging starts on element X
elementX.addEventListener('dragstart', (event) => {
    dragSource = event.target;
    event.dataTransfer.effectAllowed = 'move';
});

// When dragging over element Y (to allow drop)
elementY.addEventListener('dragover', (event) => {
    event.preventDefault();
});

// When the drag ends on element Y (drop occurs)
elementY.addEventListener('drop', (event) => {
    event.preventDefault();
    if (dragSource === elementX) {
        console.log('Drag occurred from X to Y');
        alert('Drag occurred from X to Y');

        // Get the center coordinates of both elements
        const start = getCenterCoordinates(elementX);
        const end = getCenterCoordinates(elementY);

        // Draw a line between the centers of X and Y
        drawLine(start, end);
    }
});

*/

export default { add_lineBall_to, getCenterCoordinates, drawLine, refresh_lines, destroy_lines };