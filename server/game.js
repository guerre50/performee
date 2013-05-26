/**************************************************
** NODE.JS REQUIREMENTS
**************************************************/
var util = require("util"),					
	io = require("socket.io"),		
	express = require("express"),				
	params = require('express-params'),
	uuid = require('node-uuid'),
	Player = require("./Player").Player,	
	app = express(),
	active,
	config = {
		allowedDomains: "http://ec2-54-229-20-181.eu-west-1.compute.amazonaws.com:9093"
	},
	halls = [];


/**************************************************
** SERVER CONFIG
**************************************************/
//CORS middleware
var crossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', config.allowedDomains);
    res.header('Access-Control-Allow-Methods', 'GET,POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
};

params.extend(app);

app.configure(function() {
	app.use(express.bodyParser());
	app.use(crossDomain);
});


app.get('/halls/:id', function(req, res) {
	var id = req.params.id,
		hall,
		message,
		code;

	if (id) {
		hall = halls[id];

		if (hall) {
			message = hall;
			status = 200;
		} else {
			message = {error: "Id not stored"};
			status = 404;
		}
	} else {
		message = {error: "Invalid id"};
		status = 404;
	}

    res.json(message, status);
});

app.post("/api/halls", function(req, res) {
	var url = req.body.url,
		hall;

    console.log(url);
	if (url.indexOf("embed") != -1) {
		hall = halls.findByURL(url);
		
		if (!hall) {
			hall = {id: uuid.v4(), url: url};
			halls[hall.id] = hall;
		}
		console.log(hall);
		
		res.json(hall, 201);
	}

	res.json({error: "Invalid url"}, 400);
});

app.listen(9091);

/**************************************************
** GAME VARIABLES
**************************************************/
var socket,		// Socket controller
	players;	// Array of connected players


/**************************************************
** INITIALISATION
**************************************************/
function init() {
	// Create an empty array to store players
	players = [];

	// Set up Socket.IO to listen on port 8000
	socket = io.listen(9092);

	// Configure Socket.IO
	socket.configure(function() {
		// Only use WebSockets
		socket.set("transports", ["websocket"]);

		// Restrict log output
		socket.set("log level", 2);
	});

	// Start listening for events
	setEventHandlers();
};


/**************************************************
** GAME EVENT HANDLERS
**************************************************/
var setEventHandlers = function() {
	// Socket.IO
	socket.sockets.on("connection", onSocketConnection);
};

// New socket connection
function onSocketConnection(client) {
	util.log("New player has connected: "+client.id);

	// Listen for client disconnected
	client.on("disconnect", onClientDisconnect);

	// Listen for new player message
	client.on("new player", onNewPlayer);

	// Listen for move player message
	client.on("move player", onMovePlayer);
};

// Socket client has disconnected
function onClientDisconnect() {
	util.log("Player has disconnected: "+this.id);

	var removePlayer = playerById(this.id);

	// Player not found
	if (!removePlayer) {
		util.log("Player not found: "+this.id);
		return;
	};

	// Remove player from players array
	players.splice(players.indexOf(removePlayer), 1);

	// Broadcast removed player to connected socket clients
	this.broadcast.emit("remove player", {id: this.id});
};

// New player has joined
function onNewPlayer(data) {
	console.log(data);
	// Create a new player
	var newPlayer = new Player(data.x, data.y);
	newPlayer.id = this.id;

	// Broadcast new player to connected socket clients
	this.broadcast.emit("new player", {id: newPlayer.id, x: newPlayer.getX(), y: newPlayer.getY()});

	// Send existing players to the new player
	var i, existingPlayer;
	for (i = 0; i < players.length; i++) {
		existingPlayer = players[i];
		this.emit("new player", {id: existingPlayer.id, x: existingPlayer.getX(), y: existingPlayer.getY()});
	};
		
	// Add new player to the players array
	players.push(newPlayer);
	console.log(players.length);
};

// Player has moved
function onMovePlayer(data) {
	// Find player in array
	var movePlayer = playerById(this.id);
	
	// Player not found
	if (!movePlayer) {
		util.log("Player not found: "+this.id);
		return;
	};

	// Update player position
	movePlayer.setX(data.x);
	movePlayer.setY(data.y);

	// Broadcast updated position to connected socket clients
	this.broadcast.emit("move player", {id: movePlayer.id, x: movePlayer.getX(), y: movePlayer.getY()});
};


/**************************************************
** GAME HELPER FUNCTIONS
**************************************************/
// Find player by ID
function playerById(id) {
	var i;
	for (i = 0; i < players.length; i++) {
		if (players[i].id == id)
			return players[i];
	};
	
	return false;
};


/**************************************************
** RUN THE GAME
**************************************************/
init();


/**************************************************
** UTILS
**************************************************/
halls.findByURL = function (url) {
    var hall = this.filter(function(url) {
        return item.url == url;
    })[0];

    return hall;
}