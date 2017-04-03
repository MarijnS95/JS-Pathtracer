var realMaxDepth = 8;

function Camera(o, d, fov = 90) {
	if (d == null) {
		this.O = o.O;
		this.tl = o.tl;
		this.right = o.right;
		this.down = o.down;
		this.lensSize = o.lensSize;
		this.focalDistance = o.focalDistance;
		this.TopBottom = o.TopBottom;
		this.LeftRight = o.LeftRight;
		this.maxDepth = o.maxDepth;
	} else {
		this.fov = Math.tan(fov * Math.PI / 360);
		this.O = o;
		this.D = d;
		this.maxDepth = realMaxDepth;
		this.lensSize = 0.02;
		this.focalDistance = 1;
		this.update();
		//this.traceFocalDistance();
		ctx.canvas.addEventListener("mousemove", this.mouseEvent.bind(this));
		ctx.canvas.addEventListener("mouseup", this.mouseEvent.bind(this));
		window.addEventListener("contextmenu", (e) => {
			e.preventDefault();
			e.stopPropagation();
		});
		window.addEventListener("keydown", this.keyEvent.bind(this));
		window.addEventListener("keyup", this.keyEvent.bind(this));
	}
};

Camera.prototype.getRay = function (x, y) {
	//return new Ray(normalize(new V((x / 512 - 0.5) * this.fov, (0.5 - y / 512) * this.fov, 1)));
	x += xor32();
	y += xor32();
	var lensx = xor32() - .5;
	var lensy = xor32() - .5;
	var lensPos = mul(add(mul(this.right, lensx), mul(this.down, lensy)), this.lensSize);
	var d = sub(add(add(this.tl, mul(this.LeftRight, x)), mul(this.TopBottom, y)), lensPos);
	var r = new Ray(add(this.O, lensPos), normalize(d));
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

		if (e.which == 84) {
			this.lensSize += 0.01;
			changed = true;
		} else if (e.which == 71 && this.lensSize >= 0.01) {
			this.lensSize -= 0.01;
			changed = true;
		}
	}
	//this.maxDepth = changed ? 1 : realMaxDepth;
	if (changed)
		this.update();
};

Camera.prototype.mouseEvent = function (e) {
	var changed = false;
	if (e.buttons & 1 == 1) {
		this.D = normalize(add(sub(this.D, mul(this.right, e.movementX * 0.001)), mul(this.up, e.movementY * 0.005)));
		changed = true;
	} else if (e.button == 2) {
		this.traceFocalDistance(e.offsetX, e.offsetY, false);
		changed = true;
	}
	//this.maxDepth = changed ? 1 : realMaxDepth;
	if (changed)
		this.update();
}

Camera.prototype.traceFocalDistance = function (x, y, update = true) {
	var r = this.getRay(x, y);
	intersect(r);
	this.focalDistance = Math.min(100, dot(mul(r.D, r.t), this.D));
	console.log("Focal distance: ", this.focalDistance);
	if (update)
		this.update();
}

Camera.prototype.update = function () {
	this.up = new V(0, 1, 0);
	this.right = cross(this.up, this.D);
	this.down = cross(this.right, this.D);
	this.LeftRight = mul(this.right, this.fov * this.focalDistance);
	this.TopBottom = mul(this.down, this.fov * this.focalDistance);

	var ar = ctx.canvas.width / ctx.canvas.height;
	if (ar > 1)
		this.LeftRight.mul(ar);
	else
		this.TopBottom.mul(1 / ar);
	//eventually multiply d with it's corresponding 
	this.tl = sub(mul(this.D, this.focalDistance), add(this.LeftRight, this.TopBottom));

	this.LeftRight.mul(2 / ctx.canvas.width);
	this.TopBottom.mul(2 / ctx.canvas.height);
	//this.tl.print("topLeft: ");
	for (var i = 0; i < workers.length; i++)
		workers[i].postMessage({ type: "setCamera", camera: this });
	reset();
};