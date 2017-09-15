function sub(a, b) {
	return new V(a.x - b.x, a.y - b.y, a.z - b.z);
}

function fsub(f, v) {
	return new V(f - v.x, f - v.y, f - v.z);
}

function subf(v, f) {
	return new V(v.x - f, v.y - f, v.z - f);
}

function add(a, b) {
	return new V(a.x + b.x, a.y + b.y, a.z + b.z);
}

function dot(a, b) {
	return a.x * b.x + a.y * b.y + a.z * b.z;
}

function mul(a, b) {
	return new V(a.x * b.x, a.y * b.y, a.z * b.z);
}

function mulf(v, f) {
	return new V(v.x * f, v.y * f, v.z * f);
}

function div(a, b) {
	return new V(a.x / b.x, a.y / b.y, a.z / b.z);
}

function divf(v, f) {
	return new V(v.x / f, v.y / f, v.z / f);
}

function fdiv(f, v) {
	return new V(f / v.x, f / v.y, f / v.z);
}

function normalize(v) {
	return mulf(v, 1 / length(v));
}

function length(v) {
	return Math.sqrt(dot(v, v));
}

function reflect(d, n) {
	return sub(d, mulf(n, 2 * dot(d, n)));
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
	this.x = x;
	this.y = y;
	this.z = z;
}

V.single = function (f) {
	return new V(f, f, f);
}

V.copy = function (v) {
	return new V(v.x, v.y, v.z);
}

V.prototype.add = function (v) {
	this.x += v.x;
	this.y += v.y;
	this.z += v.z;
	return this;
}

V.prototype.addf = function (f) {
	this.x += f;
	this.y += f;
	this.z += f;
	return this;
}

V.prototype.sub = function (v) {
	this.x -= v.x;
	this.y -= v.y;
	this.z -= v.z;
	return this;
}

V.prototype.subf = function (f) {
	this.x -= f;
	this.y -= f;
	this.z -= f;
	return this;
}

V.prototype.mul = function (v) {
	this.x *= v.x;
	this.y *= v.y;
	this.z *= v.z;
	return this;
}

V.prototype.mulf = function (f) {
	this.x *= f;
	this.y *= f;
	this.z *= f;
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
	this.mulf(1 / length(this));
	return this;
}

V.prototype.normalized = function () {
	// Returns a new vector that is normalized.
	return mulf(this, 1 / length(this));
}

V.prototype.string = function () {
	return '(' + this.x.toFixed(2) + ", " + this.y.toFixed(2) + ", " + this.z.toFixed(2) + ")";
}

function frameMul(N, v) {
	const nabs = abs(N);
	const t = V.copy(N);
	if (nabs.x <= nabs.y && nabs.x <= nabs.z)
		t.x = 1;
	else if (nabs.y <= nabs.x && nabs.y <= nabs.z)
		t.y = 1;
	else
		t.z = 1;

	const T = cross(t, N).normalize();
	const B = cross(T, N);
	return T.mulf(v.x).add(B.mulf(v.y)).add(mulf(N, v.z));
}
