function sub(a, b) {
	return new V(a.x - b.x, a.y - b.y, a.z - b.z);
}

function fsub(a, b) {
	return new V(a - b.x, a - b.y, a - b.z);
}

function subf(a, b) {
	return new V(a.x - b, a.y - b, a.z - b);
}

function add(a, b) {
	return new V(a.x + b.x, a.y + b.y, a.z + b.z);
}

function dot(a, b) {
	return a.x * b.x + a.y * b.y + a.z * b.z;
}

function mul(a, b) {
	if (b instanceof V)
		return new V(a.x * b.x, a.y * b.y, a.z * b.z);
	else
		return new V(a.x * b, a.y * b, a.z * b);
}

function div(a, b) {
	if (b instanceof V && a instanceof V)
		return new V(a.x / b.x, a.y / b.y, a.z / b.z);
	else if (b instanceof V)
		return new V(a / b.x, a / b.y, a / b.z);
	else
		return new V(a.x / b, a.y / b, a.z / b);
}

function normalize(v) {
	return mul(v, 1 / length(v));
}

function length(v) {
	return Math.sqrt(dot(v, v));
}

function reflect(d, n) {
	return sub(d, mul(n, 2 * dot(d, n)));
}

function cross(a, b) {
	return new V(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
}

function exp(v) {
	return new V(Math.exp(v.x), Math.exp(v.y), Math.exp(v.z));
}

function neg(v) {
	return new V(-v.x, -v.y, -v.z);
}

function abs(v) {
	return new V(Math.abs(v.x), Math.abs(v.y), Math.abs(v.z));
}

function min(a, b) {
	return new V(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.min(a.z, b.z));
}

function max(a, b) {
	return new V(Math.max(a.x, b.x), Math.max(a.y, b.y), Math.max(a.z, b.z));
}

function V(x, y, z) {
	if (typeof x === "number") {
		this.x = x;
		this.y = y;
		this.z = z;
		if (y == null)
			this.y = x;
		if (z == null)
			this.z = x;
	} else {
		this.x = x.x;
		this.y = x.y;
		this.z = x.z;
	}
	//console.log(this);
}

V.prototype.add = function (v) {
	if (v instanceof V) {
		this.x += v.x;
		this.y += v.y;
		this.z += v.z;
	} else {
		this.x += v;
		this.y += v;
		this.z += v;
	}
	return this;
}

V.prototype.sub = function (v) {
	if (v instanceof V) {
		this.x -= v.x;
		this.y -= v.y;
		this.z -= v.z;
	} else {
		this.x -= v;
		this.y -= v;
		this.z -= v;
	}
	return this;
}

V.prototype.mul = function (v) {
	if (v instanceof V) {
		this.x *= v.x;
		this.y *= v.y;
		this.z *= v.z;
	} else {
		this.x *= v;
		this.y *= v;
		this.z *= v;
	}
	return this;
}

V.prototype.set = function (x, y, z) {
	this.x = x;
	if (y == null)
		this.y = x;
	else
		this.y = y;
	if (z == null)
		this.z = x;
	else
		this.z = z;
	return this;
}

V.prototype.minidx = function () {
	if (this.y < this.x)
		return this.y < this.z ? 'y' : 'z';
	else // x < y
		return this.x < this.z ? 'x' : 'z';
}

V.prototype.maxidx = function () {
	if (this.y > this.x)
		return this.y > this.z ? 'y' : 'z';
	else // x > y
		return this.x > this.z ? 'x' : 'z';
}

V.prototype.normalize = function () {
	// Normalizes the current vector and returns it for chaining.
	this.mul(1 / length(this));
	return this;
}
V.prototype.normalized = function () {
	// Returns a new vector that is normalized.
	return mul(this, 1 / length(this));
}

V.prototype.print = function (pre = "") {
	console.log(pre + "<" + this.x + ", " + this.y + ", " + this.z + ">");
}

function frameMul(N, v) {
	const nabs = abs(N);
	const t = new V(N);
	if (nabs.x <= nabs.y && nabs.x <= nabs.z)
		t.x = 1;
	else if (nabs.y <= nabs.x && nabs.y <= nabs.z)
		t.y = 1;
	else
		t.z = 1;

	const T = cross(t, N).normalize();
	const B = cross(T, N);
	return T.mul(v.x).add(B.mul(v.y)).add(mul(N, v.z));
}
