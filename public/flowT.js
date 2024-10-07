import canvas from './canvas.js'

window.addEventListener('load', function () {
    window.scrollTo(document.body.clientWidth * 1 / 3, document.body.clientHeight * 1 / 3);
});

var activebody = document.getElementById("activebody");

// create these elements for each terminal to store data, and put them in
// if already exists? update
function terminal_custom_data_saver(term, termDiv, lastCommand) {
    termDiv.setAttribute('fontSize', term.options.fontSize);
    termDiv.setAttribute('lastCommand', lastCommand);
    document.body.setAttribute('activeTerms', document.getElementById("activeTerms").innerText);
}

// data retrival
function terminal_custom_data_retriver(termDiv) {
    const fontSize = termDiv.getAttribute('fontsize');
    const lastCommand = termDiv.getAttribute('lastCommand')
    return { fontSize, lastCommand }
}

// make something draggable ?
// what about element & target ??
// for examle, you can drag a terminal from terminal header
// but not from terminal body, so,
// elements is header, when you drag the header, it 
// moves the whole terminal.
// to drag something normally, make element and target
// just the same
function makeDraggable(element, target) {
    const body = document.body.style;
    const centerX = body.width / 2;
    const centerY = body.height / 2;

    let isDragging = false;
    let offsetX, offsetY;

    element.addEventListener('pointerdown', (event) => {
        isDragging = true;
        offsetX = event.clientX - element.getBoundingClientRect().left;
        offsetY = event.clientY - element.getBoundingClientRect().top;

        // Set capture to track pointer events
        element.setPointerCapture(event.pointerId);
    });

    element.addEventListener('pointermove', (event) => {
        if (!isDragging || !event.target) return;

        // Calculate new position
        const newX = event.clientX - offsetX + window.scrollX;
        const newY = event.clientY - offsetY + window.scrollY;

        // Update element position
        target.style.left = `${newX}px`;
        target.style.top = `${newY}px`;

        const div = target.children[0]
        if (div.hasAttribute('parent')) {
            // Get the center coordinates of both elements
            const start = canvas.getCenterCoordinates(div.getAttribute('parent'), true);
            const end = canvas.getCenterCoordinates(div, false);

            // Draw a line between the centers of X and Y
            canvas.drawLine(start, end, div.getAttribute('parent'), div.id);
        }
        if (div.hasAttribute('child')) {
            // Get the center coordinates of both elements
            const start = canvas.getCenterCoordinates(div.getAttribute('child'));
            const end = canvas.getCenterCoordinates(div, true);

            // Draw a line between the centers of X and Y
            canvas.drawLine(end, start, div.id, div.getAttribute('child'));
        }

    });

    element.addEventListener('pointerup', () => {
        isDragging = false;
    });

    element.addEventListener('pointercancel', () => {
        isDragging = false;
    });

}

// SPAWN A TERMINAL!
const spawnButton = document.getElementById('spawn-button');
// window.terminals = {}; // Store terminals by ID
if (!document.getElementsByClassName('_terminal'))
    var terminalCount = 0; // Count of terminals
else
    var terminalCount = document.body.getAttribute('activeTerms');

spawnButton.addEventListener('click', () => {
    const terminalId = terminalCount++;
    document.body.setAttribute('activeTerms', terminalCount);
    document.getElementById("activeTerms").innerText = Number(document.getElementById("activeTerms").innerText) + 1;
    createTerminal(terminalId);
});

// variable for stacking terminals!
let clicks_counter = 0;

