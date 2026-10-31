'use strict';
// Static UI regression. Pixel-level centering is verified with the browser check.
const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/index.html','utf8');
const css=fs.readFileSync('public/styles.css','utf8');
assert.match(html,/<div class="bb-onboard-art"><span id="bbOnboardModeArt"/);
assert.match(css,/\.bb-onboard-aside \.bb-onboard-art\{\s*display:grid;\s*place-items:center;/);
assert.match(css,/\.bb-onboard-aside \.bb-onboard-art > #bbOnboardModeArt\{[\s\S]*?width:100%;[\s\S]*?height:100%;/);
assert.match(css,/@media\(max-width:750px\)\{\s*\.bb-onboard-aside \.bb-onboard-art > #bbOnboardModeArt/);
console.log('PASS 1.8 preview 2: large mode preview centered in full art panel, including mobile');
