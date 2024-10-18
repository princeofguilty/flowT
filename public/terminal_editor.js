import { prepareTerminalElement } from './flowT';
import { Unicode11Addon } from 'xterm-addon-unicode11';

export function terminal_editor(term, id, terminalDiv, terminalBody, terminalHeader, shell = "/usr/bin/zsh", existing_term_Div, history = false) {
    terminalDiv.addEventListener('mousedown', (event) => {
        if (event.button === 1) {
            event.preventDefault();

            if (!event.currentTarget.hasAttribute('lastcommand'))
                event.currentTarget.setAttribute('lastcommand', '');

            let commands = event.currentTarget.getAttribute('lastcommand').split(']_[');
            let ta = document.createElement('textarea');

            // Set textarea size and style
            ta.style.width = "50vh";
            ta.style.height = "50vh";
            ta.style.color = "white";
            ta.style.fontSize = "large";
            ta.style.position = "absolute";
            ta.style.backgroundColor = "#111111";
            ta.style.zIndex = "100000000";

            // Get the position of terminalDiv
            const rect = terminalDiv.getBoundingClientRect();

            // Position the textarea to be the same as terminalDiv
            ta.style.left = `${rect.left + window.scrollX}px`;
            ta.style.top = `${rect.top + window.scrollY}px`;

            // Append the textarea to the body
            document.body.appendChild(ta);

            // Populate the textarea with existing commands
            for (let c of commands) {
                ta.value += c + '\n';
            }

            // Optionally focus the textarea and select its content
            ta.focus();
            ta.select();

            // Handle focusout event to update terminalDiv's lastcommand attribute
            ta.addEventListener('focusout', (event) => {
                // Get the current content of the textarea
                const content = ta.value.trim(); // Remove any extra whitespace

                // Join the lines with ']_['
                const updatedCommands = content.split('\n').join(']_[');

                // Update the terminalDiv's lastcommand attribute
                terminalDiv.setAttribute('lastcommand', updatedCommands);

                // sock.emit('input', '\ncd\n');
                // sock.emit('input', '\nclear\n');

                term.dispose();
                // terminalBody.innerHTML = "";

                // createTerminal(id, terminalDiv, terminalBody, terminalHeader, shell = "/usr/bin/zsh", existing_term_Div, history = false)
                prepareTerminalElement(id, shell, terminalDiv);

                // Remove the textarea after focus out
                document.body.removeChild(ta);
            });
        }
    });
}

