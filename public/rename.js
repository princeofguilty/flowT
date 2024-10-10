// // Open a modal window when F2 key is pressed                                                                                  
// document.addEventListener('keydown', function (e) {
//     if (e.key == '[' && e.ctrlKey) {
//         document.getElementById('project-name').style.userSelect = "auto";
//         document.getElementById('project-name').style.userSelect = "auto";

//     }
// });

document.getElementById("project-name").addEventListener('click', function(event){
    event.currentTarget.style.backgroundColor = "black  ";
    event.currentTarget.contentEditable = true;
})

document.getElementById("project-name").addEventListener('focusout', function(event){
    event.currentTarget.style.backgroundColor = "transparent";
    event.currentTarget.contentEditable = false;
    document.title = 'FlowT: ' + document.getElementById("project-name").textContent.trim();
})