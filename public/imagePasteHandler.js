// imagePasteHandler.js
import { createBox } from "./box.js";

let mouseX = 0;
let mouseY = 0;

// Track the mouse position globally
document.addEventListener('mousemove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
});

// Function to get the current mouse position
function getMousePosition() {
    return {
        x: mouseX,
        y: mouseY
    };
}



document.body.addEventListener('paste', (event) => {
    const items = event.clipboardData.items;

    // Loop through the pasted items
    for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // Check if the item is an image
        if (item.type.startsWith('image/')) {
            const file = item.getAsFile();

            // Convert the image file to Base64 and insert it into the body
            convertToBase64(file).then((base64Image) => {
                const imgElement = document.createElement('img');
                imgElement.src = base64Image;
                imgElement.style.maxWidth = '100%'; // Optional: limit image width

                // Get the mouse position and adjust for scroll
                const X = mouseX; // Horizontal position considering scroll
                const Y = mouseY; // Vertical position considering scroll


                // Create a box to hold the image and position it at the mouse location
                // const box = document.createElement('div');
                // box.style.position = 'absolute';
                // box.style.left = `${X}px`;
                // box.style.top = `${Y}px`;
                // box.appendChild(imgElement);
                const box = createBox(X, Y, "", imgElement.outerHTML, "left");

                // Append the box with the image to activebody
                activebody.appendChild(box);
            });
        }
    }
});

// Function to convert a File object to Base64
function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
}
