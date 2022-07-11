import { API_KEY, SPACE_ID, ADMIN_ID, PASSWORD } from "./config";
import { Game, MoveDirection } from "@gathertown/gather-game-client";
global.WebSocket = require("isomorphic-ws");

// Example for api-key file
/*
export const API_KEY = "theapikey";
// SpaceId is what follows app/ with forward slashes as backslashes. E.g.
// for https://app.gather.town/app/ASDF/my_room
// this ID is  "ASDF\\my_room"
export const SPACE_ID = "space_id\\name";
export const ADMIN_ID = "myplayerid";
// Password to use for admin control.
// _NOT SECURE_ Don't use any important password.
export const PASSWORD = "mypassword";
*/

// You can set the default roles here, or send them via "roles: A,B,C..." DM.
var cards = [
	"Killer", "Killer", "President", "Assassin", "Hunter", "Gatherer"
];

// setup

const game = new Game(() => Promise.resolve({ apiKey: API_KEY }));
game.connect(SPACE_ID); // replace with your spaceId of choice
game.subscribeToConnection((connected) => console.log("connected?", connected));

var admins = new Set<string>();
var myId;
admins.add(ADMIN_ID);
var players = new Set<string>();

function shuffleArray(array: any[]) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
}

function addPlayers(playerNames: Set<string>) {
  var reply = new Array<string>();
	var addedPlayers = new Array<string>();
	var alreadyPlaying = new Array<string>();
	console.log("Adding players: ", playerNames);
	Object.keys(game.players).forEach((playerId) => {
		const playerName = game.players[playerId].name;
		if (playerNames.has(playerName.trim())) {
			if (players.has(playerId)) {
				alreadyPlaying.push(playerName);
			} else {
				console.log(`Added ${playerName}.`);
				players.add(playerId);
				addedPlayers.push(playerName);
			}
		}
	});
	if (addedPlayers.length > 0) {
		reply.push("Added: " + addedPlayers.join(", "));
	}
	if (alreadyPlaying.length > 0) {
		reply.push(" Player(s) already playing: " + alreadyPlaying.join(", "));
	}
	if (reply.length > 0) {
		return reply.join(". ");
	} else {
		return "No players found";
	}
}

function removePlayers(playerNames: Set<string>) {
  var reply = new Array<string>();
	var removedPlayers = new Array<string>();
	var notPlaying = new Array<string>();
	Object.keys(game.players).forEach((playerId) => {
		const playerName = game.players[playerId].name;
		if (playerNames.has(playerName.trim())) {
			if (players.has(playerId)) {
				players.delete(playerId);
				removedPlayers.push(playerName);
			} else {
				notPlaying.push(playerName);
			}
		}
	});
	if (removedPlayers.length > 0) {
		reply.push("Removed: " + removedPlayers.join(", "));
	}
	if (notPlaying.length > 0) {
		reply.push(" Player(s) not playing: " + notPlaying.join(", "));
	}
	if (reply.length > 0) {
		return reply.join(". ");
	} else {
		return "No players found";
	}
}

function getPlayerNames(myId: string, recipient: string) {
	var playerNames = new Array<string>();
	// Object.keys(game.players).forEach((playerId) => {
	players.forEach((playerId) => {
		if (playerId == myId) return;
		if (!(playerId in game.players)) {
			admins.forEach((adminId) => {
				game.chat(recipient, [], "", "An expected player is missing, skipping...");
			});
			return;
		}
		playerNames.push(game.players[playerId].name);
	});
	return "Player List: " + playerNames.join(", ");
}

function strToList(str: string) {
	return str.split(',').map((e) => e.trim());
}

function sendRoles(myId: string) {
	shuffleArray(cards);
	var pIdx = 0;
	// Object.keys(game.players).forEach((playerId) => {
	players.forEach((playerId) => {
		if (playerId == myId) return;
		if (!(playerId in game.players)) {
			admins.forEach((adminId) => {
				game.chat(adminId, [], "", "An expected player is missing, skipping...");
			});
			return;
		}
		game.chat(playerId, [], "", "Here is your role! You are: " + cards[pIdx]);
		pIdx++;
	});
}

function setRoles(message: string) {
	cards = message.split(':')[1].split(',').map((e) => e.trim());
}


// listen for chats and move
game.subscribeToEvent("playerChats", (data, _context) => {
	// console.log("playerChats");
	// console.log(data);
	// console.log(_context);
	const message = data.playerChats;
	const senderId = message.senderId;
	const sender = game.players[senderId];
	const myId = message.recipient;
	let reply = "";
	// console.log(message);
	if (message.messageType === "DM") {
		if (admins.has(senderId)) {
			if (message.contents.toLowerCase().startsWith("roles:")) {
				setRoles(message.contents);
			  reply = "Roles set!";
			} else if (message.contents.toLowerCase().startsWith("add:")) {
				reply = addPlayers(new Set(strToList(message.contents.split(':')[1])));
			} else if (message.contents.toLowerCase().startsWith("remove:")) {
				reply = removePlayers(new Set(strToList(message.contents.split(':')[1])));
			} else {
				switch (message.contents.toLowerCase()) {
		  		case PASSWORD:
		  			reply = "You're already an admin.";
		  			break;
					case "play":
				  	reply = "Sending out roles!";
						sendRoles(myId);
						break;
					case "count":
						reply = "There are " + players.size + " players.";
						break;
					case "players":
						reply = getPlayerNames(myId, senderId);
						break;
					case "reset":
						players.clear();
						reply = "Player list cleared";
						break;
				  case "come":
				  	game.teleport(sender.map, sender.x, sender.y);
				  	break;
				  case "up":
				  	game.move(MoveDirection.Up);
				  	break;
				  case "down":
				  	game.move(MoveDirection.Down);
				  	break;
				  case "left":
				  	game.move(MoveDirection.Left);
				  	break;
				  case "right":
				  	game.move(MoveDirection.Right);
				  	break;
				  case "dance":
				  	game.move(MoveDirection.Dance);
				  	break;
				  case "join":
				  	players.add(senderId);
				  	reply = "Welcome to the game! I'll send you a role when it's time to start.";
				  	break;
				  case "leave":
				  	players.delete(senderId);
				  	reply = "Thanks for playing!";
				  	break;
					default:
						reply = "what? try sending play/count/players/reset/come/join/leave, 'roles: A,B,C,D...', 'add: PlayerName', or 'remove: PlayerName'. Or up/down/left/right/dance for fun.";
				}
			}
		} else {
		  switch (message.contents.toLowerCase()) {
		  	case PASSWORD:
		  		admins.add(senderId);
		  		reply = "Welcome admin!";
		  		break;
		  	case "join":
		  		players.add(senderId);
		  		reply = "Welcome to the game! I'll send you a role when it's time to start.";
		  		break;
		  	case "leave":
		  		players.delete(senderId);
		  		reply = "Thanks for playing!";
		  		break;
		  	default:
		  		reply = "What? Send 'join' to play or 'leave' to stop playing.";
		  		if (message.contents.substring(0, 3).toLowerCase() === "how") {
		  			reply = "https://github.com/gathertown/twitch-plays-gather";
		  		}
		  }
		}
		if (reply != "") {
			game.chat(senderId, [], "", reply);
		}
	}
});

// name and status setup
setTimeout(() => {
	console.log("setting name and status");
	game.engine.sendAction({
		$case: "setName",
		setName: {
			name: "RoboGameMaster",
		},
	});
	game.engine.sendAction({
		$case: "setTextStatus",
		setTextStatus: {
			textStatus: "DM me to play!",
		},
	});
}, 2000); // wait two seconds before setting these just to give the game a chance to init
