//file containing important global variables and scripts
const chunkWidth = 16, chunkHeight = 16;
const INVPI = 1 / Math.PI;

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
	const phi = Math.PI * 2 * xor32();
	const cosTheta = Math.sqrt(1 - v), sinTheta = Math.sqrt(v);
	return new V(Math.cos(phi) * sinTheta, Math.sin(phi) * sinTheta, cosTheta);
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
