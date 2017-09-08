const realMaxDepth = 8;

function Camera(o, d, fov = 90) {
	if (d == null) {
		this.O = new V(o.O);
		this.tl = new V(o.tl);
		this.right = new V(o.right);
		this.down = new V(o.down);
		this.TopBottom = new V(o.TopBottom);
		this.LeftRight = new V(o.LeftRight);

		this.lensSize = o.lensSize;
		this.focalDistance = o.focalDistance;
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
	const lensx = xor32() - .5;
	const lensy = xor32() - .5;
	const lensPos = mul(this.right, lensx).add(mul(this.down, lensy)).mul(this.lensSize);
	const d = mul(this.LeftRight, x).add(mul(this.TopBottom, y)).add(this.tl).sub(lensPos);
	const r = new Ray(lensPos.add(this.O), d.normalize());
	return r;
};

Camera.prototype.keyEvent = function (e) {
	let changed = false;
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
	let changed = false;
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
	const r = this.getRay(x, y);
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

	const ar = ctx.canvas.width / ctx.canvas.height;
	if (ar > 1)
		this.LeftRight.mul(ar);
	else
		this.TopBottom.mul(1 / ar);
	this.tl = mul(this.D, this.focalDistance).sub(add(this.LeftRight, this.TopBottom));

	this.LeftRight.mul(2 / ctx.canvas.width);
	this.TopBottom.mul(2 / ctx.canvas.height);
	for (let worker of workers)
		worker.postMessage({ type: "setCamera", camera: this });
	reset();
};
