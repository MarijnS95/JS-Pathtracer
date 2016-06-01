function Ray(d, o) {
	if (o == null)
		this.O = new V(0);
	else
		this.O = add(o, mul(d, 1e-4));
	this.D = d;
	this.t = 1e34;
	this.i = null;
	this.inside = false;
}