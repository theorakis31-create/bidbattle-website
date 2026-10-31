'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs');
const app=fs.readFileSync('public/app.js','utf8'),css=fs.readFileSync('public/styles.css','utf8'),server=fs.readFileSync('server.js','utf8');
for(const pattern of [/function victoryScreen\(/,/function podiumParticipant\(/,/function podiumCollection\(/,/function podiumTrophy\(/,/if\(current.status==='complete'\)return victoryScreen\(\)/,/data-playagain/,/data-rematch/,/data-leave/,/current\.tieBreakReason==='mutual-tie'/,/current\.tieBreakReason==='rating'/])assert.match(app,pattern);
for(const pattern of [/bb-podium-main/,/bb-podium-gold-step/,/bb-podium-silver-step/,/bb-podium-actions/,/bb-podium-draw/,/prefers-reduced-motion:reduce/])assert.match(css,pattern);
assert.match(server,/const explicitRedirect=redirects\.some/);assert.match(server,/article:`https:\/\/en\.wikipedia\.org\/wiki\//);
assert.doesNotMatch(app,/data-next-card/);assert.match(app,/current\.status==='complete'\)return victoryScreen/);
console.log('PASS: 1.7.7 winner/draw podium, all three actions, football items, safe Wikipedia redirects, old game rules retained');
