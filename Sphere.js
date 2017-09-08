function Sphere(p, r2, diff, spec = 0, refr = 0) {
	if (r2 == null) {
		this.P = new V(p.P);
		this.R2 = p.R2;
		this.diff = p.diff;
		this.spec = p.spec;
		this.refr = p.refr;
		this.gloss = p.gloss;
		this.rIdx = p.rIdx;
		this.t = p.t;
		this.diffCol = new V(p.diffCol);
		this.specCol = new V(p.specCol);
		this.absCol = new V(p.absCol);
	} else {
		this.P = p;
		this.R2 = r2;
		this.diff = diff;
		this.spec = spec;
		this.refr = refr;
		this.gloss = 0;
		this.t = false;
		this.diffCol = new V(0);
		this.specCol = new V(1);
		this.absCol = new V(1); //TODO
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
				r.Inside = false;
			} else {
				if (t1 <= 0 || t1 >= r.t)
					return;
				r.t = t1;
				r.i = this;
				r.I = mul(r.D, t1).add(r.O);
				r.N = sub(this.P, r.I).normalize();
				r.Inside = true;
			}
		}
	}
};

Sphere.prototype.intersects = function (r) {
	const L = sub(this.P, r.O);
	const l = dot(L, r.D);
	return l > 0 && (dot(L, L) - l * l < this.R2);
};
