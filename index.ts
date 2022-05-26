import { API_KEY, SPACE_ID, ADMIN_ID, PASSWORD } from "./api-key";
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

// setup

const game = new Game(() => Promise.resolve({ apiKey: API_KEY }));
game.connect(SPACE_ID); // replace with your spaceId of choice
game.subscribeToConnection((connected) => console.log("connected?", connected));

var cards = [
	"Killer", "Killer", "President", "Assassin", "Hunter", "Gatherer"
];

var admins = new Set();
var myId;
admins.add(ADMIN_ID);

function shuffleArray(array: any[]) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
}

function sendRoles(myId: string) {
	shuffleArray(cards);
	var pIdx = 0;
	Object.keys(game.players).forEach((playerId) => {
		if (playerId == myId) return;
		game.chat(playerId, [], "", cards[pIdx]);
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
	// console.log(message);
	if (message.messageType === "DM") {
		if (admins.has(message.senderId)) {
			if (message.contents.toLowerCase().startsWith("roles:")) {
				setRoles(message.contents);
				return;
			}
			switch (message.contents.toLowerCase()) {
				case "play":
					sendRoles(message.recipient);
					break;
				default:
					let reply = "what? try sending play or \"roles: A,B,C,D...\". Or up/down/left/right/dance for fun.";
					game.chat(message.senderId, [], "", reply);
			}
			return;
		}
		switch (message.contents.toLowerCase()) {
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
			case PASSWORD:
				admins.add(message.senderId);
				break;
			default:
				let reply = "what? try sending up/down/left/right";
				if (message.contents.substring(0, 3).toLowerCase() === "how") {
					reply = "https://github.com/gathertown/twitch-plays-gather";
				}
				game.chat(message.senderId, [], "", reply);
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
			textStatus: "DM me to move!",
		},
	});
}, 2000); // wait two seconds before setting these just to give the game a chance to init
