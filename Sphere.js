function Sphere(p, r2, diff, refl = 0, refr = 0) {
	if (diff == null) {
		this.P = p.P;
		this.R2 = p.R2;
		this.diff = p.diff;
		this.refl = p.refl;
		this.refr = p.refr;
		this.t = p.t;
		this.c = p.c;
	} else {
		this.P = p;
		this.R2 = r2;
		this.diff = diff;
		this.refl = refl;
		this.refr = refr;
		this.t = false;
		this.c = new V(1);
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

Sphere.prototype.getHexColor = function () {
	return "#" + dec2hex(this.c.x * 255) + dec2hex(this.c.y * 255) + dec2hex(this.c.z * 255);
};

Sphere.prototype.intersects = function (r) {
	var L = sub(this.P, r.O);
	var l = dot(L, r.D);
	return l > 0 && (dot(L, L) - l * l < this.R2);
};