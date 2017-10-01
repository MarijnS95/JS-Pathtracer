//file containing important global variables and scripts
const chunkWidth = 8, chunkHeight = 8;
const INVPI = 1 / Math.PI;
const EPSILON = 1e-5

let seed = 0;

function xor32() {
	seed ^= seed << 13;
	seed ^= seed >> 17;
	seed ^= seed << 5;
	//Convert seed to unsigned 32 bit:
	seed >>>= 0;
	return seed * 2.3283064365387e-10;
}

function cosineHemSample(v) {
	if (v == 0)
		return new V(0, 0, 1);
	v *= xor32();
	const phi = Math.PI * 2 * xor32();
	const cosTheta = Math.sqrt(1 - v), sinTheta = Math.sqrt(v);
	return new V(Math.cos(phi) * sinTheta, Math.sin(phi) * sinTheta, cosTheta);
}

function cosineHemFrame(N, v) {
	if (v == 0)
		return N;
	return frameMul(N, cosineHemSample(v));
}

function intersect(r) {
	for (let object of objects)
		object.intersect(r);
}

function intersects(r) {
	for (let object of objects)
		if (object.intersects(r))
			return true;
	return false;
}
