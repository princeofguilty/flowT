import canvas from './canvas.js'

function unescapeHTML(html) {
    // Create a temporary DOM element
    const tempDiv = document.createElement('div');

    // Set the innerHTML to the encoded HTML
    tempDiv.innerHTML = html;

    // The browser will automatically decode the HTML
    return tempDiv.textContent || tempDiv.innerText;
}

export function rightClick_handler(event) {
    if(event.target.className != "container"){
        return;
    }
    let box = event.currentTarget;
    event.preventDefault();
    box.contentEditable = true;
    window.box_position = box.getBoundingClientRect();
    let pointer = box;
    while (pointer.children.length > 1 && pointer.className == "container") {
        pointer = pointer.children[1];
    }
    if (pointer.className == "resizable")
        pointer = pointer.children[0];
    var holder = pointer.outerHTML;
    // holder = holder.replace(/(?:contenteditable="(?:true|false)"\s*|\s*style="[^"]*"\s*)/g, '');
    box.innerText = holder;
    // box.style.fontSize = "20px";
    box.style.color = "white";
    box.focus();
}

export function focusOut_handler(event) {
    let box = event.target;
    if (window.box_position == null)
        return;
    window.box_position = null;

    const new_code = unescapeHTML(box.innerHTML);
    box.contentEditable = false;

    createCustomBox(box.getBoundingClientRect().left, box.getBoundingClientRect().top, new_code);
    document.body.children.activebody.removeChild(box);
    box.style.border = "none";
}

// Function to create and position a box
export function createCustomBox(x, y, outerHTML) {
    // const tag = outerHTML.match(/<(\w+)\s/)[1];
    const container = document.createElement('div');
    container.className = "container";
    // const tags = outerHTML.match(/<\s*[a-zA-Z][a-zA-Z0-9\-]*\s*[^>]*\/?>/g);


    // document.body.children.activebody.insertAdjacentHTML('beforeend', outerHTML);
    var ball = canvas.generate_ball();
    container.appendChild(ball);
    container.style.flexDirection = "column";
    // container.style.gap = "5px";
    container.style.justifyContent = "flex-start";
    container.style.alignItems = "baseline";

    const tmp = document.createElement('tmp');
    tmp.insertAdjacentHTML('afterbegin', outerHTML);
    const holder = make_resizable(tmp.children[0]);
    tmp.remove();

    container.appendChild(holder);
    container.children[1].style.fontSize = "28px";
    container.children[1].style.color = "white";
    container.children[1].style.zIndex = -1999;
    container.contentEditable = false;
    // container.children[1].contentEditable = true;

    // container.children[1].style.userSelect = "none";
    activebody.appendChild(container);
    var box = container;
    x += window.scrollX;
    y += window.scrollY;

    box.style.left = `${x}px`;
    box.style.top = `${y}px`;

    window.box_position = null;
    if (box.children.length > 1 && box.children[1].tagName == "IMG" && box.children[1].src.startsWith('data:image/')) {
        //skip
    }
    else {
        box.addEventListener('contextmenu', rightClick_handler);
        box.addEventListener('focusout', focusOut_handler);
    }

    // make the box draggable :)
    makeDraggable(ball, box);

    return box;
}


// Function to create and position a box
export function createTextBox(x, y, text) {
    // Set the innerHTML to the provided HTML content
    var box = document.createElement('textarea');
    // box.type = "text";
    box.value = text;

    // // Make the box editable
    // box.contentEditable = true;

    // Append the box to the body
    activebody.appendChild(box);
    box.classList.add('box');


    box.addEventListener('dblclick', function (event) {
        event.preventDefault();
        box.contentEditable = true;
        box.style.border = "1px solid #ccc";
    });

    box.style.left = `${x}px`;
    box.style.top = `${y}px`;

    box.addEventListener('focusout', function (event) {
        const new_code = unescapeHTML(box.innerHTML);
        box.contentEditable = false;
        box.style.border = "none";
    });

    // make the box draggable :)
    makeDraggable(box, box);

    return box;
}


