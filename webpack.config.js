const path = require('path');

module.exports = {
    entry: './public/flowT.js',  // Your main JS file
    output: {
        filename: 'bundle.js',  // Output filename
        path: path.resolve(__dirname, 'public/dist'), // Output directory
        clean: true, // Clean output directory before emit
    },
    mode: 'development', // Set mode to development
};
