//file containing important global variables and scripts
const chunkWidth = 8, chunkHeight = 8;
const EPSILON = 1e-5;

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
