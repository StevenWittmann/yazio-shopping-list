export const Fractions = {
	convert(str) {
		const fractionMap = {
			'¼': 0.25,
			'½': 0.5,
			'¾': 0.75,
			'⅓': 0.33,
			'⅔': 0.67,
			// Fügen Sie hier weitere Brüche hinzu, falls gewünscht
		};
		str = str.toString();

		const fractionRegex = new RegExp(`[${Object.keys(fractionMap).join('')}]`, 'g');
		const idxOfFraction = str.search(fractionRegex);

		// 0,34 Gurken ist auch möglich
		if (!isNaN(str[str.indexOf(',') + 1])) str = str.replace(',', '.');

		if (idxOfFraction == -1) return str;
		if (idxOfFraction == 0) return str.replace(fractionRegex, (match) => fractionMap[match]);

		const number = parseFloat(str.substr(0, idxOfFraction));
		const fraction = parseFloat(fractionMap[str.substr(idxOfFraction, 1)]);

		return number + fraction + str.substr(idxOfFraction + 1);
	},
};
