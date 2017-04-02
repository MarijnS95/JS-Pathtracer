var realMaxDepth = 8;

function Camera(o, d, fov = 90) {
	if (d == null) {
		this.O = o.O;
		this.tl = o.tl;
		this.right = o.right;
		this.down = o.down;
		this.camScale = o.camScale;
	} else {
		this.fov = Math.tan(fov * Math.PI / 360);
		this.O = o;
		this.D = d;
		this.maxDepth = realMaxDepth;
		this.update();
		ctx.canvas.addEventListener("mousemove", this.mouseEvent.bind(this));
		ctx.canvas.addEventListener("mouseup", this.mouseEvent.bind(this));
		window.addEventListener("keydown", this.keyEvent.bind(this));
		window.addEventListener("keyup", this.keyEvent.bind(this));
	}
};

Camera.prototype.getRay = function (x, y) {
	//return new Ray(normalize(new V((x / 512 - 0.5) * this.fov, (0.5 - y / 512) * this.fov, 1)));
	var d = add(add(this.tl, mul(this.right, x * this.camScale)), mul(this.down, y * this.camScale));
	var nd = normalize(d);
	var r = new Ray(nd);
	r.O = this.O;
	return r;
};

Camera.prototype.keyEvent = function (e) {
	var changed = false;
	if (e.type == "keydown") {
		if (e.which == 87) {
			this.O.add(mul(this.D, 0.01));
			changed = true;
		} else if (e.which == 83) {
			this.O.add(mul(this.D, -0.01));
			changed = true;
		}

		if (e.which == 68) {
			this.O.add(mul(this.right, 0.01));
			changed = true;
		} else if (e.which == 65) {
			this.O.add(mul(this.right, -0.01));
			changed = true;
		}

		if (e.which == 82) {
			this.O.add(mul(this.up, 0.01));
			changed = true;
		} else if (e.which == 70) {
			this.O.add(mul(this.up, -0.01));
			changed = true;
		}
	}
	this.maxDepth = changed ? 0 : realMaxDepth;
	if (changed)
		this.update();
};

Camera.prototype.mouseEvent = function (e) {
	var changed = false;
	if (e.buttons & 1 == 1) {
		this.D = normalize(add(sub(this.D, mul(this.right, e.movementX * 0.001)), mul(this.up, e.movementY * 0.005)));
		changed = true;
	}
	this.maxDepth = changed ? 0 : realMaxDepth;
	if (changed)
		this.update();
};

Camera.prototype.update = function () {
	this.up = new V(0, 1, 0);
	this.right = cross(this.up, this.D);
	//d.print();
	//this.up.print("up: ");
	//this.right.print("right: ");
	this.down = mul(cross(this.right, this.D), this.fov);
	//this.down.print("down: ");
	this.right = mul(this.right, this.fov);
	//eventually multiply d with it's corresponding 
	this.tl = add(this.D, add(neg(this.right), neg(this.down)));
	this.down.mul(2);
	this.right.mul(2);
	this.camScale = 1 / 512;
	for (var i = 0; i < workers.length; i++)
		workers[i].postMessage({ type: "setCamera", camera: this });
	reset();
};