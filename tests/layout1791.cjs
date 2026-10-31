'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'public/styles.css'),'utf8');
const js=fs.readFileSync(path.join(root,'public/app.js'),'utf8');
const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
assert.match(js,/const lobbyModes=\[\['football','Football Draft','⚽'\]/);
assert.match(js,/lobby-mode-emoji/);
assert.doesNotMatch(js,/lobby-mode-art\"><img/);
for (const item of ['⚽','🍔','🦸','🎲']) assert(js.includes(item));
assert.match(js,/const AVATAR_IDS = \['🙂','😎'/);
assert.match(js,/const LEGACY_AVATARS =/);
assert.match(js,/const emojiAvatar =/);
assert.match(js,/const avatarContent = avatar => escape\(emojiAvatar\(avatar\)\)/);
assert.doesNotMatch(js,/AVATAR_IDS\.map\(a=>`<button[^`]*img/);
// Version 1.8 brings back the original premium artwork; both previous and current
// image files remain in the archive for compatibility but the new hero uses hero-trophy.
assert.match(html,/class="hero-art hero-art-173 bb-v18-hero"/);
assert.match(html,/src="\/assets\/hero-trophy-integrated.webp"/);
assert.ok(fs.statSync(path.join(root,'public/assets/hero-trophy-integrated.webp')).size>1000);
assert.match(css,/\.bb-v18-hero-image/);
console.log('PASS 1.7.9.1 lobby symbols, emoji selection/legacy mapping, responsive 3-part hero');
