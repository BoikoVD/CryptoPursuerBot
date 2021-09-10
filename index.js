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
		'limit': '2000',
		'convert': 'USD',
	},
	headers: {
		'X-CMC_PRO_API_KEY': TOKENS.CMC_TOKEN
	},
	json: true,
	gzip: true
};

//===========================================================
console.log('Bot has been started.');

let userCoinLists = new Map();
let userPercentValues = new Map();
let coinCounter = new Map();
let workedUsers = [];
let responseCMC;

bot.on('message', (msg) => {
	console.log('Message(' + msg.chat.id + ') => ', msg.text);
});

//COMMANDS
bot.onText(/\/start/, (msg, match) => {
	if (userCoinLists.has(msg.chat.id)) { } else {
		userCoinLists.set(msg.chat.id, []);
		userPercentValues.set(msg.chat.id, 5);
		coinCounter.set(msg.chat.id, []);
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
		//bot.sendMessage(msg.chat.id, JSON.stringify(coinList, null, 2));
		bot.sendMessage(msg.chat.id, toStringCoinList(coinList));
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

bot.onText(/\/beginP/, (msg, match) => {
	const chatId = msg.chat.id;
	if (userCoinLists.get(chatId).length == 0) {
		bot.sendMessage(chatId, 'You have not added any coins. Please, add a coin symbol to your pursuing list using the command /addC')
	} else {
		workedUsers.push(chatId);
		for (let countList of coinCounter.values()) {
			for (let i = 0; i < userCoinLists.get(chatId).length; i++) {
				countList[i] = false;
			};
		}
		console.log('user ' + chatId + ' started pursuering');
		bot.sendMessage(chatId, 'Pursuering started');
	}
});
bot.onText(/\/breakP/, (msg, match) => {
	const chatId = msg.chat.id;
	let userNum = workedUsers.indexOf(chatId);
	workedUsers.splice(userNum, 1);
	console.log('user ' + chatId + ' stopped pursuering');
	bot.sendMessage(chatId, 'Pursuering stopped');
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

	/beginP - to start pursuing
	/breakP - to stop pursuing

	/help - to show all commands
	`);
});

//MainActions
setInterval(check, 3600000);
setInterval(() => {
	for (let countList of coinCounter.values()) {
		for (let i = 0; i < countList.length; i++) {
			countList[i] = false;
		};
	}
	console.log('Counter reseted');
}, 86400000);

//FUNCTIONS
async function check() {
	await getCMCResponse();
	sendAnswer(responseCMC, workedUsers);
}
async function getCMCResponse() {
	await rp(requestOptions).then(response => {
		responseCMC = response;
	}).catch((err) => {
		console.log('API call error:', err.message);
	});
}
function sendAnswer(response, workedUsers) {
	for (let wUser of workedUsers) {
		for (let user of userCoinLists) {
			let userId = user[0];
			if (wUser == userId) {
				let coinList = user[1];
				let counterCoin = coinCounter.get(userId);
				let userPercent = userPercentValues.get(userId);
				for (let i = 0; i < Object.keys(response.data).length; i++) {
					for (let j = 0; j < coinList.length; j++) {
						if (coinList[j] == response.data[i].symbol &&
							userPercent <= response.data[i].quote.USD.percent_change_24h &&
							counterCoin[j] == false
						) {
							bot.sendMessage(userId, 'Coin \'' + coinList[j] + '\' up over than ' + userPercent + '%');
							counterCoin[j] = true;
						}
					}
				}
			}
		}
	}
}
function toStringCoinList(coinList) {
	let str = 'You are pursuing:\n';
	for (let i = 0; i <= coinList.length - 1; i++) {
		if (i == coinList.length - 1) {
			str += coinList[i];
		} else {
			str += coinList[i] + ', ';
		}
	}
	return str;
}