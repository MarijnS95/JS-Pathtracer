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
	var L = sub(this.P, r.O);
	var l = dot(L, r.D);
	if (l > 0) {
		var d2 = dot(L, L) - l * l;
		if (d2 < this.R2) {
			var thc = Math.sqrt(this.R2 - d2);
			var t0 = l - thc,
				t1 = l + thc;
			if (t0 > 0) {
				if (t0 >= r.t)
					return;
				r.t = t0;
				r.i = this;
				r.I = add(r.O, mul(r.D, t0));
				r.N = normalize(sub(r.I, this.P));
				r.Inside = false;
			} else {
				if (t1 <= 0 || t1 >= r.t)
					return;
				r.t = t1;
				r.i = this;
				r.I = add(r.O, mul(r.D, t1));
				r.N = normalize(sub(this.P, r.I));
				r.Inside = true;
			}
		}
	}
};

Sphere.prototype.intersects = function (r) {
	var L = sub(this.P, r.O);
	var l = dot(L, r.D);
	return l > 0 && (dot(L, L) - l * l < this.R2);
};