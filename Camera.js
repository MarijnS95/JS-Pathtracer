const realMaxDepth = 8;
const world_up = new V(0, 1, 0);

function Camera(o, d, fov = 90) {
	if (d == null) {
		this.O = VectorAsmPushV(o.O);
		this.topLeft = VectorAsmPushV(o.topLeft);
		this.right = VectorAsmPushV(o.right);
		this.down = VectorAsmPushV(o.down);
		this.topBottom = VectorAsmPushV(o.topBottom);
		this.leftRight = VectorAsmPushV(o.leftRight);

		this.lensSize = o.lensSize;
		this.focalDistance = o.focalDistance;
		this.maxDepth = o.maxDepth;
	} else {
		this.fov = Math.tan(fov * Math.PI / 360);
		this.O = o;
		this.D = d;
		// this.topLeftVecVec = V.single(0);
		// this.rightVecVec = V.single(0);
		// this.downVecVec = V.single(0);
		// this.topBottomVecVec = V.single(0);
		// this.leftRightVecVec = V.single(0);
		// this.O = VectorAsmPushV(this.OVec);
		// this.D = VectorAsmPushV(this.DVec);
		// this.topLeft = VectorAsmPushV(this.topLeftVec);
		// this.right = VectorAsmPushV(this.rightVec);
		// this.down = VectorAsmPushV(this.downVec);
		// this.topBottom = VectorAsmPushV(this.topBottomVec);
		// this.leftRight = VectorAsmPushV(this.leftRightVec);

		this.maxDepth = realMaxDepth;
		this.lensSize = 0.02;
		this.focalDistance = 1;
		this.update();
		this.traceFocalDistance(ctx.canvas.width / 2, ctx.canvas.height / 2);
		ctx.canvas.addEventListener('mousemove', this.mouseEvent.bind(this));
		ctx.canvas.addEventListener('mousedown', this.mouseDown.bind(this));
		ctx.canvas.addEventListener('mouseup', this.mouseEvent.bind(this));
		ctx.canvas.addEventListener('mousedown', this.mouseEvent.bind(this));
		ctx.canvas.addEventListener('mouseout', this.mouseEvent.bind(this));
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

	if (!this.fov) {
		o = vectorAsm.Dup(this.right);
		vectorAsm.MulF(o, lensx);
		d = vectorAsm.Dup(this.down);
		vectorAsm.MulF(d, lensy);
		vectorAsm.Add(o, d);
		vectorAsm.MulF(o, this.lensSize);
		vectorAsm.Mov(d, this.leftRight);
		vectorAsm.MulF(d, x);
		const tmp = vectorAsm.Dup(this.topBottom);
		vectorAsm.MulF(tmp, y);
		vectorAsm.Add(d, tmp);
		vectorAsm.Mov(tmp, this.topLeft);
		vectorAsm.Add(d, tmp);
		vectorAsm.Sub(d, o);

		vectorAsm.Add(o, this.O);

		vectorAsm.Pop();
	} else {
		const lensPos = mulf(this.right, lensx).add(mulf(this.down, lensy)).mulf(this.lensSize);
		const dd = mulf(this.leftRight, x).add(mulf(this.topBottom, y)).add(this.topLeft).sub(lensPos);

		o = VectorAsmPushV(lensPos.add(this.O));
		d = VectorAsmPushV(dd);
	}
	vectorAsm.Norm(d);
	const r = new Ray(o, d);
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
			this.O.add(mulf(world_up, speed));
			changed = true;
		} else if (e.which == 90) {
			this.O.add(mulf(world_up, -speed));
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

Camera.prototype.mouseDown = function (e) {
	if (e.buttons & 4) {
		this.traceFocalDistance(e.offsetX, e.offsetY, false);
		this.update();
		e.preventDefault();
	}
};

Camera.prototype.mouseEvent = function (e) {
	let changed = false;
	if (e.buttons & 1) {
		this.D.sub(mulf(this.right, e.movementX * 0.001)).add(mulf(world_up, e.movementY * 0.005)).normalize();
		changed = true;
	}

	if (e.buttons & 2) {
		this.O.sub(mulf(this.right, e.movementX * 0.04)).sub(mulf(this.down, e.movementY * 0.04));
		changed = true;
	}

	if (e.buttons & 4) {
		this.traceFocalDistance(e.offsetX, e.offsetY, false);
		changed = true;
	}

	const mouseAway = e.type == 'mouseup' || e.type == 'mouseout' || e.buttons & 4;
	if (changed || mouseAway) {
		this.maxDepth = !mouseAway ? 1 : realMaxDepth;
		this.update();
		e.preventDefault();
	}
}

Camera.prototype.traceFocalDistance = function (x, y, update = true) {
	const r = this.getRay(x, y);
	intersect(r);
	vectorAsm.MulF(r.D, r.t)
	this.focalDistance = Math.min(100,
		vectorAsm.Dot(r.D, VectorAsmPushV(this.D)));
	r.pop();
	vectorAsm.Pop();
	if (isNaN(this.focalDistance) || this.focalDistance <= 0)
		this.focalDistance = 1;
	console.log('Focal distance: ', this.focalDistance);
	if (update)
		this.update();
}

Camera.prototype.update = function () {
	this.right = cross(world_up, this.D);
	this.down = cross(this.right, this.D);
	this.leftRight = mulf(this.right, this.fov * this.focalDistance);
	this.topBottom = mulf(this.down, this.fov * this.focalDistance);

	const ar = ctx.canvas.width / ctx.canvas.height;
	if (ar > 1)
		this.leftRight.mulf(ar);
	else
		this.topBottom.mulf(1 / ar);
	this.topLeft = mulf(this.D, this.focalDistance).sub(add(this.leftRight, this.topBottom));

	this.leftRight.mulf(2 / ctx.canvas.width);
	this.topBottom.mulf(2 / ctx.canvas.height);
	for (let worker of workers)
		worker.postMessage({ type: 'setCamera', camera: this });
	shouldReset = true;
};
