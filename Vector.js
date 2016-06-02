function sub(a, b) {
	return new V(a.x - b.x, a.y - b.y, a.z - b.z);
}

function add(a, b) {
	return new V(a.x + b.x, a.y + b.y, a.z + b.z);
}

function dot(a, b) {
	return a.x * b.x + a.y * b.y + a.z * b.z;
}

function mul(a, b) {
	if (typeof b === "number")
		return new V(a.x * b, a.y * b, a.z * b);
	else
		return new V(a.x * b.x, a.y * b.y, a.z * b.z);
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

function V(x, y, z) {
	if (x instanceof V) {
		this.x = x.x;
		this.y = x.y;
		this.z = x.z;
	} else {
		this.x = x;
		this.y = y;
		this.z = z;
		if (y == null)
			this.y = x;
		if (z == null)
			this.z = x;
	}
	//console.log(this);
}

V.prototype.add = function (v) {
	this.x += v.x;
	this.y += v.y;
	this.z += v.z;
}

V.prototype.mul = function (f) {
	if (typeof f === "number") {
		this.x *= f;
		this.y *= f;
		this.z *= f;
	} else {
		this.x *= f.x;
		this.y *= f.y;
		this.z *= f.z;
	}
}

V.prototype.print = function (pre = "") {
	console.log(pre + "<" + this.x + ", " + this.y + ", " + this.z + ">");
}

function frameMul(N, v) {
	var nabs = abs(N);
	var t = new V(N);
	if (nabs.x <= nabs.y && nabs.x <= nabs.z)
		t.x = 1;
	else if (nabs.y <= nabs.x && nabs.y <= nabs.z)
		t.y = 1;
	else
		t.z = 1;

	var c = cross(t, N);
	var T = normalize(c);
	var B = cross(T, N);
	return add(mul(T, v.x), add(mul(B, v.y), mul(N, v.z)));
}