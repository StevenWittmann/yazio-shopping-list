import { Category } from './categories';
import { Fractions } from './fractions';
import { Pluralize } from './pluralize';
import './../scss/style.scss';

/**
 * helper functions
 */

const localStorage = {
	set: function (value) {
		if (typeof Storage !== 'undefined') {
			window.localStorage.setItem('yazioShoppingList', JSON.stringify(value));
		}
	},
	get: function (key) {
		if (typeof Storage !== 'undefined') {
			return JSON.parse(window.localStorage.getItem(key));
		}
	},
	delete: function (key) {
		if (typeof Storage !== 'undefined') {
			window.localStorage.removeItem(key);
		}
	},
};

const _compareNumbers = (a, b) => {
	return a - b;
};

function addGlobalStyle(css) {
	var head, style;
	head = document.getElementsByTagName('head')[0];
	if (!head) {
		return;
	}
	style = document.createElement('style');
	style.type = 'text/css';
	style.id = 'hideCrossed';
	style.innerHTML = css;
	head.appendChild(style);
}

/**
 * functions
 */

function createListItem(name, index, className = 'to-buy') {
	const $listItem = document.createElement('li');
	$listItem.innerText = name;
	$listItem.dataset.itemNo = index;
	$listItem.classList.add(className);
	$listItem.onclick = (event) => {
		listItemClickHandler(event);
	};
	$shoppingList.appendChild($listItem);
}

function showShoppingListSection() {
	$sectionImport.classList.add('hidden');
	$sectionShoplist.classList.remove('hidden');
}

/**
 * $html elements to interact with
 */

const $sectionImport = document.querySelector('section.import');
const $textarea = document.querySelector('#textarea');
const $buttonSummarize = document.querySelector('#buttonSummarize');
const $linkExampleData = document.querySelector('#exampleData');

const $sectionShoplist = document.querySelector('section.shopping-list');
const $shoppingList = document.querySelector('#shoppingList');
const $buttonNewImport = document.querySelector('#buttonNew');
const $buttonPrint = document.querySelector('#buttonPrint');
const $buttonHideCrossed = document.querySelector('#buttonHideCrossed');

function parseYazioExportText(text) {
	/**
	 * START FILTERUNG
	 */

	// item pro absatz, leere items werden gefiltert
	const array = text.split('\n').filter((n) => n);

	// filtere und entferne die überschriften aus dem array
	const subheadline = array.map((e, i) => (e.includes('Für') && e.includes('Portion') ? i : null)).filter(Boolean);
	const headline = subheadline.map((i) => i - 1);
	const indicesToRemove = [...subheadline, ...headline].sort(_compareNumbers);
	const filteredArray = array.filter((_, i) => !indicesToRemove.includes(i));

	// sortiere die Zutaten liste alphabetisch
	// wenn nur 2 Zeichen vor dem ersten Leerzeichen kommen, ist es wahrscheinlich eine Mengenangabe -> ignorieren
	filteredArray.sort(function (a, b) {
		a = a.indexOf(' ') < 3 ? a.substring(a.indexOf(' ') + 1) : a;
		b = b.indexOf(' ') < 3 ? b.substring(b.indexOf(' ') + 1) : b;
		return a.localeCompare(b);
	});

	// entferne Yazio string
	if (filteredArray[0] === '#YAZIO') filteredArray.shift();

	/**
	 * START PARSEN DER DATEN ZUR DARSTELLUNG ALS EINKAUFSLISTEN ITEM
	 */

	const shoppingList = {};
	const catShoppingList = {};
	for (const [index, item] of filteredArray.entries()) {
		// alles außer die sachen in der klammer
		let name = item.match(/^(.*?)\s+\(.*?\)$/);
		name = name ? name[1] : 'Fehler';

		name = Fractions.convert(name);

		// startet mit nummer
		let quantity = name.match(/^\d/) ? name.split(' ')[0] : '';

		// startsWith do not work, if e.g. 1½
		if (!isNaN(name.substring(0, name.indexOf(' ')))) {
			name = name.replace(quantity + ' ', '');
		}
		name = name.replaceAll('.', ',');
		name = Pluralize.do(name);

		let category = setCategory(name);

		// die sachen in der Klammer
		// Edgecase (1 EL, 14 ml) hole ml, denn es ist relevanter für den Einkauf
		let braces = item.match(/\((.*?)\)/);
		braces = braces ? braces[1] : 'Fehler';
		if (braces.includes(',')) {
			braces = braces.substring(braces.indexOf(', ') + 2);
		}
		let [weight, unit] = braces.split(' ');

		// Edgecase (nach Belieben)
		if (weight === 'nach' || unit === 'taste') {
			weight = 0;
			unit = 0;
		}

		weight = Fractions.convert(weight);

		// konvertieren von 1/2 nach decimals ( ⅔ Zwiebel (53⅓ g), 1⅓ Knoblauchzehen (4 g) nicht einfach möglich -> neuen Eintrag dafür anlegen
		const weightIsNumber = !isNaN(weight);
		weight = weightIsNumber ? Number(weight) : weight;
		quantity = !isNaN(quantity) ? Number(quantity) : 0;

		// kategorie gibts nicht? anlegen
		if (!catShoppingList[category]) {
			catShoppingList[category] = [
				{
					name: name,
					quantity: Number(quantity),
					weight: weight,
					unit: unit,
				},
			];
		} else {
			// gibt es artikel in kategorie?
			if (weightIsNumber) {
				catShoppingList[category].forEach((el, idx, arr) => {
					if (el.name == name) {
						catShoppingList[category][idx].quantity += quantity;
						catShoppingList[category][idx].weight += weight;
					} else if (idx === arr.length - 1 && el.name != name) {
						catShoppingList[category].push({
							name: name,
							quantity: Number(quantity),
							weight: weight,
							unit: unit,
						});
					}
				});
			} else {
				catShoppingList[category].push({
					name: name,
					quantity: Number(quantity),
					weight: weight,
					unit: unit,
				});
			}
		}
	}

	return catShoppingList;
}

