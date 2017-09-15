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
		this.traceFocalDistance(ctx.canvas.width / 2, ctx.canvas.height / 2);
		ctx.canvas.addEventListener('mousemove', this.mouseEvent.bind(this));
		ctx.canvas.addEventListener('mouseup', this.mouseEvent.bind(this));
		window.addEventListener('contextmenu', (e) => {
			e.preventDefault();
		});
		window.addEventListener('keydown', this.keyEvent.bind(this));
		window.addEventListener('keyup', this.keyEvent.bind(this));
	}
};

Camera.prototype.getRay = function (x, y) {
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
	const speed = 0.4;
	let changed = false;
	if (e.type == 'keydown') {
		if (e.which == 87) {
			this.O.add(mulf(this.D, speed));
			changed = true;
		} else if (e.which == 83) {
			this.O.add(mulf(this.D, -speed));
			changed = true;
		}

		if (e.which == 68) {
			this.O.add(mulf(this.right, speed));
			changed = true;
		} else if (e.which == 65) {
			this.O.add(mulf(this.right, -speed));
			changed = true;
		}

		if (e.which == 81) {
			this.O.add(mulf(this.up, speed));
			changed = true;
		} else if (e.which == 90) {
			this.O.add(mulf(this.up, -speed));
			changed = true;
		}

		if (e.which == 82) {
			this.lensSize += 0.01;
			changed = true;
		} else if (e.which == 70 && this.lensSize >= 0.01) {
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
	console.log(e.button, e.buttons);
	if (e.buttons & 1) {
		this.D.sub(mulf(this.right, e.movementX * 0.001)).add(mulf(this.up, e.movementY * 0.005)).normalize();
		changed = true;
	}

	if (e.buttons & 2) {
		this.O.sub(mulf(this.right, e.movementX * 0.04)).add(mulf(this.up, e.movementY * 0.04));
		changed = true;
	}

	if (e.buttons & 4) {
		this.traceFocalDistance(e.offsetX, e.offsetY, false);
		changed = true;
	}
	//this.maxDepth = changed ? 1 : realMaxDepth;
	if (changed)
		this.update();
	e.preventDefault();
}

Camera.prototype.traceFocalDistance = function (x, y, update = true) {
	const r = this.getRay(x, y);
	intersect(r);
	this.focalDistance = Math.min(100, dot(mulf(r.D, r.t), this.D));
	if (isNaN(this.focalDistance))
		this.focalDistance = 1;
	console.log('Focal distance: ', this.focalDistance);
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
		worker.postMessage({ type: 'setCamera', camera: this });
	shouldReset = true;
};
