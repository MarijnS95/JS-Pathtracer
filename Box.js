function Box(mi, ma, mtl) {
	if (ma == null) {
		this.min = VectorAsmPushV(mi.minVec);
		this.max = VectorAsmPushV(mi.maxVec);
		this.center = VectorAsmPushV(mi.centerVec);
		this.mtl = new Material(mi.mtl);
	} else {
		this.minVec = min(mi, ma);
		this.maxVec = max(mi, ma);
		this.centerVec = add(mi, ma).mulf(.5);
		this.min = VectorAsmPushV(this.minVec);
		this.max = VectorAsmPushV(this.maxVec);
		this.center = VectorAsmPushV(this.centerVec);
		this.mtl = mtl;
	}
};

Box.prototype.intersect = function (r) {
	// const ta = sub(this.min, r.O).mul(r.DI);
	// const tb = sub(this.max, r.O).mul(r.DI);
	const ta = vectorAsm.Dup(this.min);
	vectorAsm.Sub(ta, r.O);
	vectorAsm.Mul(ta, r.DI);
	const tb = vectorAsm.Dup(this.max);
	vectorAsm.Sub(tb, r.O);
	vectorAsm.Mul(tb, r.DI);

	vectorAsm.Sort(ta, tb);
	// const tmin3 = min(ta, tb);
	// const tmax3 = max(ta, tb);

	// const minidx = tmin3.maxidx(),
	// 	maxidx = tmax3.minidx();
	const minidx = vectorAsm.MaxIdx(ta),
		maxidx = vectorAsm.MinIdx(tb);

	// let tmin = tmin3[minidx], tmax = tmax3[maxidx];

	let tmin = vectorAsm.At(ta, minidx);
	const tmax = vectorAsm.At(tb, maxidx);

	const inside = tmin < 0;
	tmin = inside ? tmax : tmin;
	if (tmin <= tmax && tmin > 0 && tmin < r.t) {
		r.inside = inside;
		r.i = this;
		r.t = tmin;
		// r.I = mulf(r.D, tmin).add(r.O);
		vectorAsm.Mov(r.I, r.D);
		vectorAsm.MulF(r.I, tmin);
		vectorAsm.Add(r.I, r.O);

		vectorAsm.VS(r.N, 0);

		vectorAsm.SetAt(r.N, inside ? maxidx : minidx, 1);

		const i = vectorAsm.Dup(r.I);
		vectorAsm.Sub(i, this.center);
		const d = vectorAsm.Dot(i, r.N);
		vectorAsm.Pop();

		if (inside ^ (d < 0))
			vectorAsm.Neg(r.N);
	}
	vectorAsm.PopCnt(2);
};

Box.prototype.intersects = function (r) {
};
