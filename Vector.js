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
	if (b instanceof V)
		return new V(a.x * b.x, a.y * b.y, a.z * b.z);
	else
		return new V(a.x * b, a.y * b, a.z * b);
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

function V(x, y, z) {
	this.x = x;
	this.y = y;
	this.z = z;
	if (y == null)
		this.y = x;
	if (z == null)
		this.z = x;
	//console.log(this);
}

V.prototype.add = function (v) {
	this.x += v.x;
	this.y += v.y;
	this.z += v.z;
}

V.prototype.mul = function (f) {
	if (f instanceof V) {
		this.x *= f.x;
		this.y *= f.y;
		this.z *= f.z;
	} else {
		this.x *= f;
		this.y *= f;
		this.z *= f;
	}
}

V.prototype.print = function (pre = "") {
	console.log(pre + "<" + this.x + ", " + this.y + ", " + this.z + ">");
}