function Box(mi, ma, mtl) {
	if (ma == null) {
		this.min = V.copy(mi.min);
		this.max = V.copy(mi.max);
		this.center = V.copy(mi.center);
		this.mtl = new Material(mi.mtl);
	} else {
		this.min = min(mi, ma);
		this.max = max(mi, ma);
		this.center = add(mi, ma).mulf(.5);
		this.mtl = mtl;
	}
};

Box.prototype.intersect = function (r) {
	const ta = sub(this.min, r.O).mul(r.DI);
	const tb = sub(this.max, r.O).mul(r.DI);
	const tmin3 = min(ta, tb);
	const tmax3 = max(ta, tb);
	const minidx = tmin3.maxidx(),
		maxidx = tmax3.minidx();
	let tmin = tmin3[minidx], tmax = tmax3[maxidx];
	const inside = tmin < 0;
	tmin = inside ? tmax : tmin;
	if (tmin <= tmax && tmin > 0 && tmin < r.t) {
		r.inside = inside;
		r.i = this;
		r.t = tmin;
		r.I = mulf(r.D, tmin).add(r.O);
		r.N = V.single(0);
		r.N[inside ? maxidx : minidx] = 1;
		if (inside ^ (dot(sub(r.I, this.center), r.N) < 0))
			r.N.mulf(-1);
	}
};

Box.prototype.intersects = function (r) {
};
