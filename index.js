const { TOKENS } = require('./tokens.js');

const TelegramBot = require('node-telegram-bot-api');
const token = TOKENS.TEL_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const rp = require('request-promise');
const requestOptions = {
	method: 'GET',
	uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest',
	qs: {
		'start': '1',
		'limit': '1',
		'convert': 'USD',
		'percent_change_24h_min': '5',
	},
	headers: {
		'X-CMC_PRO_API_KEY': TOKENS.CMC_TOKEN
	},
	json: true,
	gzip: true
};


rp(requestOptions).then(response => {
	console.log('API call response:', response);
}).catch((err) => {
	console.log('API call error:', err.message);
});


bot.on('message', (msg) => {
	console.log('Message = ', msg.text);
});