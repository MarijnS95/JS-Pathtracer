function Plane(t, n, mtl) {
	if (n == null) {
		this.T = t.T;
		this.N = VectorAsmPushV(t.NVec);
		this.mtl = new Material(t.mtl);
	} else {
		this.T = t;
		this.NVec = n;
		this.N = VectorAsmPushV(n);
		this.mtl = mtl;
	}
};

Plane.prototype.intersect = function (r) {
	const dn = vectorAsm.Dot(r.D, this.N);
	const t = (this.T - vectorAsm.Dot(r.O, this.N)) / dn;
	if (t < EPSILON || t > r.t)
		return;
	r.t = t;
	r.i = this;

	// r.I = mulf(r.D, t).add(r.O);
	vectorAsm.Mov(r.I, r.D);
	vectorAsm.MulF(r.I, t);
	vectorAsm.Add(r.I, r.O);

	r.inside = dn > 0;
	vectorAsm.Mov(r.N, this.N);
	if (r.inside)
		vectorAsm.Neg(r.N);
};

Plane.prototype.intersects = function (r) {
	const t = (this.T - vectorAsm.Dot(r.O, this.N)) / vectorAsm.Dot(r.D, this.N);
	return t < EPSILON || t > r.t;
};
