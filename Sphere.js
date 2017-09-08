function Sphere(p, r2, mtl) {
	if (r2 == null) {
		this.P = new V(p.P);
		this.R2 = p.R2;
		this.mtl = new Material(p.mtl);
	} else {
		this.P = p;
		this.R2 = r2;
		this.mtl = mtl;
	}
};

Sphere.prototype.intersect = function (r) {
	const L = sub(this.P, r.O);
	const l = dot(L, r.D);
	if (l > 0) {
		const d2 = dot(L, L) - l * l;
		if (d2 < this.R2) {
			const thc = Math.sqrt(this.R2 - d2);
			const t0 = l - thc,
				t1 = l + thc;
			if (t0 > 0) {
				if (t0 >= r.t)
					return;
				r.t = t0;
				r.i = this;
				r.I = mul(r.D, t0).add(r.O);
				r.N = sub(r.I, this.P).normalize();
				r.inside = false;
			} else {
				if (t1 <= 0 || t1 >= r.t)
					return;
				r.t = t1;
				r.i = this;
				r.I = mul(r.D, t1).add(r.O);
				r.N = sub(this.P, r.I).normalize();
				r.inside = true;
			}
		}
	}
};

Sphere.prototype.intersects = function (r) {
	const L = sub(this.P, r.O);
	const l = dot(L, r.D);
	return l > 0 && (dot(L, L) - l * l < this.R2);
};
