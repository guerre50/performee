/**************************************************
** GAME PLAYER CLASS
**************************************************/
var Player = function() {
	var id,
		object = tQuery.createSphere().addTo(world),
		tween = undefined,
		lastReceive = undefined,
		delta = 200;

	var receive = function (data) {
		var now = new Date();
		if (lastReceive == undefined) lastReceive = now;
		else {
			delta = (now - lastReceive)/1000;
			lastReceive = now;
			setPosition(data);
		}
	};

	var send = function() {
		socket.emit("move player", {x: object.positionX(), y: object.positionY(), hall: hall});
	};

	var update = function(_delta) {
		delta = _delta;
	};

	var setPosition = function(data) {
		if (tween && tween.completed) {
			tween.stop;
			tween = undefined;
		}
		if (tween == undefined) {
			tween = new TWEEN.Tween(getPosition()).to(data, delta*1000)
				.easing(TWEEN.Easing.Elastic.InOut)
				.onUpdate(function() {
					object.positionX(this.x);
					object.positionY(this.y);
				}).start();
		} 
	};

	var getPosition = function() {
		return {x : object.positionX(), y : object.positionY() };
	};

	var join = function() {
		socket.emit("new player", {x: object.positionX(), y: object.positionY(), hall:hall});
	};

	var remove = function() {
		world.remove(object);
	};

	return {
		receive : receive,
		send : send,
		update : update,
		object : object,
		join : join,
		id : id,
		setPosition : setPosition,
		remove : remove
	};
};