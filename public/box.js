 // Get all elements with class .box                                                                                            
 var boxes = document.querySelectorAll('.box');                                                                                 
                                                                                                                                
 // Loop through each element                                                                                                   
 boxes.forEach(function(box) {                                                                                                  
   // Make the element resizable                                                                                                
   box.style.resize = 'both';                                                                                                   
   box.style.overflow = 'auto';                                                                                                 
                                                                                                                                
   // Make the element draggable                                                                                                
   box.style.cursor = 'move';                                                                                                   
   box.style.position = 'absolute';                                                                                             
                                                                                                                                
   // Add event listeners for drag and drop                                                                                     
   box.addEventListener('mousedown', function(event) {                                                                          
     // Get the initial mouse position                                                                                          
     var x = event.clientX;                                                                                                     
     var y = event.clientY;                                                                                                     
                                                                                                                                
     // Get the initial element position                                                                                        
     var rect = box.getBoundingClientRect();                                                                                    
     var left = rect.left;                                                                                                      
     var top = rect.top;                                                                                                        
                                                                                                                                
     // Add event listeners for mouse move and up                                                                               
     document.addEventListener('mousemove', move);                                                                              
     document.addEventListener('mouseup', up);                                                                                  
                                                                                                                                
     // Function to handle mouse move                                                                                           
     function move(event) {                                                                                                     
       // Calculate the new element position                                                                                    
       var newLeft = left + (event.clientX - x);                                                                                
       var newTop = top + (event.clientY - y);                                                                                  
                                                                                                                                
       // Update the element position                                                                                           
       box.style.left = newLeft + 'px';                                                                                         
       box.style.top = newTop + 'px';                                                                                           
     }                                                                                                                          
                                                                                                                                
     // Function to handle mouse up                                                                                             
     function up() {                                                                                                            
       // Remove event listeners for mouse move and up                                                                          
       document.removeEventListener('mousemove', move);                                                                         
       document.removeEventListener('mouseup', up);                                                                             
     }                                                                                                                          
   });                                                                                                                          
                                                                                                                                
   // Add event listener for rotation                                                                                           
   box.addEventListener('contextmenu', function(event) {                                                                        
     // Prevent the default context menu from appearing                                                                         
     event.preventDefault();                                                                                                    
                                                                                                                                
     // Get the initial mouse position                                                                                          
     var x = event.clientX;                                                                                                     
     var y = event.clientY;                                                                                                     
                                                                                                                                
     // Get the initial element position                                                                                        
     var rect = box.getBoundingClientRect();                                                                                    
     var left = rect.left;                                                                                                      
     var top = rect.top;                                                                                                        
                                                                                                                                
     // Add event listeners for mouse move and up                                                                               
     document.addEventListener('mousemove', rotate);                                                                            
     document.addEventListener('mouseup', up);                                                                                  
                                                                                                                                
     // Function to handle mouse move                                                                                           
     function rotate(event) {                                                                                                   
       // Calculate the new element rotation                                                                                    
       var angle = Math.atan2(event.clientY - y, event.clientX - x);                                                            
                                                                                                                                
       // Update the element rotation                                                                                           
       box.style.transform = 'rotate(' + angle + 'rad)';                                                                        
     }                                                                                                                          
                                                                                                                                
     // Function to handle mouse up                                                                                             
     function up() {                                                                                                            
       // Remove event listeners for mouse move and up                                                                          
       document.removeEventListener('mousemove', rotate);                                                                       
       document.removeEventListener('mouseup', up);                                                                             
     }                                                                                                                          
   });                                                                                                                          
 });                                                                                                                            