// make a new terminal ?? note, use shell full path please ^u^
// if there's existing_term_div, ignores id
function createTerminal(id = -1, shell = "/usr/bin/zsh", existing_term_Div = null) {
    if (existing_term_Div == null) {
        var terminalDiv = document.createElement('div');
        terminalDiv.className = '_terminal';
        // terminalDiv.style.left = Number(Number(window.scrollX) + Number(Math.random() * 600)) + "px"; // Random initial position
        // terminalDiv.style.top = Number(Number(window.scrollY) + Number(Math.random() * 400)) + "px"; // Random initial position
        terminalDiv.id = "termDiv" + id;
        terminalDiv.setAttribute('termID', id);



        var terminalHeader = document.createElement('div');
        terminalHeader.className = 'terminal-header';
        terminalHeader.id = "termHead" + id;
        terminalHeader.textContent = `Terminal ${id}`;
        terminalHeader.contentEditable = false;
        terminalHeader.style.display = "flex";
        terminalHeader.style.justifyContent = "space-between";
        terminalHeader.style.paddingRight = "10px";
        terminalHeader.addEventListener('click', () => {
            terminalHeader.contentEditable = true;
        })
        terminalHeader.addEventListener('focusout', () => {
            terminalHeader.contentEditable = false;
        })
        // terminalHeader.style.paddingleft = "5px";

        var order = document.createElement('div');
        order.className = 'group_order';
        order.textContent = 'MANUAL';
        order.style.display = "inline-block";
        order.contentEditable = true;
        order.style.position = "right: 20px";
        order.addEventListener('click', () => {
            order.contentEditable = true;
        })
        order.addEventListener('focusout', () => {
            order.contentEditable = false;
        })
        terminalHeader.appendChild(order);

        var terminalBody = document.createElement('div');
        terminalBody.className = 'terminal-body';
        terminalBody.id = "termBody" + id;

        terminalDiv.appendChild(terminalHeader);
        terminalDiv.appendChild(terminalBody);
        var container = document.createElement('div');
        container.className = "container";
        container.appendChild(terminalDiv)
        container.style.left = Number(Number(window.scrollX) + Number(Math.random() * 600)) + "px"; // Random initial position
        container.style.top = Number(Number(window.scrollY) + Number(Math.random() * 400)) + "px"; // Random initial position
        activebody.appendChild(container);

        terminalDiv.style.width = '800px';
        terminalDiv.style.height = '450px';
        terminalDiv.style.scale = 1;

        canvas.add_lineBall_to(container);
    }
    else {
        var terminalDiv = existing_term_Div;
        var terminalHeader = existing_term_Div.querySelector('.terminal-header');
        terminalHeader.addEventListener('click', () => {
            terminalHeader.contentEditable = true;
        })
        terminalHeader.addEventListener('focusout', () => {
            terminalHeader.contentEditable = false;
        })

        id = terminalDiv.getAttribute('termID');

        // var terminalBody = existing_term_Div.querySelector('.terminal-body');

        existing_term_Div.querySelector('.terminal-body').remove();

        // create a new body please
        var terminalBody = document.createElement('div');
        terminalBody.className = 'terminal-body';
        terminalBody.id = "termBody" + id;

        terminalDiv.appendChild(terminalBody)
        //

        var terminalDiv = existing_term_Div;
        var order = existing_term_Div.querySelector('group_order');
        var { fontSize, lastCommand } = terminal_custom_data_retriver(terminalDiv);
    }

    var term = new Terminal({
        cursorBlink: true,
        scrollback: 1000,
        fontFamily: 'JetBrainsMonoNerdFont',
        // rows: 10,
        // cols: 50,
    });

    // stack this terminal over the previous ones
    clicks_counter++;
    terminalDiv.style.zIndex = clicks_counter;

    // Make the terminal draggable
    makeDraggable(terminalHeader, container);

    // allow dragging into
    terminalDiv.addEventListener('dragover', (event) => {
        event.preventDefault();
        // console.log("allow dragging into");
    });

    terminalDiv.addEventListener('drop', (event) => {
        event.preventDefault();
        if (window.dragSourceT.className === "_terminal") {
            console.log("dragSourceT:" + window.dragSourceT.id);
            console.log("dragSourceB:" + window.dragSourceB.id);
            // now you follow someone!
            // terminalDiv is parent
            // window.dragSourceT
            terminalDiv.setAttribute("parent", window.dragSourceT.id);
            window.dragSourceT.setAttribute("child", terminalDiv.id);

            // Get the center coordinates of both elements
            const start = canvas.getCenterCoordinates(terminalDiv.getAttribute('parent'), true);
            const end = canvas.getCenterCoordinates(terminalDiv);

            // Draw a line between the centers of X and Y
            canvas.drawLine(start, end, window.dragSourceT.id, terminalDiv.id);

            //clear window.dragSource
            window.dragSourceT = null;
            window.dragSourceB = null
        }
    });

    // here it comes ^-^
    term.open(terminalBody);

    term.clear();

    // refresh font size to refresh font face!! weird? I know.
    setTimeout(() => {
        if (existing_term_Div)
            term.options.fontSize = fontSize;
        else {
            term.options.fontSize = 16;
            // Save
            terminal_custom_data_saver(term, terminalDiv, "");
        }
    }, 50);

    // fit fit fit
    let fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);
    fitAddon.fit();

    // Store the terminal instance
    const socket = io('http://127.0.0.1:3000', {
        rejectUnauthorized: false,
    });

    if (!existing_term_Div)
        var lastCommand = ""

    // Handle input/output as needed
    term.onData((data) => {
        socket.emit('input', data);
    });

    socket.on('output', (data) => {
        term.write(data);
    });

    // Create a new shell on the server when the terminal is created
    if (!existing_term_Div)
        socket.emit('new-terminal', shell);
    else {
        // force resize if existing term!
        resizeTerminal();
        term.clear();
        socket.emit('new-terminal', lastCommand);
    }

    // Function to resize the terminal
    function resizeTerminal() {
        fitAddon.fit();
        const new_w = term.cols;
        const new_h = term.rows;
        console.log("current size: ", id, new_w, new_h);
        terminalBody.style.width = "100%";
        terminalBody.style.height = 'calc(100% - 30px)';
        socket.emit('resize', { id, new_w, new_h });
    }

    // manage resizing! nothing is easy
    new ResizeObserver(resizeTerminal).observe(terminalDiv);
    term.onResize(({ cols, rows }) => {
        resizeTerminal();
        // Save
        terminal_custom_data_saver(term, terminalDiv, lastCommand);
    });

    socket.on('clear', (data) => {
        term.clear();
    });

    socket.on('command', (data) => {
        term.write(data.data);
        // Save
        lastCommand = data.extractedCommand;
        terminal_custom_data_saver(term, terminalDiv, lastCommand);
    });

    // Listen for exit event from the server and destroy terminal
    socket.on('exit', (data) => {
        term.dispose(); // Dispose the terminal instance
        document.getElementById('termDiv' + id).remove(); // Remove the terminal div
        document.getElementById("activeTerms").innerText = Number(document.getElementById("activeTerms").innerText) - 1;
    });


    // Function to handle scroll event
    function handleScroll(event, target) {
        var div = target;
        const scale = 0.02;
        // div.style.transformOrigin = 'top left';
        const rect = target.getBoundingClientRect();

        // Calculate mouse position relative to the box
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        if (event.deltaY > 0) {
            term.options.fontSize += 0.1;
        } else {
            term.options.fontSize -= 0.1;
        }
        // Save
        terminal_custom_data_saver(term, terminalDiv, lastCommand);
        fitAddon.fit();
    }

    // Add scroll event listener
    terminalHeader.addEventListener('wheel', function () {
        event.preventDefault(); // Prevent the default scroll behavior
        handleScroll(event, terminalDiv);
    });

    // Function to prevent page scrolling when using the mouse wheel inside the terminal
    terminalBody.addEventListener('wheel', (event) => {
        const scrollableHeight = terminalBody.scrollHeight - terminalBody.clientHeight;
        const scrollTop = terminalBody.scrollTop;

        if ((event.deltaY < 0 && scrollTop <= 0) || (event.deltaY > 0 && scrollTop >= scrollableHeight)) {
            event.preventDefault(); // Prevent default scrolling if scrollbar is at the top or bottom
        }

    });

    const body = document.body;
    // Disable body scrolling when mouse is inside the terminal
    terminalDiv.addEventListener('click', () => {
        clicks_counter += 1;
        terminalDiv.style.zIndex = clicks_counter;
    });

    // terminalDiv.addEventListener('mouseover', () => {
    //     body.classList.add('no-scroll');
    // });

    // Enable body scrolling again when mouse leaves the terminal
    // terminalDiv.addEventListener('mouseleave', () => {
    //     body.classList.remove('no-scroll');
    // });

    terminalDiv.addEventListener('wheel', (event) => {
        let currentScale = Number(document.querySelector("._terminal").style.scale);
        if (event.ctrlKey) {
            event.preventDefault();
            // Prevent the page zooming behavior

            // Detect zoom direction
            if (event.deltaY > 0) {
                // Zoom in
                currentScale = Math.min(currentScale * 1.05, 3); // Limit max scale to 3x
            } else {
                // Zoom out
                currentScale = Math.max(currentScale * 0.95, 1); // Limit min scale to 0.5x
            }
            // Apply scaling transformation
            terminalDiv.style.scale = currentScale;
        }
    });

}


