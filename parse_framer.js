const fs = require('fs');
const text = fs.readFileSync('framer_component.js', 'utf8');

// Print addPropertyControls section
const idx = text.indexOf('addPropertyControls(');
if (idx !== -1) {
  console.log(text.slice(idx, idx + 3000));
}
