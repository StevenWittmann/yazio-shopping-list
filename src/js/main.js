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
			window.localStorage.setItem('microbudget', JSON.stringify(value));
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
 * $html elements to interact with
 */

const btnExpense = document.querySelector('#btnExpense');
const expense = document.querySelector('#expense');
const startBudget = document.querySelector('#startBudget');
const dayOfPayment = document.querySelector('#dayOfPayment');
const moneyLeft = document.querySelector('#moneyLeft');
const outputMoneyPerDay = document.querySelector('#outputMoneyPerDay');

/**
 * functions
 */

const updateFrontend = () => {
	const budget = localStorage.get('microbudget');
	if (budget) {
		console.log(budget);
		startBudget.value = budget.startBudget;
		moneyLeft.value = budget.moneyLeft;
		dayOfPayment.value = budget.dayOfPayment;

		outputMoneyPerDay.innerHTML = (budget.startBudget / 30).toFixed(2).replace('.', ',') + ' €';

		// calculate days till month end
		const today = new Date();
		const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
		const daysTillNextPayment = lastDayOfMonth.getDate() - today.getDate() + parseInt(dayOfPayment.value || 1);
		const outputDaysTillMonthEnd = document.querySelector('#outputDaysTillMonthEnd');
		const outputMoneyPerDayCalc = document.querySelector('#outputMoneyPerDayCalc');
		outputDaysTillMonthEnd.innerHTML = `Geld pro Tag (${daysTillNextPayment} Tage)`;
		outputMoneyPerDayCalc.innerHTML = (budget.moneyLeft / daysTillNextPayment).toFixed(2).replace('.', ',') + ' €';
	} else {
		localStorage.set({ startBudget: 999, dayOfPayment: 1, moneyLeft: 999 });
		updateFrontend();
	}
};

/**
 * event listeners
 */

window.addEventListener('load', () => {
	updateFrontend();
});
startBudget.addEventListener('change', (ev) => {
	let newValue = ev.currentTarget.value.replace(',', '.');
	const budget = localStorage.get('microbudget');
	budget.startBudget = parseFloat(newValue);
	budget.moneyLeft = parseFloat(newValue);
	localStorage.set(budget);
	updateFrontend();
});

dayOfPayment.addEventListener('change', (ev) => {
	let newValue = ev.currentTarget.value.replace(',', '.');
	const budget = localStorage.get('microbudget');
	budget.dayOfPayment = parseFloat(newValue);
	localStorage.set(budget);
	updateFrontend();
});

btnExpense.addEventListener('click', () => {
	const budget = localStorage.get('microbudget');
	budget.moneyLeft -= parseFloat(expense.value || 0);
	localStorage.set(budget);
	updateFrontend();
	expense.value = '';
});