////////////////
//////////////// box section
////////////////
function unescapeHTML(html) {
    // Create a temporary DOM element
    const tempDiv = document.createElement('div');

    // Set the innerHTML to the encoded HTML
    tempDiv.innerHTML = html;

    // The browser will automatically decode the HTML
    return tempDiv.textContent || tempDiv.innerText;
}

// Function to create and position a box
function createBox(x, y, htmlContent) {
    const box = document.createElement('div');
    box.classList.add('box');
    box.style.left = `${x}px`;
    box.style.top = `${y}px`;

    // Set the innerHTML to the provided HTML content
    box.innerHTML = htmlContent;
    box.contentEditable = true;

    box.addEventListener('dblclick', function (event) {
        event.preventDefault();
        box.contentEditable = true;
    });

    box.addEventListener('focusout', function (event) {
        box.contentEditable = false;
        box.innerHTML = unescapeHTML(box.innerHTML)
    });

    // Append the box to the body
    activebody.appendChild(box);
    // make the box draggable :)
    makeDraggable(box, box);
}

// Add a double-click event listener to the body to 
// create an html box
document.body.addEventListener('dblclick', function (event) {
    if (event.target !== document.body) {
        return;
    }
    // Get the mouse position and account for scroll
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // if(event.target)

    // Position the box at the exact location of the double-click
    const x = event.clientX + scrollX;
    const y = event.clientY + scrollY;

    // The HTML content to insert in the box
    const htmlContent = "I'm a box!";

    // Create the box
    createBox(x, y, htmlContent);
});



