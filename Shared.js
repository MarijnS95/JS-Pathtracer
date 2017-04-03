//file containing important global variables and scripts
var chunkWidth = 16, chunkHeight = 16;
var INVPI = 1 / Math.PI;

var seed = 0;

function xor32() {
	seed ^= seed << 13;
	seed ^= seed >> 17;
	seed ^= seed << 5;
	//Convert seed to unsigned 32 bit:
	seed >>>= 0;
	return seed * 2.3283064365387e-10;
}

function cosineHemSample(v) {
	var phi = Math.PI * 2 * xor32();
	var cosTheta = Math.sqrt(1 - v), sinTheta = Math.sqrt(v);
	return new V(Math.cos(phi) * sinTheta, Math.sin(phi) * sinTheta, cosTheta);
}

function intersect(r) {
	for (var i = 0; i < spheres.length; i++)
		spheres[i].intersect(r);
}

function intersects(r) {
	for (var i = 0; i < spheres.length; i++) {
		if (spheres[i].intersects(r))
			return true;
	}
	return false;
}