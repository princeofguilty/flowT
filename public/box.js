import canvas from './canvas.js'

function unescapeHTML(html) {
    // Create a temporary DOM element
    const tempDiv = document.createElement('div');

    // Set the innerHTML to the encoded HTML
    tempDiv.innerHTML = html;

    // The browser will automatically decode the HTML
    return tempDiv.textContent || tempDiv.innerText;
}

// Function to create and position a box
export function createBox(x, y, innerHTML, outerHTML = null, location = "center") {
    if (outerHTML) {
        // const tag = outerHTML.match(/<(\w+)\s/)[1];
        const container = document.createElement('div');
        container.className = "container";
        const tags = outerHTML.match(/<\s*[a-zA-Z][a-zA-Z0-9\-]*\s*[^>]*\/?>/g);
        //

        // document.body.children.activebody.insertAdjacentHTML('beforeend', outerHTML);
        var ball = canvas.generate_ball();
        container.appendChild(ball);
        container.style.flexDirection = "column";
        // container.style.gap = "5px";
        container.style.justifyContent = "flex-start";
        container.style.alignItems = "baseline";
        container.insertAdjacentHTML('beforeend', outerHTML);
        container.children[1].style.fontSize = "28px";
        container.children[1].style.color = "white";
        container.children[1].style.zIndex = -1999;
        // container.children[1].style.border = "2px solid #ffffff";
        container.contentEditable = false;

        // container.children[1].style.userSelect = "none";
        activebody.appendChild(container);
        var box = container;
        x += window.scrollX;
        y += window.scrollY;
    }
    else {
        // Set the innerHTML to the provided HTML content
        var box = document.createElement('div');
        box.innerHTML = innerHTML;

        // Make the box editable
        box.contentEditable = true;

        // Append the box to the body
        activebody.appendChild(box);
        box.classList.add('box');


        box.addEventListener('dblclick', function (event) {
            event.preventDefault();
            box.contentEditable = true;
            box.style.border = "1px solid #ccc";
        });

    }

    box.style.left = `${x}px`;
    box.style.top = `${y}px`;

    // Add event listener for keydown events
    box.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            document.execCommand('insertHTML', false, '<br>');
            event.preventDefault();
        }
    });


    window.box_position = null;
    if (box.children.length > 1 && box.children[1].tagName == "IMG" && box.children[1].src.startsWith('data:image/')) {
        //skip
    }
    else{
        box.addEventListener('contextmenu', function (event) {
            event.preventDefault();
            box.contentEditable = true;
            window.box_position = box.getBoundingClientRect();
            let pointer = box;
            while (pointer.children.length > 1 && pointer.className == "container") {
                pointer = pointer.children[1];
            }
            var holder = pointer.outerHTML;
            holder = holder.replace(/(?:contenteditable="(?:true|false)"\s*|\s*style="[^"]*"\s*)/g, '');
            box.innerText = holder;
            box.style.fontSize = "20px";
            box.style.color = "white";
        });
    }

    box.addEventListener('focusout', function (event) {
        if (window.box_position == null)
            return;
        window.box_position = null;
        const new_code = unescapeHTML(box.innerHTML);
        box.contentEditable = false;

        createBox(box.getBoundingClientRect().left, box.getBoundingClientRect().top, "", new_code);
        document.body.children.activebody.removeChild(box);
        box.style.border = "none";
    });

    // make the box draggable :)
    if (!outerHTML) {
        makeDraggable(box, box);
    } else {
        makeDraggable(ball, box);
    }

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