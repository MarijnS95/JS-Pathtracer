EPSILON = 1e-4
function Ray(o, d) {
	this.O = o;
	this.D = d;
	this.t = 1e34;
	this.i = null;
	this.I = new V(0);
	this.N = new V(0);
	this.inside = false;
}

//Ray.createEpsilonOffset = d, o => new Ray(D, add(o, mul(d, EPSILON)));

Ray.prototype.nextRay = function (d) {
	this.O = add(this.I, mul(d, EPSILON));
	this.D = d;
	this.t = 1e34;
	this.i = null;
	this.inside = false;
	this.N = new V(0);
	this.I = new V(0);
}