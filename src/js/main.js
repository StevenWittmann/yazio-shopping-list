import { doc } from 'prettier';
import './../scss/style.scss';

/**
 * helper functions
 */

const localStorage = {
    set: function (value) {
        if (typeof (Storage) !== 'undefined') {
            window.localStorage.setItem('yazioShoppingList', JSON.stringify(value));
        }
    },
    get: function (key) {
        if (typeof (Storage) !== 'undefined') {
            return JSON.parse(window.localStorage.getItem(key));
        }
    },
    delete: function (key) {
        if (typeof (Storage) !== 'undefined') {
            window.localStorage.removeItem(key);
        }
    }
}

const _compareNumbers = (a, b) => {
    return a - b;
}

/**
 * functions
 */

function createListItem(name, index, className = 'to-buy') {
    const $listItem = document.createElement('li');
    $listItem.innerText = name;
    $listItem.dataset.itemNo = index;
    $listItem.classList.add(className)
    $listItem.onclick = (event) => {
        listItemClickHandler(event);
    }
    $shoppingList.appendChild($listItem);
}

function showShoppingListSection() {
    $sectionImport.classList.add('hidden');
    $sectionShoplist.classList.remove('hidden');
};

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

function parseYazioExportText(text) {
    // item pro absatz, leere items werden gefiltert
    const array = text.split('\n').filter(n => n);

    // hole und filtere die überschriften aus dem array
    const subheadline = array.map((e, i) => (e.includes('Für') && e.includes('Portion') ? i : null)).filter(Boolean);
    const headline = subheadline.map(i => i - 1);
    const indicesToRemove = [...subheadline, ...headline].sort(_compareNumbers);
    const filteredArray = array.filter((_, i) => !indicesToRemove.includes(i));

    // sortiere die Zutaten liste alphabetisch
    // wenn nur 2 Zeichen vor dem ersten Leerzeichen kommen, ist es wahrscheinlich eine Mengenangabe -> ignorieren
    filteredArray.sort(function (a, b) {
        a = (a.indexOf(' ') < 3) ? a.substring(a.indexOf(' ') + 1) : a;
        b = (b.indexOf(' ') < 3) ? b.substring(b.indexOf(' ') + 1) : b;
        return a.localeCompare(b);
    });

    if (filteredArray[0] === '#YAZIO') filteredArray.shift();

    const summary = {};
    for (const [index, item] of filteredArray.entries()) {
        // startet mit nummer
        let quantity = (item.match(/^\d/)) ? item.split(' ')[0] : '';

        // alles außer die sachen in der klammer
        let name = (item.match(/^(.*?)\s+\(.*?\)$/));
        name = (name) ? name[1] : 'Fehler';

        // startsWith do not work, if e.g. 1½ 
        if (!isNaN(name.substring(0, name.indexOf(' ')))) {
            name = name.replace(quantity + ' ', '');
        }

        // die sachen in der Klammer

        // Edgecase (1 EL, 14 ml) hole ml relevanter für einkauf
        let braces = item.match(/\((.*?)\)/);
        braces = (braces) ? braces[1] : 'Fehler';
        if (braces.includes(',')) {
            braces = braces.substring(braces.indexOf(', ') + 2)
        }
        let [weight, unit] = (braces.split(' '));

        // Edgecase (nach Belieben) 
        if (weight === 'nach') {
            weight = 0;
            unit = 0;
        }

        // konvertieren von 1/2 nach decimals ( ⅔ Zwiebel (53⅓ g), 1⅓ Knoblauchzehen (4 g) nicht einfach möglich -> neuen Eintrag dafür anlegen
        const weightIsNumber = !isNaN(weight);
        weight = (weightIsNumber) ? Number(weight) : weight;
        quantity = !isNaN(quantity) ? Number(quantity) : 0;
        if (!summary[name]) {
            summary[name] = { name: name, quantity: Number(quantity), weight: weight, unit: unit };
        } else if (weightIsNumber) {
            summary[name].quantity += quantity;
            summary[name].weight += weight;
        } else {
            summary[name + '_' + index] = { name: name, quantity: Number(quantity), weight: weight, unit: unit };
        }
    }

    function callback([i, { name, quantity, weight, unit }]) {

        let shoppingListItem = `${quantity} ${name} (${weight} ${unit})`;
        if (quantity === 0) shoppingListItem = `${name} (${weight} ${unit})`;
        if (weight === 0) shoppingListItem = `${name} (nach Belieben)`;

        return shoppingListItem;
    }
    return Object.entries(summary).map(callback);
}


/**
 * event listeners
 */

window.addEventListener('load', () => {
    const shoppingList = localStorage.get('yazioShoppingList');
    if (!shoppingList) return;

    shoppingList.forEach((elem) => {
        const className = (elem.strikeThrough) ? 'strike-through' : 'to-buy';
        createListItem(elem.name, elem.index, className);
    });
    showShoppingListSection();
})

$buttonSummarize.addEventListener('click', () => {
    const summarizedArray = parseYazioExportText($textarea.value.trim());

    let storeItems = []
    summarizedArray.forEach((itemName, index) => {
        storeItems.push({ name: itemName, index: index, strikeThrough: false });
        createListItem(itemName, index);
    });

    // create local storage
    localStorage.set(storeItems);

    showShoppingListSection();
})


$buttonNewImport.addEventListener('click', () => {
    // delete local storage
    localStorage.delete('yazioShoppingList');

    // show import section
    $sectionImport.classList.remove('hidden');
    $textarea.value = '';

    // hide shopping list section
    $sectionShoplist.classList.add('hidden');
    $shoppingList.innerHTML = '';
})

$buttonPrint.addEventListener('click', () => {

    var a = window.open('', '', '');
    a.document.write('<html>');
    a.document.write('<head> <style> html { font-family: system-ui, sans-serif;} h2{font-size:18px;} li{font-size:14px; font-weight: normal;} li.strike-through { text-decoration: line-through; opacity: 0.4; } </style>');
    a.document.write('<body > <h2>Yazio - Shopping List<h2>');
    a.document.write($shoppingList.innerHTML);
    a.document.write('</body></html>');
    a.document.close();
    a.print();
})

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
    `
})

function listItemClickHandler(event) {
    const $currentItem = event.currentTarget;

    // get storage 
    let temp = localStorage.get('yazioShoppingList');

    let clickedItem = false;
    let currentIndex;
    temp.forEach((items, index) => {
        if (items.index == $currentItem.dataset.itemNo) {
            clickedItem = temp[index];
            currentIndex = index;
            return;
        }
    })

    if (clickedItem) {
        // toggle strike-through
        clickedItem.strikeThrough = !clickedItem.strikeThrough;

        // delete item in array
        temp.splice(currentIndex, 1);
        if (clickedItem.strikeThrough) {
            // add to last position
            temp.push(clickedItem);
        } else {
            // add to first position
            temp.unshift(clickedItem);
        }
    }

    $currentItem.classList.toggle('strike-through');

    // rerender list
    $shoppingList.innerHTML = '';
    temp.forEach((elem) => {
        const className = (elem.strikeThrough) ? 'strike-through' : 'to-buy';
        createListItem(elem.name, elem.index, className);
    });

    // set new value
    localStorage.set(temp);
}
