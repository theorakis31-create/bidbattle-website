'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'public/styles.css'),'utf8');
const app=fs.readFileSync(path.join(root,'public/app.js'),'utf8');
const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
assert.match(html,/Wer bietet besser,<br><span class=\"title-highlight\">wer gewinnt\?<\/span>/);
assert.match(html,/BIETEN · KREIEREN · GEWINNEN/);
assert.equal((html.match(/data-playmode=/g)||[]).length,4);
for(const name of ['football','food','superhero','random']){
  const image=path.join(root,'public/assets',`mode-${name}.webp`);
  assert.ok(fs.statSync(image).size>1000,`${name} art missing`);
  assert.ok(server.includes(`/assets/mode-${name}.webp`),`${name} static route missing`);
  const mode=name==='superhero'?'hero':name;
  assert.match(html,new RegExp(`data-playmode=\"${mode}\"`));
}
assert.ok(fs.statSync(path.join(root,'public/assets/hero-trophy.webp')).size>1000);
assert.ok(server.includes('/assets/hero-trophy.webp'));
assert.match(server,/image\/webp/);
assert.match(css,/HOME-ONLY DESIGN SYSTEM/);
assert.match(css,/@media\(max-width:520px\)/);
assert.match(app,/\$\('#navModes'\)\.addEventListener/);
assert.ok(!html.includes('Bestenliste') && !html.includes('href=\"#friends\"'),'do not include placeholder navigation');
assert.ok(html.includes('Ersteigere Zutaten für den besten Burger'),'current food mechanics reflected in text');
console.log('PASS 1.7.3 homepage, game links and all bundled artwork');
