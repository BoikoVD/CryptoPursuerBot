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


let users = new Map();
let sendNotificationInterval = 10800000;
let resetNotificationInterval = 86400000;

bot.on('message', (msg) => {
	console.log('Msg(' + msg.chat.id + ') => ', msg.text);
});


bot.onText(/\/start/, (msg, match) => {
	let chatId = msg.chat.id;
	if (!users.has(chatId)) {
		users.set(chatId, new Map([
			['coins', []],
			['percentValue', 5],
			['isWorking', false]
		]));
	}
	bot.sendMessage(chatId, "Please use the /help command to learn more about my capabilities");
});

bot.onText(/\/addC (.+)/, (msg, match) => {
	let chatId = msg.chat.id;
	let enteredCoin = match[1].toUpperCase();
	let userCoins = users.get(chatId).get('coins');
	if (checkTheSameCoins(enteredCoin, userCoins)) {
		bot.sendMessage(chatId, "You have added this coin");
	} else {
		userCoins.push({ coinSymbol: enteredCoin, notified: false });
		bot.sendMessage(chatId, enteredCoin + " added");
	}
});
bot.onText(/\/delC (.+)/, (msg, match) => {
	let chatId = msg.chat.id;
	let enteredCoin = match[1].toUpperCase();
	let userCoins = users.get(chatId).get('coins');
	if (checkTheSameCoins(enteredCoin, userCoins)) {
		let index = userCoins.indexOf(enteredCoin);
		userCoins.splice(index, 1);
		bot.sendMessage(chatId, enteredCoin + " deleted");
	} else {
		bot.sendMessage(chatId, "You haven't added this coin");
	}
});
bot.onText(/\/showC/, (msg, match) => {
	let chatId = msg.chat.id;
	let userCoins = users.get(chatId).get('coins');
	if (userCoins.length === 0) {
		bot.sendMessage(chatId, "You haven't added any coins");
	} else {
		bot.sendMessage(chatId, toStringCoinList(userCoins));
	}
});

bot.onText(/\/setP (.+)/, (msg, match) => {
	let chatId = msg.chat.id;
	let newPercentValue = +match[1];
	if (Number.isNaN(newPercentValue)) {
		bot.sendMessage(chatId, "Please, enter a number");
	} else {
		if (newPercentValue < 0) {
			bot.sendMessage(chatId, "Please, enter a positive number");
		} else {
			users.get(chatId).set('percentValue', newPercentValue);
			bot.sendMessage(chatId, "A new percentage value has been set");
		}
	}
});
bot.onText(/\/showP/, (msg, match) => {
	let chatId = msg.chat.id;
	let percentValue = users.get(chatId).get('percentValue');
	bot.sendMessage(chatId, "Set percentage value = " + percentValue + "%");
});

bot.onText(/\/beginP/, (msg, match) => {
	const chatId = msg.chat.id;
	if (users.get(chatId).get('coins').length === 0) {
		bot.sendMessage(chatId, 'You have not added any coins. Please, add a coin symbol to your pursuing list using the command /addC')
	} else {
		users.get(chatId).set('isWorking', true);
		bot.sendMessage(chatId, 'Pursuering started');
	}
});
bot.onText(/\/breakP/, (msg, match) => {
	const chatId = msg.chat.id;
	users.get(chatId).set('isWorking', false);
	bot.sendMessage(chatId, 'Pursuering stopped');
});

bot.onText(/\/help/, (msg, match) => {
	bot.sendMessage(msg.chat.id, `Commands:

	/addC {coin symbol} - to add coin symbol to pursuing list. 
	Example: addC btc
	/delC {coin symbol} - to delete coin symbol from pursuing list. 
	Example: delC btc
	/showC - to show all coins added to your pursuing list

	/setP {percentage value} - to set percentage value.
	Example: setP 10
	/showP - to show your percentage value

	/beginP - to start pursuing
	/breakP - to stop pursuing

	/help - to show all commands
	`);
});


setInterval(() => { sendNotifications() }, sendNotificationInterval);
setInterval(() => { resetNotification(users) }, resetNotificationInterval);


function checkTheSameCoins(enteredCoin, coinList) {
	for (let coin of coinList) {
		if (coin.coinSymbol === enteredCoin) {
			return true;
		}
	}
	return false;
}
function toStringCoinList(coinList) {
	let str = 'You are pursuing:\n';
	for (let i = 0; i <= coinList.length - 1; i++) {
		if (i == coinList.length - 1) {
			str += coinList[i].coinSymbol;
		} else {
			str += coinList[i].coinSymbol + ', ';
		}
	}
	return str;
}
function resetNotification(users) {
	for (let user of users.values()) {
		for (let coin of user.get('coins')) {
			coin.notified = false;
		}
	}
}
async function sendNotifications() {
	await rp(requestOptions).then(response => {
		sendMessages(response, users)
	}).catch((err) => {
		console.log('API call error:', err.message);
	});
}
function sendMessages(response, users) {
	for (let user of users) {
		let userId = user[0];
		let userData = user[1];
		let userPercent = userData.get('percentValue');

		if (userData.get('isWorking')) {
			for (let data of response.data) {
				for (let coin of userData.get('coins')) {
					if (coin.coinSymbol === data.symbol &&
						userPercent <= data.quote.USD.percent_change_24h &&
						coin.notified === false
					) {
						bot.sendMessage(userId, 'Coin ' + coin.coinSymbol + ' up over than ' + userPercent + '%');
						coin.notified = true;
					}
				}
			}
		}

	}
}
