//initialize
importScripts("Shared.js", "Vector.js", "Sphere.js", "Camera.js", "Ray.js", "Light.js");

//script running in a web worker
var spheres = [];
var lights = [];
var camera = null;
var skydome = null, skydomeWidth = 0, skydomeHeight = 0;
var accumulator = null;
var syncPoint = null;

function SampleSkydome(dir) {
	if (skydome == null)
		return dir;
	var r = INVPI * Math.acos(dir.z) / Math.sqrt(dir.x * dir.x + dir.y * dir.y);
	var x = (dir.x * r + 1) * 0.5,
		y = 1 - (dir.y * r + 1) * 0.5;
	var pos = (Math.floor(x * skydomeWidth) + Math.floor(y * skydomeHeight) * skydomeWidth) * 4;
	return new V(skydome[pos], skydome[pos + 1], skydome[pos + 2]);
}

function RayTrace(r) {
	var color = new V(1);
	var n1 = 1.0;
	for (var depth = 0; ; depth++) {
		if (depth >= camera.maxDepth)
			return new V(0);
		intersect(r);
		if (r.i == null) {
			color.mul(SampleSkydome(r.D));
			break;
		}

		var col = new V(r.i.diffCol);
		if (r.i.t) {
			var bla = ((Math.floor(r.I.x * 16 + 2000) & 31) == 0 || (Math.floor(r.I.z * 16 + 2000) & 31) == 0) ? .05 : .4;
			color.mul(bla);
			col.mul(bla);
		}

		if (camera.maxDepth == 0) //TODO
			return col;

		var selector = xor32();
		var cmp = r.i.refr;
		var R = null;

		if (cmp > selector) {
			var cosI = -dot(r.N, r.D);
			var sinI2 = 1 - cosI * cosI;
			var n2 = r.Inside ? 1 : r.i.rIdx;
			var n = n1 / n2;
			var cosT2 = 1 - n * n * sinI2;
			var R0 = (n1 - n2) / (n1 + n2);
			R0 *= R0;
			var Fr = R0 + (1 - R0) * Math.pow(1 - cosI, 5);
			if (cosT2 > 0 && Fr < xor32()) {
				R = mul(r.D, n).add(mul(r.N, n * cosI - Math.sqrt(cosT2)));
				n1 = n2;
				color.mul(r.Inside ? exp(mul(r.i.absCol, -r.t)) : col);
			} else {
				R = frameMul(reflect(r.D, r.N), cosineHemSample(r.i.gloss));
				color.mul(r.i.specCol);
			}
		} else if ((cmp += r.i.spec) > selector) {
			R = frameMul(reflect(r.D, r.N), cosineHemSample(r.i.gloss));
			color.mul(r.i.specCol);
		} else if ((cmp += r.i.diff) > selector) {
			R = frameMul(r.N, cosineHemSample(xor32()));
			color.mul(col);
		} else {
			color.set(0);
			break;
		}
		r.nextRay(normalize(R));
	}
	return color;
}

function renderChunk(x, y, stride) {
	//http://stackoverflow1om/a/31265419/2844473
	//my plans exactly

	// NEW INF! ALMOST: https://bugs.chromium.org/p/chromium/issues/detail?id=563816
	for (var xc = 0; xc < chunkWidth; xc++)
		for (var yc = 0; yc < chunkHeight; yc++) {
			var base = 3 * (x * chunkWidth + xc + stride * (y * chunkHeight + yc));
			var r = camera.getRay(x * chunkWidth + xc, y * chunkHeight + yc);
			var c = RayTrace(r);
			accumulator[base] += c.x;
			accumulator[base + 1] += c.y;
			accumulator[base + 2] += c.z;
		}
}

addEventListener("message", function (e) {
	switch (e.data.type) {
		case "startRender":
			seed = (e.data.rnd + 1/*threadidx*/) * 124737421 | 0;
			while ((chunkIdx = Atomics.add(syncPoint, 0, 1)) < e.data.totalWork) {
				var x = chunkIdx % e.data.xChunks | 0,
					y = (chunkIdx / e.data.xChunks) | 0;
				renderChunk(x, y, e.data.stride);
				var chunksDone = Atomics.add(syncPoint, 1, 1);
				if (chunksDone == e.data.totalWork - 1)
					postMessage({ type: "renderDone" });
			}
			break;
		case "setSpheres":
			for (var i = 0; i < e.data.spheres.length; i++)
				spheres[i] = new Sphere(e.data.spheres[i]);
			break;
		case "setLights":
			lights = e.data.lights;
			break;
		case "setCamera":
			camera = new Camera(e.data.camera);
			break;
		case "setSkydome":
			skydome = e.data.skydome;
			skydomeWidth = e.data.skydomeWidth;
			skydomeHeight = e.data.skydomeHeight;
			break;
		case "setAccumulator":
			//Create a view:
			accumulator = e.data.accumulator;
			break;
		case "setSyncPoint":
			syncPoint = e.data.syncPoint;
			break;
	}
});
