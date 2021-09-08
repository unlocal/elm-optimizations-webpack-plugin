const path = require('path');

module.exports = function() {
	return {
		maskedIcon: path.join(__dirname, "icon.png"),
		maskableIcon: path.join(__dirname, "icon.png"),
	};
};
