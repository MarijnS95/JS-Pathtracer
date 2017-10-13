function Sphere(p, r2, mtl) {
	if (r2 == null) {
		// When being copied, assume running in the worker and thus asmjs.
		this.P = VectorAsmPushV(p.PVec);
		// this.P = V.copy(p.P);
		this.R2 = p.R2;
		this.mtl = new Material(p.mtl);
	} else {
		// For sending to the worker, an object is needed.
		this.PVec = p;
		this.P = VectorAsmPushV(p);
		this.R2 = r2;
		this.mtl = mtl;
	}
};

Sphere.prototype.intersect = function (r) {
	// DEBUG for now until rays are converted to ASM
	// const o = VectorAsmPushV(r.O);
	// const d = VectorAsmPushV(r.D);

	// const L = sub(this.P, r.O);
	const L = vectorAsm.Dup(this.P);
	vectorAsm.Sub(L, r.O);

	// const l = dot(L, r.D);
	const l = vectorAsm.Dot(L, r.D);

	if (l > 0) {
		// const d2 = dot(L, L) - l * l;
		const d2 = vectorAsm.Dot(L, L) - l * l;

		if (d2 < this.R2) {
			const thc = Math.sqrt(this.R2 - d2);
			const t0 = l - thc,
				t1 = l + thc;

			if (t0 > 0 && t0 < r.t) {
				r.t = t0;
				r.i = this;

				// r.I = mulf(r.D, t0).add(r.O);
				vectorAsm.Mov(r.I, r.D);
				vectorAsm.MulF(r.I, t0);
				vectorAsm.Add(r.I, r.O);

				// r.N = sub(r.I, this.P).normalize();
				vectorAsm.Mov(r.N, r.I);
				vectorAsm.Sub(r.N, this.P);
				vectorAsm.Norm(r.N);

				r.inside = false;
			} else if (t1 > 0 && t1 < r.t) {
				r.t = t1;
				r.i = this;

				// r.I = mulf(r.D, t1).add(r.O);
				vectorAsm.Mov(r.I, r.D);
				vectorAsm.MulF(r.I, t1);
				vectorAsm.Add(r.I, r.O);

				// r.N = sub(this.P, r.I).normalize();
				vectorAsm.Mov(r.N, r.I);
				vectorAsm.RSub(r.N, this.P);// <- reverse sub, store result in r.N.
				vectorAsm.Norm(r.N);

				r.inside = true;
			}
		}
	}
	// vectorAsm.PopCnt(3);
	vectorAsm.Pop();
};

Sphere.prototype.intersects = function (r) {
	// TODO: Asmjsify
	const L = sub(this.P, r.O);
	const l = dot(L, r.D);
	return l > 0 && (dot(L, L) - l * l < this.R2);
};
