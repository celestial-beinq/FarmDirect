const fs = require('fs');
const text = fs.readFileSync('framer_component.js', 'utf8');

// Find all CSS rules in full
const cssStart = text.indexOf('css`');
if (cssStart !== -1) {
  const cssEnd = text.indexOf('`', cssStart + 4);
  console.log('--- CSS BLOCK ---');
  console.log(text.slice(cssStart, cssEnd + 1));
}

// Find hover variants or transforms
const matchHover = text.match(/hover:\{[^}]+\}/g);
console.log('--- Hover properties ---', matchHover);

// Let's search for elements: motion.div or jsx
const jsxMatches = text.match(/jsx\([^)]+\)/g) || [];
console.log('--- JSX calls count ---', jsxMatches.length);
jsxMatches.slice(0, 10).forEach(m => console.log(m.slice(0, 150)));