/**
 * event listeners
 */

window.addEventListener('load', () => {
	const shoppingList = localStorage.get('yazioShoppingList');
	if (!shoppingList) return;
	$shoppingList.innerHTML = shoppingList;
	addClickListItemHandler();
	showShoppingListSection();
});

$buttonSummarize.addEventListener('click', () => {
	const yazioParsedObject = parseYazioExportText($textarea.value.trim());
	const neededProducts = Object.values(yazioParsedObject);
	const productGroupNames = Object.keys(yazioParsedObject);

	function _proceedDataForEntry(object) {
		let shoppingListItem = `${object.quantity} ${object.name} (${object.weight} ${object.unit})`;
		if (object.quantity === 0) shoppingListItem = `${object.name} (${object.weight} ${object.unit})`;
		if (object.weight === 0) shoppingListItem = `${object.name} (nach Belieben)`;
		return shoppingListItem.replaceAll('.', ',');
	}

	let $list = '';
	neededProducts.forEach((el, idx) => {
		$list += `<h3>${productGroupNames[idx]}</h3>`;
		el.forEach((entry) => {
			$list += `<li><span>${_proceedDataForEntry(entry)}</span></li>`;
		});
	});
	$shoppingList.innerHTML = $list;
	addClickListItemHandler();

	// create local storage
	localStorage.set($shoppingList.innerHTML);

	showShoppingListSection();
});

$buttonNewImport.addEventListener('click', () => {
	// delete local storage
	localStorage.delete('yazioShoppingList');

	// show import section
	$sectionImport.classList.remove('hidden');
	$textarea.value = '';

	// hide shopping list section
	$sectionShoplist.classList.add('hidden');
	$shoppingList.innerHTML = '';
});

$buttonPrint.addEventListener('click', () => {
	var a = window.open('', '', '');
	a.document.write('<html>');
	a.document.write(
		'<head> <style> html { font-family: system-ui, sans-serif;} h2{font-size:18px;} li{font-size:14px; font-weight: normal;} li.strike-through { text-decoration: line-through; opacity: 0.4; } </style>'
	);
	a.document.write('<body > <h2>Yazio - Shopping List<h2>');
	a.document.write($shoppingList.innerHTML);
	a.document.write('</body></html>');
	a.document.close();
	a.print();
});

$linkExampleData.addEventListener('click', () => {
	$textarea.value = `Gemüseauflauf  mit Mandelcrunch
Für 2 Portionen
3 Kartoffeln, festkochend (270 g)
1 Zwiebel (80 g)
½ Brokkoli (170 g)
½ Blumenkohl (500 g)
Olivenöl (1 EL, 14 ml)
Haferdrink, ungesüßt (40 ml)
Hefeflocken (1 EL, 4 g)
Frischkäse, vegan (90 g)
Thymian, getrocknet (1 TL, 2 g)
Knoblauchpulver (1 TL, 2 g)
Pfeffer und Salz (to taste)
4 Getrocknete Tomaten, in Öl (20 g)
Basilikum, frisch (5 g)
15 Mandeln (15 g)
½ Zitrone, bio (40 g)
Pankomehl (2 EL, 16 g)

Rucolasalat mit Trauben
Für 1 Portion
Cashewkerne (30 g)
Weintrauben, rot (100 g)
Olivenöl (2 EL, 27 ml)
Rotweinessig (1 EL, 16 ml)
Pfeffer und Salz (to taste)
Rucola (50 g)

Schnelle Gnocchi Bowl
Für 1 Portion
Gnocchi (200 g)
Kirschtomaten (80 g)
½ Salatgurke (150 g)
Pesto Verde (2 EL, 20 g)
Feta (50 g)
    `;
});

$buttonHideCrossed.addEventListener('click', () => {
	const currentlyHidden = document.querySelector('#hideCrossed');
	currentlyHidden ? currentlyHidden.remove() : addGlobalStyle('li.strike-through {display:none}');
});

function addClickListItemHandler() {
	const listItem = $shoppingList.querySelectorAll('li');
	for (let i = 0; i < listItem.length; i++) {
		listItem[i].onclick = (event) => {
			event.currentTarget.classList.toggle('strike-through');
			localStorage.set($shoppingList.innerHTML);
		};
	}
}

function setCategory(name) {
	let category = 'Unkategorisiert';
	if (Category.VEGETABLES.items.some((item) => name.includes(item))) {
		category = Category.VEGETABLES.name;
	} else if (Category.HERBS.items.some((item) => name.includes(item))) {
		category = Category.HERBS.name;
	} else if (Category.COOLSHELF.items.some((item) => name.includes(item))) {
		category = Category.COOLSHELF.name;
	} else if (Category.DRYSHELF.items.some((item) => name.includes(item))) {
		category = Category.DRYSHELF.name;
	} else if (Category.DRINKS.items.some((item) => name.includes(item))) {
		category = Category.DRINKS.name;
	} else if (Category.BREAD.items.some((item) => name.includes(item))) {
		category = Category.BREAD.name;
	}
	return category;
}
