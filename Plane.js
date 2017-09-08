function Plane(t, n, mtl) {
	if (n == null) {
		this.T = t.T;
		this.N = new V(t.N);
		this.mtl = new Material(t.mtl);
	} else {
		this.T = t;
		this.N = n;
		this.mtl = mtl;
	}
};

Plane.prototype.intersect = function (r) {
	const t = (this.T - dot(r.O, this.N)) / dot(r.D, this.N);
	if (t < EPSILON || t > r.t)
		return;
	r.t = t;
	r.i = this;
	r.I = mul(r.D, t).add(r.O);
	r.inside = dot(r.D, this.N) > 0;
	r.N = r.inside ? neg(this.N) : this.N;
};

Plane.prototype.intersects = function (r) {
	const t = (this.T - dot(r.O, this.N)) / dot(r.D, this.N);
	console.log(t);
	return t < EPSILON || t > r.t;
};
