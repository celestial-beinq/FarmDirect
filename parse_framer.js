const fs = require('fs');
const text = fs.readFileSync('framer_component.js', 'utf8');

const idx = text.indexOf('const css=[');
const endIdx = text.indexOf('];', idx);
const cssArray = eval(text.slice(idx + 10, endIdx + 1));
cssArray.forEach(c => console.log(c));
