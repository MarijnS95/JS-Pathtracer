function Ray(o, d) {
	this.O = o;
	this.D = d;
	this.DI = fdiv(1, d);
	this.t = 1e34;
	this.i = null;
	this.I = V.single(0);
	this.N = V.single(0);
	this.inside = false;
}

//Ray.createEpsilonOffset = d, o => new Ray(D, add(o, mul(d, EPSILON)));

Ray.prototype.nextRay = function (d) {
	this.O = mulf(d, EPSILON).add(this.I);
	this.D = d;
	this.DI = fdiv(1, d);
	this.t = 1e34;
	this.i = null;
	this.inside = false;
	this.N = V.single(0);
	this.I = V.single(0);
}
