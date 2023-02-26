export const Pluralize = {
	do(str) {
		const pluralizeMap = {
			Tomate: 'Tomate(n)',
			Tomaten: 'Tomate(n)',
			Kartoffel: 'Kartoffel(n)',
			Kartoffeln: 'Kartoffel(n)',
			Salatgurke: 'Salatgurke(n)',
			Salatgurken: 'Salatgurke(n)',
			Zitrone: 'Zitrone(n)',
			Zitronen: 'Zitrone(n)',
			Zwiebel: 'Zwiebel(n)',
			Zwiebeln: 'Zwiebel(n)',
			Riesenchampignon: 'Riesenchampignon(s)',
			Riesenchampignons: 'Riesenchampignon(s)',
			Champignon: 'Champignon(s)',
			Champignons: 'Champignon(s)',
			Schalotte: 'Schalotte(n)',
			Schalotten: 'Schalotte(n)',
			Knoblauchzehe: 'Knoblauchzehe(n)',
			Knoblauchzehen: 'Knoblauchzehe(n)',
			Ei: 'Ei(er)',
			Eier: 'Ei(er)',
			Hähnchenbrustfilet: 'Hähnchenbrustfilet(s)',
			Hähnchenbrustfilets: 'Hähnchenbrustfilet(s)',
			Karotten: 'Karotte(n)',
			Karotte: 'Karotte(n)',
			Gurke: 'Gurke(n)',
			Gurken: 'Gurke(n)',
			Gewürzgurke: 'Gewürzgurke(n)',
			Gewürzgurken: 'Gewürzgurke(n)',
			Aubergine: 'Aubergine(n)',
			Auberginen: 'Aubergine(n)',
			Avocado: 'Avocado(s)',
			Avocados: 'Avocado(s)',
		};

		const pluralizeRegex = new RegExp(`\\b(${Object.keys(pluralizeMap).join('|')})\\b`, 'g');
		// Use the \\b word boundary to match only whole words, and the | operator to match either 'Tomate' or 'Tomaten'

		return str.replace(pluralizeRegex, (match) => pluralizeMap[match]);
		// replace all matches with the corresponding value in the pluralizeMap object
	},
};