// make something draggable ?
// what about element & target ??
// for examle, you can drag a terminal from terminal header
// but not from terminal body, so,
// elements is header, when you drag the header, it 
// moves the whole terminal.
// to drag something normally, make element and target
// just the same
export function makeDraggable(element, target) {
    let isDragging = false;
    let offsetX, offsetY;

    element.addEventListener('pointerdown', (event) => {
        const scrollBarWidth = 10; // Width of the vertical scrollbar (adjust if necessary)
        const scrollBarHeight = 10; // Height of the horizontal scrollbar (adjust if necessary)

        // Get the bounding rectangle of the scrollable container
        const rect = target.getBoundingClientRect();

        // Check if the pointer is on the vertical scrollbar
        const isVerticalScrollbar =
            event.clientX > rect.right - scrollBarWidth &&
            event.clientX < rect.right &&
            event.clientY > rect.top &&
            event.clientY < rect.bottom;

        // Check if the pointer is on the horizontal scrollbar
        const isHorizontalScrollbar =
            event.clientY > rect.bottom - scrollBarHeight &&
            event.clientY < rect.bottom &&
            event.clientX > rect.left &&
            event.clientX < rect.right;

        if (isVerticalScrollbar || isHorizontalScrollbar) {
            return;
        }

        isDragging = true;
        offsetX = event.clientX - element.getBoundingClientRect().left;
        offsetY = event.clientY - element.getBoundingClientRect().top;

        // Set capture to track pointer events
        element.setPointerCapture(event.pointerId);
    });

    element.addEventListener('pointermove', (event) => {
        if (!isDragging || !event.target) return;

        // windows.new_changes = true;
        let newX, newY;
        if (target.className == "container" && target.children[0].className != "_terminal" && target.children[1].tagName == "IMG") {
            // Calculate new position
            newX = event.clientX - offsetX + window.scrollX - (target.children[1].width / 2);
            newY = event.clientY - offsetY + window.scrollY;
        }
        else {
            // Calculate new position
            newX = event.clientX - offsetX + window.scrollX + (target.className == "pearl") * (- target.getBoundingClientRect().width / 2);
            newY = event.clientY - offsetY + window.scrollY + (target.className == "pearl") * (- target.getBoundingClientRect().height / 2);
        }

        // Update element position
        target.style.left = `${newX}px`;
        target.style.top = `${newY}px`;

        if (target.className == "container" && target.children[0].className == "_terminal") {
            const div = target.children[0]
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
        }

    });

    element.addEventListener('pointerup', () => {
        isDragging = false;
    });

    element.addEventListener('pointercancel', () => {
        isDragging = false;
    });

}


export function resize_handlers(box) {
    let isResizing = false;
    let currentHandle = null;

    setTimeout(() => {
        box.style.width = box.children[0].getBoundingClientRect().width;
        box.style.height = box.children[0].getBoundingClientRect().height;
    }, 5000);

    box.addEventListener('mousedown', function (event) {
        console.log('resizing: ' + event.target.className);
        // Check if the target is one of the handles
        if (event.target.className === "box" || event.target.classList.contains('resizable')) {
            return;
        }

        isResizing = true;
        currentHandle = event.target;

        const startX = event.clientX;
        const startY = event.clientY;
        const startWidth = parseInt(document.defaultView.getComputedStyle(box).width, 10);
        const startHeight = parseInt(document.defaultView.getComputedStyle(box).height, 10);
        box.children[0].style.userSelect = 'none';

        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);

        function resize(event) {
            // console.log('resizing: ' + event.target.className);
            if (!isResizing) return;

            const newWidth = startWidth + (event.clientX - startX) - 10;
            const newHeight = startHeight + (event.clientY - startY) - 10;

            box.style.width = `${newWidth}px`;
            box.style.height = `${newHeight}px`;
            box.children[0].style.width = Math.max(newWidth, 170) + "px";
            box.children[0].style.height = Math.max(newHeight, 80) + "px";
        }
        function stopResize() {
            isResizing = false;
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
            box.children[0].style.userSelect = 'auto';
        }
    });
    box.addEventListener('focusout', (event) => {
        box.children[0].style.userSelect = 'none';
    })

}


function make_resizable(element) {
    const holder = document.createElement('div')
    holder.className = "resizable";
    holder.appendChild(element);
    holder.style.width = element.getBoundingClientRect().width;
    holder.style.height = element.getBoundingClientRect().height;
    holder.appendChild(document.createElement('div'));
    holder.children[1].className = 'top-left';
    holder.appendChild(document.createElement('div'));
    holder.children[2].className = 'top-right';
    holder.appendChild(document.createElement('div'));
    holder.children[3].className = 'bottom-left';
    holder.appendChild(document.createElement('div'));
    holder.children[4].className = 'bottom-right';

    resize_handlers(holder);
    return holder;
}