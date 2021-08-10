import { TEL_TOKEN, CMC_TOKEN } from 'tokens.js';
const TelegramBot = require('node-telegram-bot-api');

const token = TEL_TOKEN;

const bot = new TelegramBot(token, { polling: true });

const rp = require('request-promise');
const requestOptions = {
	method: 'GET',
	uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest',
	qs: {
		'start': '1',
		'limit': '5000',
		'convert': 'USD'
	},
	headers: {
		'X-CMC_PRO_API_KEY': CMC_TOKEN
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
	console.log("MSGG");
});