'use strict';

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
		'limit': '2',
		'convert': 'USD',
	},
	headers: {
		'X-CMC_PRO_API_KEY': TOKENS.CMC_TOKEN
	},
	json: true,
	gzip: true
};

//===========================================================
let userCoinLists = new Map();
let userPercentValues = new Map();

//COMMANDS
bot.onText(/\/start/, (msg, match) => {
	if (userCoinLists.has(msg.chat.id)) { } else {
		userCoinLists.set(msg.chat.id, []);
		userPercentValues.set(msg.chat.id, 5);
		console.log('New user ' + msg.chat.id + ' connected');
	}
	bot.sendMessage(msg.chat.id, "Please use the /help command to learn more about my capabilities");
});

bot.onText(/\/addC (.+)/, (msg, match) => {
	let coin = match[1].toUpperCase();
	let coinList = userCoinLists.get(msg.chat.id);
	if (coinList.includes(coin)) {
		bot.sendMessage(msg.chat.id, "You have added this coin");
	} else {
		coinList.push(coin);
		bot.sendMessage(msg.chat.id, coin + " added");
	}
});
bot.onText(/\/delC (.+)/, (msg, match) => {
	let coin = match[1].toUpperCase();
	let coinList = userCoinLists.get(msg.chat.id);
	if (coinList.includes(coin)) {
		let index = coinList.indexOf(coin);
		coinList.splice(index, 1);
		bot.sendMessage(msg.chat.id, coin + " deleted");
	} else {
		bot.sendMessage(msg.chat.id, "You haven't added this coin");
	}
});
bot.onText(/\/showC/, (msg, match) => {
	let coinList = userCoinLists.get(msg.chat.id);
	if (coinList.length == 0) {
		bot.sendMessage(msg.chat.id, "You haven't added any coins");
	} else {
		bot.sendMessage(msg.chat.id, JSON.stringify(coinList, null, 2));
	}
});

bot.onText(/\/setP (.+)/, (msg, match) => {
	let newPercentValue = +match[1];
	if (Number.isNaN(newPercentValue)) {
		bot.sendMessage(msg.chat.id, "Please, enter a number");
	} else {
		if (newPercentValue < 0) {
			bot.sendMessage(msg.chat.id, "Please, enter a positive number");
		} else {
			userPercentValues.set(msg.chat.id, newPercentValue);
			bot.sendMessage(msg.chat.id, "A new percentage value has been set");
		}
	}
});
bot.onText(/\/showP/, (msg, match) => {
	let percentValue = userPercentValues.get(msg.chat.id);
	bot.sendMessage(msg.chat.id, "Set percentage value = " + percentValue + "%");
});

bot.onText(/\/help/, (msg, match) => {
	bot.sendMessage(msg.chat.id, `Commands:

	/addC - to add coin symbol to pursuing list. 
	Example: addC btc
	/delC - to delete coin symbol from pursuing list. 
	Example: delC btc
	/showC - to show all coins added to your pursuing list

	/setP - to set percentage value.
	Example: setP 10
	/showP - to show your percentage value
	
	/help - to show all commands
	`);
});
//================

bot.on('message', (msg) => {
	console.log('Message(' + msg.chat.id + ') => ', msg.text);
});

/*
rp(requestOptions).then(response => {
	for (let i = 0; i < Object.keys(response).length; i++) {
		console.log(response.data[i].symbol);
		console.log(response.data[i].quote.USD.percent_change_7d);
	}
}).catch((err) => {
	console.log('API call error:', err.message);
});
*/

//===========================================================
/*
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
	console.log('user ' + chatId + ' started pursuering' + match);
	bot.sendMessage(chatId, 'Pursuering started');
});
bot.onText(/\/breakP/, (msg, match) => {
	const chatId = msg.chat.id;
	let userNum = users.indexOf(chatId);
	users.splice(userNum, 1);
	console.log('user ' + chatId + ' stopped pursuering');
	bot.sendMessage(chatId, 'Pursuering stopped');
});

bot.onText(/\/addC/, (msg, match) => {

});
bot.onText(/\/delC/, (msg, match) => {

});

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
*/