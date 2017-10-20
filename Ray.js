function Ray(o, d) {
	this.O = o;
	this.D = d;

	// this.DI = fdiv(1, d);
	this.DI = vectorAsm.Dup(this.D);
	vectorAsm.FDiv(this.DI, 1);
	this.t = 1e34;
	this.i = null;
	this.I = vectorAsm.Dup(vectorAsm.vZero);
	// V.single(0);
	this.N = vectorAsm.Dup(vectorAsm.vZero);
	// V.single(0);
	this.inside = false;
}

//Ray.createEpsilonOffset = d, o => new Ray(D, add(o, mul(d, EPSILON)));

Ray.prototype.nextRay = function (d) {
	// this.O = mulf(d, EPSILON).add(this.I);
	vectorAsm.Mov(this.O, d);
	vectorAsm.MulF(this.O, EPSILON);
	vectorAsm.Add(this.O, this.I);
	// this.D = d;
	vectorAsm.Mov(this.D, d);
	// this.DI = fdiv(1, d);
	vectorAsm.Mov(this.DI, d);
	vectorAsm.FDiv(this.DI, 1);
	this.t = 1e34;
	this.i = null;
	this.inside = false;
	// this.N = V.single(0);
	// this.I = V.single(0);
	vectorAsm.VS(this.N, 0);
	vectorAsm.VS(this.I, 0);
}

Ray.prototype.pop = function () {
	// Pops the ray off the vector stack.
	vectorAsm.PopCnt(5);
}
