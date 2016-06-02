//file containing important global variables and scripts
var chunkWidth = 64, chunkHeight = 64;
var INVPI = 1 / Math.PI;

function dec2hex(n) {
	var res = Number(parseInt(n, 10)).toString(16);
	if (res.length == 1)
		res = "0" + res; //cheapest, laziest way ever
	return res;
}

function cosineHemSample() {
	var phi = Math.PI * 2 * Math.random();
	var v = Math.random();
	var cosTheta = Math.sqrt(v), sinTheta = Math.sqrt(1 - v);
	return new V(Math.cos(phi) * sinTheta, Math.sin(phi) * sinTheta, cosTheta);
}