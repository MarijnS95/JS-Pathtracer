//file containing important global variables and scripts
var chunkWidth = 64, chunkHeight = 64;

function dec2hex(n) {
	var res = Number(parseInt(n, 10)).toString(16);
	if (res.length == 1)
		res = "0" + res; //cheapest, laziest way ever
	return res;
}