import canvas from './canvas.js'
import orderbox from './order.js';
import { Unicode11Addon } from 'xterm-addon-unicode11';
import { Terminal } from 'xterm';
import { createTextBox, createCustomBox, makeDraggable, resize_handlers, rightClick_handler, focusOut_handler } from './box.js';
import { handlePasteImages } from './imagePasteHandler.js'; // Adjust the path as necessary
import { marked } from 'marked';
import { terminal_editor as terminal_editor_support } from './terminal_editor.js'
// windows.new_changes = false;

const terminal_is_done = new CustomEvent('parentisdone');

window.var = null;

window.addEventListener('load', function () {
    window.scrollTo(document.body.clientWidth * 1 / 3, document.body.clientHeight * 1 / 3);
});

var activebody = document.getElementById("activebody");

// create these elements for each terminal to store data, and put them in
// if already exists? update
function terminal_custom_data_saver(term, termDiv, lastCommand) {
    termDiv.setAttribute('fontSize', term.options.fontSize);
    lastCommand = lastCommand.trim();
    if (lastCommand != "$1" && lastCommand != "" && lastCommand != "null") {
        if (termDiv.hasAttribute('lastCommand'))
            termDiv.setAttribute('lastCommand', termDiv.getAttribute('lastCommand') + "]_[" + lastCommand);
        else
            termDiv.setAttribute('lastCommand', lastCommand);
    }
    document.body.setAttribute('activeTerms', document.getElementById("activeTerms").innerText);
    // windows.new_changes = true;
}

// data retrival
function terminal_custom_data_retriver(termDiv) {
    const fontSize = termDiv.getAttribute('fontsize');
    if (termDiv.hasAttribute('lastCommand')) {
        var lastCommand = termDiv.getAttribute('lastCommand')
    }
    else {
        var lastCommand = "";
    }
    return { fontSize, lastCommand }
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
    prepareTerminalElement(terminalId);
    // windows.new_changes = true;
});

// variable for stacking terminals!

