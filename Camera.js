const realMaxDepth = 8;

function Camera(o, d, fov = 90) {
	if (d == null) {
		this.O = V.copy(o.O);
		this.tl = V.copy(o.tl);
		this.right = V.copy(o.right);
		this.down = V.copy(o.down);
		this.TopBottom = V.copy(o.TopBottom);
		this.LeftRight = V.copy(o.LeftRight);

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
	//return new Ray(normalize(V.single(x / 512 - 0.5) * this.fov, (0.5 - y / 512) * this.fov, 1)));
	x += xor32();
	y += xor32();
	const lensx = xor32() - .5;
	const lensy = xor32() - .5;
	const lensPos = mulf(this.right, lensx).add(mulf(this.down, lensy)).mulf(this.lensSize);
	const d = mulf(this.LeftRight, x).add(mulf(this.TopBottom, y)).add(this.tl).sub(lensPos);
	const r = new Ray(lensPos.add(this.O), d.normalize());
	return r;
};

Camera.prototype.keyEvent = function (e) {
	let changed = false;
	if (e.type == "keydown") {
		if (e.which == 87) {
			this.O.add(mulf(this.D, 0.01));
			changed = true;
		} else if (e.which == 83) {
			this.O.add(mulf(this.D, -0.01));
			changed = true;
		}

		if (e.which == 68) {
			this.O.add(mulf(this.right, 0.01));
			changed = true;
		} else if (e.which == 65) {
			this.O.add(mulf(this.right, -0.01));
			changed = true;
		}

		if (e.which == 82) {
			this.O.add(mulf(this.up, 0.01));
			changed = true;
		} else if (e.which == 70) {
			this.O.add(mulf(this.up, -0.01));
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
		this.D = add(sub(this.D, mulf(this.right, e.movementX * 0.001)), mulf(this.up, e.movementY * 0.005)).normalize();
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
	this.LeftRight = mulf(this.right, this.fov * this.focalDistance);
	this.TopBottom = mulf(this.down, this.fov * this.focalDistance);

	const ar = ctx.canvas.width / ctx.canvas.height;
	if (ar > 1)
		this.LeftRight.mulf(ar);
	else
		this.TopBottom.mulf(1 / ar);
	this.tl = mulf(this.D, this.focalDistance).sub(add(this.LeftRight, this.TopBottom));

	this.LeftRight.mulf(2 / ctx.canvas.width);
	this.TopBottom.mulf(2 / ctx.canvas.height);
	for (let worker of workers)
		worker.postMessage({ type: "setCamera", camera: this });
	reset();
};
