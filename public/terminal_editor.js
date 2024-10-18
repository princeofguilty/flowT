import { createCustomBox } from './box'

export function terminal_editor(terminalDiv) {
    terminalDiv.addEventListener('contextmenu', (event) => {
        if (!event.currentTarget.hasAttribute('lastcommand'))
            return;
        let commands = event.currentTarget.getAttribute('lastcommand').split(']_[');
        let ta = document.createElement('textarea')
        ta.style.width = "50vh";
        ta.style.height = "80vh";
        ta.style.transformOrigin = "center";
        ta.style.left = "50%";
        ta.style.top = "50%";
        document.body.append(ta);
        for (let c in commands) {
            ta.value += c + '<br>';
        }
    })
}