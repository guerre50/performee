/**************************************************
** GAME VARIABLES
**************************************************/
var localPlayer,	
	remotePlayers,	
	socket = undefined,			
	world,
	keyboard,
	camera,
	factor,
	delta;


/**************************************************
** GAME INITIALISATION
**************************************************/
function init() {
	world = tQuery.createWorld().boilerplate().start();
	keyboard = new THREEx.KeyboardState();
	camera = world.tCamera();
	factor	= 20;

	world.removeCameraControls();
	world.tRenderer().setClearColor("black", world.tRenderer().getClearAlpha() );
	tQuery.createAmbientLight().addTo(world).color(0x444444);
	tQuery.createDirectionalLight().addTo(world).position(-1,1,1).color(0xFF88BB).intensity(3);
	tQuery.createDirectionalLight().addTo(world).position( 1,1,-1).color(0x4444FF).intensity(2);

	world.tCamera().position.z	= factor;

	//world.addEffectComposer().bloom(1.5).finish();

	// create the headTracker
    var headTracker = tQuery.createHeadtrackr({
		headtrackrOpts	: {
			calcAngles	: false
		}
	}).start();
    headTracker.debugView(true);

	// Initialise the local player
	localPlayer = new Player();

    // make the camera move depending on facetrackingEvent
    headTracker.addEventListener("found", function(event) {

    	localPlayer.setPosition({x: event.x*factor, y : event.y*factor});
        /*localPlayer.object.rotationZ(event.angle)
            .positionX(event.x*factor).positionY(event.y*factor)
            .scaleX(event.width).scaleY(event.height);	*/

        localPlayer.send();
    });
	
	tQuery.createPlane().addTo(world)
		.scaleBy(14.5,11.1,15)
		.setBasicMaterial()
			.opacity(0)
			.blending(THREE.Linear)
			.color('black')
			.back();
		
	var rendererCSS	= new THREE.CSS3DRenderer();
	rendererCSS.setSize( window.innerWidth, window.innerHeight );
	rendererCSS.domElement.style.position	= 'absolute';
	rendererCSS.domElement.style.top	= 0;
	rendererCSS.domElement.style.margin	= 0;
	rendererCSS.domElement.style.padding	= 0;
	document.body.appendChild( rendererCSS.domElement );

	THREEx.WindowResize.bind(rendererCSS, world.camera().get(0));		

	// put the mainRenderer on top
	var rendererMain	= world.tRenderer();
	rendererMain.domElement.style.position	= 'absolute';
	rendererMain.domElement.style.top	= 0;
	rendererMain.domElement.style.zIndex	= 1;
	rendererCSS.domElement.appendChild( rendererMain.domElement );

	var element	= document.createElement('iframe')
	element.src	= 'http://www.youtube.com/embed/wZZ7oFKsKzY?rel=0'
	element.style.width = '920px';
	element.style.height = '720px';

	var sceneCSS	= new THREE.Scene();
	var objectCSS 	= new THREE.CSS3DObject( element );
	window.objectCSS	= objectCSS

	objectCSS.scale.multiplyScalar(1/63.5)
	sceneCSS.add( objectCSS );

	world.loop().hookPostRender(function(delta, now) {
		rendererCSS.render(sceneCSS, world.tCamera());

		localPlayer.update(delta);
	});
	world.hook(function() {
		TWEEN.update();
	});

	// Init multiplayer 
    socket = io.connect("http://ec2-46-51-150-16.eu-west-1.compute.amazonaws.com", {port: 9092, transports: ["websocket"]});
	remotePlayers = [];
};


/**************************************************
** GAME EVENT HANDLERS
**************************************************/
var setEventHandlers = function() {
	socket.on("connect", onSocketConnected);
	socket.on("disconnect", onSocketDisconnect);
	socket.on("new player", onNewPlayer);
	socket.on("move player", onMovePlayer);
	socket.on("remove player", onRemovePlayer);
};

// Socket connected
function onSocketConnected() {
	console.log("Connected to socket server");
	localPlayer.join();
};

// Socket disconnected
function onSocketDisconnect() {
	console.log("Disconnected from socket server");
};

// New player
function onNewPlayer(data) {
	console.log("New player connected: "+data.id);

	// Initialise the new player
	var newPlayer = new Player();
	newPlayer.id = data.id;

	// Add new player to the remote players array
	remotePlayers.push(newPlayer);
};

// Move player
function onMovePlayer(data) {
	var movePlayer = playerById(data.id);

	// Player not found
	if (!movePlayer) {
		console.log("Player not found: "+data.id);
		return;
	};

	movePlayer.receive(data);
};

// Remove player
function onRemovePlayer(data) {
	var removePlayer = playerById(data.id);

	// Player not found
	if (!removePlayer) {
		console.log("Player not found: "+data.id);
		return;
	};

	// Remove player from array
	remotePlayers.splice(remotePlayers.indexOf(removePlayer), 1);
};

/**************************************************
** GAME HELPER FUNCTIONS
**************************************************/
// Find player by ID
function playerById(id) {
	var i;
	for (i = 0; i < remotePlayers.length; i++) {
		if (remotePlayers[i].id == id)
			return remotePlayers[i];
	};
	
	return false;
};

init();
setEventHandlers();