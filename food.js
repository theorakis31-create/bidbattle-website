'use strict';
// Separate, versioned ingredient catalogs bundled with the server. They are
// intentionally not mixed: a hotdog game can never draw a pizza-sauce card.
const crypto = require('node:crypto');
const CATALOGS = Object.freeze({
  burger: require('./data/food/burger.json'),
  pizza: require('./data/food/pizza.json'),
  pasta: require('./data/food/pasta.json'),
  hotdog: require('./data/food/hotdog.json')
});
const FOOD_DISHES = Object.freeze({
  burger: {name: 'Burger', emoji: '🍔'},
  pizza: {name: 'Pizza', emoji: '🍕'},
  pasta: {name: 'Pasta', emoji: '🍝'},
  hotdog: {name: 'Hotdog', emoji: '🌭'}
});
const FOOD_CHOICES = Object.freeze(['random', ...Object.keys(FOOD_DISHES)]);

for (const [dish, items] of Object.entries(CATALOGS)) {
  if (items.length < 40) throw Error(`${dish}: Zutatenkatalog muss mindestens 40 Zutaten haben.`);
  if (new Set(items.map(i=>i.id)).size !== items.length) throw Error(`${dish}: doppelte Zutaten-IDs.`);
  if (new Set(items.map(i=>i.title)).size !== items.length) throw Error(`${dish}: doppelte Zutaten-Namen.`);
  if (items.some(i=>!i.id.startsWith(`${dish}-`) || !i.title || !i.type || !i.emoji || !i.detail)) throw Error(`${dish}: fehlerhafte Zutat.`);
}
const randomInt = max => crypto.randomInt(max);
function shuffle(items) {
  const result = [...items];
  for (let i = result.length-1; i>0; i--) {const j=randomInt(i+1); [result[i], result[j]]=[result[j],result[i]];}
  return result;
}
function chooseDish(choice) {
  if (choice === 'random') return Object.keys(FOOD_DISHES)[randomInt(Object.keys(FOOD_DISHES).length)];
  if (Object.hasOwn(FOOD_DISHES, choice)) return choice;
  throw Error('Unbekanntes Gericht.');
}
// Food Creator is prepared in culinary steps rather than shuffling all ingredients.
// The first two offers are *always* foundations, one guaranteed per player by
// the server auction rules. After that come the appropriate building steps.
const FOOD_STEPS = Object.freeze({
  burger: [['Basis',2],['Patty',2],['Käse',2],['Gemüse',3],['Soße',2],['Extras',1]],
  pizza: [['Teig',2],['Soße',2],['Käse',2],['Belag',4],['Finish',2]],
  pasta: [['Nudeln',2],['Soße',2],['Protein',3],['Gemüse',3],['Finish',2]],
  hotdog: [['Brötchen',2],['Wurst',2],['Soße',2],['Gemüse',3],['Topping',3]]
});
const FOOD_FOUNDATION_TYPES = Object.freeze(Object.fromEntries(
  Object.entries(FOOD_STEPS).map(([dish, steps]) => [dish, steps[0][0]])
));
function createFoodDeck(dish, count=12) {
  const items=CATALOGS[dish];
  if (!items) throw Error('Kein Zutatenkatalog für dieses Gericht.');
  if (!Number.isInteger(count) || count<2 || count>items.length) throw Error('Ungültige Angebotszahl.');
  const plan=FOOD_STEPS[dish];
  const selected=[], used=new Set();
  for (const [type, quota] of plan) {
    for (const item of shuffle(items.filter(i=>i.type===type && !used.has(i.id))).slice(0,quota)) {
      if (selected.length>=count) break;
      used.add(item.id);selected.push(item);
    }
  }
  // A future larger deck can use the remaining catalog, but still only AFTER
  // all structured stages. Avoid duplicate offers.
  for (const item of shuffle(items.filter(i=>!used.has(i.id)))) {
    if (selected.length>=count) break;
    selected.push(item);used.add(item.id);
  }
  if (selected.length!==count || selected.slice(0,2).some(i=>i.type!==FOOD_FOUNDATION_TYPES[dish]))
    throw Error(`${dish}: Kein vollständiger Ablauf mit zwei Grundlagen möglich.`);
  return selected;
}
function catalogSummary() {
  return Object.entries(FOOD_DISHES).map(([id,dish])=>({id,...dish,count:CATALOGS[id].length,categories:[...new Set(CATALOGS[id].map(item=>item.type))]}));
}
module.exports = {CATALOGS,FOOD_DISHES,FOOD_CHOICES,chooseDish,createFoodDeck,catalogSummary,FOOD_STEPS,FOOD_FOUNDATION_TYPES};