export function createTerminal(id, terminalDiv, terminalBody, terminalHeader, shell = "/usr/bin/zsh", existing_term_Div, history = false) {
    terminalBody.innerHTML = "";
    var term = new Terminal({
        cursorBlink: true,
        scrollback: 1000,
        fontFamily: 'JetBrainsMonoNerdFont',
        // rows: 10,
        // cols: 50,
        convertEol: true,
        allowProposedApi: true, // Enable proposed API
        theme: {
            background: '#220917'
        }
    });
    const unicode11Addon = new Unicode11Addon();
    term.loadAddon(unicode11Addon);
    term.unicode.activeVersion = '11';

    // here it comes ^-^
    term.open(terminalBody);

    term.clear();


    // refresh font size to refresh font face!! weird? I know.
    setTimeout(() => {
        if (existing_term_Div)
            term.options.fontSize = terminalDiv.getAttribute('fontsize');
        else {
            term.options.fontSize = 16;
            // Save
            terminal_custom_data_saver(term, terminalDiv, "");
        }
    }, 400);

    // fit fit fit
    let fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);
    fitAddon.fit();

    // Store the terminal instance
    const socket = io('http://127.0.0.1:3000', {
        rejectUnauthorized: false,
    });

    // Handle input/output as needed
    term.onData((data) => {
        socket.emit('input', data);
        // windows.new_changes = true;
    });

    socket.on('output', (data) => {
        term.write(data);
        fitAddon.fit();
        terminalDiv.setAttribute('history', terminalDiv.getAttribute('history') + data);
        // windows.new_changes = true;
    });

    // Create a new shell on the server when the terminal is created
    if (!existing_term_Div) {
        socket.emit('new-terminal', shell);
    }
    else if (history) {
        // no terminals
        resizeTerminal();
        term.clear();
    }
    else {
        // force resize if existing term!
        resizeTerminal();
        term.clear();
        socket.emit('new-terminal', shell);
    }

    // Function to resize the terminal
    function resizeTerminal() {
        fitAddon.fit();
        const new_w = term.cols;
        const new_h = term.rows;
        // console.log("current size: ", id, new_w, new_h);
        terminalBody.style.width = "100%";
        terminalBody.style.height = 'calc(100% - 30px)';
        socket.emit('resize', { id, new_w, new_h });

        const div = terminalDiv;
        if (div.hasAttribute('parent')) {
            // Get the center coordinates of both elements
            const start = canvas.getCenterCoordinates(div.getAttribute('parent'), true);
            const end = canvas.getCenterCoordinates(div, false);

            // Draw a line between the centers of X and Y
            canvas.drawLine(start, end, div.getAttribute('parent'), div.id);
        }
        if (div.hasAttribute('child')) {
            div.getAttribute('child').split(']_[').forEach(child => {
                // Get the center coordinates of both elements
                const start = canvas.getCenterCoordinates(child);
                const end = canvas.getCenterCoordinates(div, true);

                // Draw a line between the centers of X and Y
                canvas.drawLine(end, start, div.id, child);
            });
        }

        // windows.new_changes = true;
    }

    // manage resizing! nothing is easy
    new ResizeObserver(resizeTerminal).observe(terminalDiv);
    term.onResize(({ cols, rows }) => {
        resizeTerminal();
        // Save
        terminal_custom_data_saver(term, terminalDiv, "");
    });

    socket.on('clear', () => {
        term.clear();
        term.reset();
        terminalDiv.setAttribute('history', "");
    });

    socket.on('envVarResponse', ({ varName, value }) => {
        // term.write(`Environment Variable ${varName}: ${value}\r\n`);
        window.var = value;
    });

    var lastCommand;

    socket.on('command', (data) => {
        // lastCommand = "";
        // // Save
        if (!['OK', 'ERR', '$1', 'null'].includes(data.extractedCommand.trim()))
            lastCommand = data.extractedCommand.trim();
        // terminal_custom_data_saver(term, terminalDiv, lastCommand);
    });

    // Listen for exit event from the server and destroy terminal
    socket.on('exit', () => {
        term.dispose(); // Dispose the terminal instance
        document.body.children.activebody.removeChild(terminalDiv.closest('.container')); // Remove the terminal div
        document.getElementById("activeTerms").innerText = Number(document.getElementById("activeTerms").innerText) - 1;
        socket.disconnect();
        // windows.new_changes = true;
    });

    socket.on('OK', () => {
        // Save
        terminal_custom_data_saver(term, terminalDiv, lastCommand);
        // term.write('rec ');
    });

    socket.on('ERR', () => {
        term.write("#FlowT won't save this command!");
        term.write(String.fromCharCode(13));
        // term.write("rec ");
    });

    socket.on('ALERT', () => {
        terminalDiv.dispatchEvent(terminal_is_done);
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
        terminal_custom_data_saver(term, terminalDiv, "");
        fitAddon.fit();
    }

    // Add scroll event listener
    terminalHeader.addEventListener('wheel', function (event) {
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
    // stacking!
    terminalDiv.addEventListener('click', () => {
        window.clicks_counter += 1;
        terminalDiv.style.zIndex = window.clicks_counter;
        // windows.new_changes = true;
    });

    terminalDiv.addEventListener('wheel', (event) => {
        let currentScale = Number(document.querySelector("._terminal").style.scale);
        if (event.ctrlKey) {
            event.preventDefault();
            // Prevent the page zooming behavior

            // Detect zoom direction
            if (event.deltaY > 0) {
                // Zoom in
                currentScale = Math.min(currentScale * 1.01, 3); // Limit max scale to 3x
            } else {
                // Zoom out
                currentScale = Math.max(currentScale * 0.99, 1); // Limit min scale to 0.5x
            }
            // Apply scaling transformation
            terminalDiv.style.scale = currentScale;
            // windows.new_changes = true;
        }
    });

    terminal_editor_support(term, id, terminalDiv, terminalBody, terminalHeader, shell = "/usr/bin/zsh", existing_term_Div, history = false);

    return { term, socket };
}

// make a new terminal ?? note, use shell full path please ^u^
// if there's existing_term_div, ignores id
export function prepareTerminalElement(id = -1, shell = "/usr/bin/zsh", existing_term_Div = null) {
    if (!existing_term_Div) {
        var terminalDiv = document.createElement('div');
        terminalDiv.className = '_terminal';
        // terminalDiv.style.left = Number(Number(window.scrollX) + Number(Math.random() * 600)) + "px"; // Random initial position
        // terminalDiv.style.top = Number(Number(window.scrollY) + Number(Math.random() * 400)) + "px"; // Random initial position
        terminalDiv.id = "termDiv" + id;
        terminalDiv.setAttribute('termID', id);
        terminalDiv.setAttribute('history', '');


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

        var new_orderbox = orderbox.create_orderbox(id);
        terminalHeader.appendChild(new_orderbox);
        terminalHeader.setAttribute('order', 0);

        var terminalBody = document.createElement('div');
        terminalBody.className = 'terminal-body';
        terminalBody.id = "termBody" + id;

        terminalDiv.appendChild(terminalHeader);
        terminalDiv.appendChild(terminalBody);
        var container = document.createElement('div');
        container.className = "container";
        container.appendChild(terminalDiv)
        container.style.left = Number(Number(window.scrollX) + Number(Math.random() * 1000)) + "px"; // Random initial position
        container.style.top = Number(Number(window.scrollY) + Number(Math.random() * 500)) + "px"; // Random initial position
        activebody.appendChild(container);

        terminalDiv.style.width = '500px';
        terminalDiv.style.height = '450px';
        terminalDiv.style.scale = 1;

        canvas.add_new_ball_to(container);
        // windows.new_changes = true;
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

        var container = terminalDiv.closest('.container');

        var terminalDiv = existing_term_Div;
        var new_orderbox = terminalHeader.querySelector('#order' + id);
        new_orderbox.selectedIndex = terminalHeader.getAttribute('order');
        var { fontSize, lastCommand } = terminal_custom_data_retriver(terminalDiv);
    }


    // stack this terminal over the previous ones
    window.clicks_counter++;
    terminalDiv.style.zIndex = window.clicks_counter;

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
            // console.log("dragSourceT:" + window.dragSourceT.id);
            // console.log("dragSourceB:" + window.dragSourceB.id);
            // windows.new_changes = true;
            // now you follow someone!
            // terminalDiv is parent
            // window.dragSourceT
            terminalDiv.setAttribute("parent", window.dragSourceT.id);
            if (window.dragSourceT.hasAttribute('child')) {
                window.dragSourceT.setAttribute('child', window.dragSourceT.getAttribute('child') + ']_[' + terminalDiv.id);
            } else {
                window.dragSourceT.setAttribute('child', terminalDiv.id);
            }

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

    // Add an event listener for the 'change' event
    new_orderbox.addEventListener('change', function () {
        // Get the selected option text
        terminalHeader.setAttribute('order', new_orderbox.selectedIndex);
        ordering();
    });

    // only for testing
    // terminalDiv.setAttribute('lastCommand', 'echo hi]_[echo bye]_[nyancat');
    if (terminalDiv.hasAttribute("lastCommand")) {
        terminalBody.innerHTML = '<br>* ' + terminalDiv.getAttribute("lastCommand").replaceAll("]_[", '<br>* ');
    }
    terminalBody.style.fontSize = "22px";

    function ordering() {

        var term, socket;

        function ct() {
            var { term, socket } = createTerminal(id, terminalDiv, terminalBody, terminalHeader, shell, existing_term_Div);
            terminalDiv.removeEventListener('dblclick', ct);
            setTimeout(() => {
                autoexec(term, socket, terminalDiv, 0, 0, terminalDiv.getAttribute('lastCommand'));
            }, 2000);
        }

        if (new_orderbox.selectedIndex == 0) { // Manual
            if (existing_term_Div) {
                terminalDiv.addEventListener('dblclick', ct);
            }
            else {
                var { term, socket } = createTerminal(id, terminalDiv, terminalBody, terminalHeader, shell, existing_term_Div);
                if (existing_term_Div) {
                    setTimeout(() => {
                        autoexec(term, socket, terminalDiv, 0, 0, terminalDiv.getAttribute('lastCommand'));
                    }, 2000);
                }
            }
        }
        else if (new_orderbox.selectedIndex == 2) { // on previous success
            // Add the event listener
            document.getElementById(terminalDiv.getAttribute('parent')).addEventListener('parentisdone', (event) => {
                var { term, socket } = createTerminal(id, terminalDiv, terminalBody, terminalHeader, shell, existing_term_Div);
                setTimeout(() => {
                    autoexec(term, socket, terminalDiv, 2, 0, terminalDiv.getAttribute('lastCommand'));
                }, 2000);
            });
        }
        else if (new_orderbox.selectedIndex == 1) { // startup
            var { term, socket } = createTerminal(id, terminalDiv, terminalBody, terminalHeader, shell, existing_term_Div);
            setTimeout(() => {
                autoexec(term, socket, terminalDiv, 1, 0, terminalDiv.getAttribute('lastCommand'));
            }, 2000);
        }
        else if (new_orderbox.selectedIndex == 3) { // History
            var { term, socket } = createTerminal(id, terminalDiv, terminalBody, terminalHeader, shell, existing_term_Div, true);
            term.write(terminalDiv.getAttribute('history'));
            // term.write('# this is read only terminal!!');
        }
        // document.body.appendChild(document.body.createElement('div'));
    }
    ordering();
    
}

function autoexec(term, sock, terminalDiv, type, turn, original_commands) {
    if (!original_commands) return;
    if (original_commands.split(']_[').length <= turn) {
        try {
            sock.off('OK', run);
        } catch {

        }
        terminalDiv.setAttribute('lastCommand', original_commands);
        terminalDiv.dispatchEvent(terminal_is_done);  // Dispatch the event for the terminalDiv
        return;
    }

    var command = original_commands.split(']_[')[turn];
    var time = 2; //seconds

    var regex = /^(\d+)>(.+)$/;
    const timed_command_regex_match = command.match(regex);
    if (timed_command_regex_match) {
        time = timed_command_regex_match[1];  // Capture group 1 (the number)
        command = timed_command_regex_match[2];  // Capture group 2 (the command)
    }

    if (timed_command_regex_match) {
        regex = /\$([a-zA-Z_][a-zA-Z0-9_]*)/g;
        var match;
        var varName;
        match = command.match(regex)
        if (match) {
            varName = match[0]; // Extract variable name (without the $)
            sock.emit('getEnvVar', varName);
            setTimeout(() => {
                command = command.replace(varName, window.var);
                window.var = null;
                execution(command);
            }, 500);
        }
        else { execution(command); }
    }
    else {
        execution(command);
    }

    function execution(command) {
        if (type >= 1) {
            // term.write('r ' + command + '\n');
            if (timed_command_regex_match)
                sock.emit('input', command + '\n');
            else
                sock.emit('input', 'r ' + command + '\n');
        }
        else {
            // term.write('r ' + command);
            if (timed_command_regex_match)
                sock.emit('input', command);
            else
                sock.emit('input', 'r ' + command);
        }
        function run() {
            sock.off('OK', run);
            setTimeout(() => { autoexec(term, sock, terminalDiv, type, turn + 1, original_commands); }, time * 1000);
        }

        if (timed_command_regex_match) { //dont wait for ok
            run();
        } else {
            sock.on('OK', run);
        }
    }
}


////////////////             /////////////////
//////////////// box section /////////////////
////////////////             /////////////////

function unescapeHTML(html) {
    // Create a temporary DOM element
    const tempDiv = document.createElement('div');

    // Set the innerHTML to the encoded HTML
    tempDiv.innerHTML = html;

    // The browser will automatically decode the HTML
    return tempDiv.textContent || tempDiv.innerText;
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
    const text = "I'm a box!";

    // Create the box
    createTextBox(x, y, text);
});

document.body.addEventListener('mousedown', function (event) {
    // Check if the middle mouse button (scroll wheel) was clicked
    if (event.button === 1) {
        event.preventDefault();
        // Position the box at the exact location of the middle-click
        const x = event.clientX + window.scrollX;
        const y = event.clientY + window.scrollY;

        // The HTML content to insert in the box
        const text = "<div>I'm a box!</div>";

        // Create the box
        createCustomBox(x, y, text);
    }
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
    if (event.target == document.body) {
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
    // destroy lines temporarly
    canvas.destroy_lines();

    const htmlContent = document.documentElement.outerHTML;

    // Create a Blob with the HTML content
    const blob = new Blob([htmlContent], { type: 'text/html' });

    // restore lines
    canvas.refresh_lines();

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
            prepareTerminalElement(terminalDiv.getAttribute("termid"), "/usr/bin/zsh", terminalDiv);

            const container = terminalDiv.parentElement;
            const ball = container.children.pearl

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
    }
    canvas.refresh_lines();


    const resizeables = document.getElementsByClassName('resizable');
    for (let box of resizeables) {
        resize_handlers(box);
        let cont = box.parentElement;
        makeDraggable(cont.children[0], cont);
        cont.addEventListener('contextmenu', rightClick_handler);
        cont.addEventListener('focusout', focusOut_handler);
    }

}


window.addEventListener('beforeunload', function (event) {
    event.preventDefault();

    // Set a confirmation message (this may not be displayed in some browsers)
    const confirmationMessage = "leaving or refreshing?? unsaved projects will be lost.";

    // For most browsers, this is required to show a confirmation dialog
    event.returnValue = confirmationMessage; // This is required for older browsers

    // In some modern browsers, returning a string will show a generic confirmation dialog
    return confirmationMessage;
});

let protocol = window.location.protocol;

if (protocol === 'file:') {
    document.body.style.backgroundColor = "gray";
} else if (protocol === 'http:' || protocol === 'https:') {
    // console.log("The page is opened over HTTP/HTTPS.");
}
