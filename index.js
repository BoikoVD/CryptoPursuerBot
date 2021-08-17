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
let users = [];
let pursueringCoins = [
	'BTC',
	'SOL'
];

let coinNumbers = [];
for (let x of pursueringCoins) {
	coinNumbers.push(0);
}

bot.onText(/\/start/, (msg, match) => {
	console.log('New user ' + msg.chat.id + ' connected');
	bot.sendMessage(msg.chat.id, `Hello!
	Commands usage help:
	/start to start
	/beginP to start pursuering
	/breakP to stop pursuering`);
});
bot.onText(/\/beginP/, (msg, match) => {
	const chatId = msg.chat.id;
	users.push(chatId);
	console.log('user ' + chatId + ' started pursuering');
	bot.sendMessage(chatId, 'Pursuering started');
});
bot.onText(/\/breakP/, (msg, match) => {
	const chatId = msg.chat.id;
	let userNum = users.indexOf(chatId);
	users.splice(userNum, 1);
	console.log('user ' + chatId + ' stopped pursuering');
	bot.sendMessage(chatId, 'Pursuering stopped');
});
/*
bot.onText(/\/addC/, (msg, match) => {
	
});
bot.onText(/\/delC/, (msg, match) => {
	86400000
});
*/
let responseCMC;
setInterval(action, 60000);

setInterval(resetCoinNumbers, 86400000);

bot.on('message', (msg) => {
	console.log('Message = ', msg.text);
});

//FUNCTIONS=============================================================
async function action() {
	await getCMCResponse();
	sendAnswer(responseCMC, pursueringCoins);
}

function resetCoinNumbers() {
	for (let i = 0; i < pursueringCoins.length; i++) {
		coinNumbers[i] = 0;
	};
	console.log('Numbers reseted');
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
				if (response.data[i].symbol == coinsArray[j] && coinNumbers[j] == 0) {
					for (let k = 0; k < users.length; k++) {
						bot.sendMessage(users[k], 'Coin ' + coinsArray[j] + ' up over than 5%')
						coinNumbers[j] = 1;
					}
				}
			}
		}
	}
}