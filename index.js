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
		'limit': '5000',
		'convert': 'USD',
		'percent_change_24h_min': '5',
	},
	headers: {
		'X-CMC_PRO_API_KEY': TOKENS.CMC_TOKEN
	},
	json: true,
	gzip: true
};
//===========================================================
let pursueringCoins = [
	"BTC",
	"ETH",
	"BNB",
	"ICP",
	"SOL",
];

let users = [];

bot.onText(/\/startP/, (msg, match) => {
	const chatId = msg.chat.id;
	users.push(chatId);
	console.log('user ' + chatId + ' started pursuering');
	bot.sendMessage(chatId, 'Pursuering started');
});
bot.onText(/\/stopP/, (msg, match) => {
	const chatId = msg.chat.id;
	let userNum = users.indexOf(chatId);
	users.splice(userNum, 1);
	console.log('user ' + chatId + ' stopped pursuering');
	bot.sendMessage(chatId, 'Pursuering stopped');
});

let responseCMC;
setInterval(action, 60000);

bot.on('message', (msg) => {
	console.log('Message = ', msg.text);
});
//FUNCTIONS=============================================================
async function action() {
	await getCMCResponse();
	sendAnswer(responseCMC, pursueringCoins);
}

async function getCMCResponse() {
	await rp(requestOptions).then(response => {
		responseCMC = response;
	}).catch((err) => {
		console.log('API call error:', err.message);
	});
}

function sendAnswer(response, coinsArray, msgId) {
	if (users.length > 0) {
		for (let i = 0; i < Object.keys(response).length; i++) {
			for (let j = 0; j < coinsArray.length; j++) {
				if (response.data[i].symbol == coinsArray[j]) {
					for (let k = 0; k < users.length; k++) {
						bot.sendMessage(users[k], 'Coin ' + coinsArray[j] + ' up over than 5%')
					}
				}
			}
		}
	}
}