////////////////
//////////////// Body dragging section
////////////////
let isDragging = false;
let startX, startY;
let scrollLeft, scrollTop;
let lastX, lastY;
let velocityX = 0;
let velocityY = 0;
let momentumScroll = false;

document.body.style.scrollBehavior = 'smooth'; // Enable smooth scrolling behavior

document.body.addEventListener('mousedown', function (event) {
    // Check if the clicked target or its closest parent contains ._terminal or ._box
    if (!event.target.closest('._terminal') && !event.target.closest('.box') &&
        !event.target.closest('.container') && !event.target.closest('.pearl')) {
        isDragging = true;

        // Record the initial mouse position and scroll position
        startX = event.clientX;
        startY = event.clientY;
        scrollLeft = window.scrollX;
        scrollTop = window.scrollY;

        // Initialize last mouse position
        lastX = startX;
        lastY = startY;

        document.body.style.cursor = 'grabbing'; // Optional: change cursor to indicate dragging

        // Start dragging behavior
        document.body.addEventListener('mousemove', onDrag);
    }
});

document.body.addEventListener('mouseup', function () {
    if (isDragging) {
        isDragging = false;
        document.body.style.cursor = ''; // Reset cursor
        document.body.removeEventListener('mousemove', onDrag); // Stop dragging behavior

        // Start momentum effect
        momentumScroll = true;
        requestAnimationFrame(applyMomentum);
    }
});

document.body.addEventListener('mouseleave', function () {
    // Stop dragging if the mouse leaves the window (optional)
    if (isDragging) {
        isDragging = false;
        document.body.style.cursor = ''; // Reset cursor
        document.body.removeEventListener('mousemove', onDrag);
    }
});

function onDrag(event) {
    if (!isDragging) return;

    // Calculate the difference between the current mouse position and the initial one
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;

    // Calculate velocity based on mouse movement
    velocityX = event.clientX - lastX;
    velocityY = event.clientY - lastY;

    // Update last mouse position
    lastX = event.clientX;
    lastY = event.clientY;

    // Use requestAnimationFrame for smooth sliding
    window.scrollTo(scrollLeft - dx, scrollTop - dy);
}

function applyMomentum() {
    if (momentumScroll) {
        // Reduce velocity gradually for a deceleration effect
        velocityX *= 0.90; // Adjust friction (0.95 for a slower stop)
        velocityY *= 0.90;

        // Update scroll position based on velocity
        window.scrollBy(-velocityX, -velocityY);

        // Continue applying momentum until velocity drops below a threshold
        if (Math.abs(velocityX) > 0.1 || Math.abs(velocityY) > 0.1) {
            requestAnimationFrame(applyMomentum);
        } else {
            momentumScroll = false; // Stop momentum when velocity is low
        }
    }
}


// Circle growing from the center :) very useful
function createCircleEffect(element) {
    const circle = document.createElement('div');
    circle.className = 'expand-circle';

    // Position the circle over the element
    const centerX = document.body.offsetWidth / 2;
    const centerY = document.body.offsetHeight / 2;

    // Set circle's initial position
    circle.style.left = `${centerX}px`;
    circle.style.top = `${centerY}px`;
    document.body.appendChild(circle);

    // Remove the circle after 5 seconds (animation duration)
    setTimeout(() => {
        clearInterval(); // Stop checking when the animation ends
        document.body.removeChild(circle);
    }, 10000);
}
// Repeat the effect every 5 seconds
setInterval(createCircleEffect, 15000);


// save the page notes and terminals!
const saveButton = document.getElementById('save-button');
saveButton.addEventListener('click', () => {
    const htmlContent = document.documentElement.outerHTML;

    // Create a Blob with the HTML content
    const blob = new Blob([htmlContent], { type: 'text/html' });

    // Create an anchor element and set it up for downloading the file
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'webpage' + document.getElementById("project-name").textContent + '.html'; // The filename you want to save it as

    // Trigger the download by simulating a click
    // document.body.appendChild(link);
    link.click();

    // Clean up by removing the link element
    // document.body.removeChild(link);

});


// on load check if terminals already exist to know if it's
// an automation task
window.onload = function () {
    const terminalsDiv = document.getElementsByClassName('_terminal');
    if (terminalsDiv) { // automation mode activated ! 

        for (const terminalDiv of terminalsDiv) {
            createTerminal(-1, "meow", terminalDiv);
        }

    }
}