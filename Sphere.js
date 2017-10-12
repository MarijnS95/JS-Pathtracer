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
	const o = VectorAsmPushV(r.O);
	const d = VectorAsmPushV(r.D);

	// const L = sub(this.P, r.O);
	const L = vectorAsm.PushV(this.P);
	vectorAsm.Sub(L, o);

	// const l = dot(L, r.D);
	const l = vectorAsm.Dot(L, d);

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
				// We don't need d anymore, so we can write over it:
				vectorAsm.MulF(d, t0);
				vectorAsm.Add(d, o);
				r.I = VectorAsmGetV(d);

				// r.N = sub(r.I, this.P).normalize();
				vectorAsm.Sub(d, this.P);
				vectorAsm.Norm(d);
				r.N = VectorAsmGetV(d);

				r.inside = false;
			} else if (t1 > 0 && t1 < r.t) {
				r.t = t1;
				r.i = this;

				// r.I = mulf(r.D, t1).add(r.O);
				vectorAsm.MulF(d, t1);
				vectorAsm.Add(d, o);
				r.I = VectorAsmGetV(d);

				// r.N = sub(this.P, r.I).normalize();
				vectorAsm.RSub(d, this.P); // <- reverse sub, store result in i.
				vectorAsm.Norm(d);
				r.N = VectorAsmGetV(d);

				r.inside = true;
			}
		}
		// We allocated 2 vectors, deallocate them again.
	}
	vectorAsm.PopCnt(3);
};

Sphere.prototype.intersects = function (r) {
	// TODO: Asmjsify
	const L = sub(this.P, r.O);
	const l = dot(L, r.D);
	return l > 0 && (dot(L, L) - l * l < this.R2);
};
