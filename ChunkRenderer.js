//initialize 
importScripts("Shared.js", "Vector.js", "Sphere.js", "Camera.js", "Ray.js", "Light.js");

//script running in a web worker
var spheres = [];
var lights = [];
var camera = null;
var skydome = null, skydomeWidth = 0, skydomeHeight = 0;
var accumulator = null;

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

function SampleSkydome(dir) {
	if (skydome == null)
		return dir;
	var r = INVPI * Math.acos(dir.z) / Math.sqrt(dir.x * dir.x + dir.y * dir.y);
	var x = (dir.x * r + 1) * 0.5,
		y = 1 - (dir.y * r + 1) * 0.5;
	var pos = (Math.floor(x * skydomeWidth) + Math.floor(y * skydomeHeight) * skydomeWidth) * 4;
	return new V(skydome[pos], skydome[pos + 1], skydome[pos + 2]);
}

function RayTrace(r, depth, n1) {
	var color = new V(0);
	if (depth > 8) return color;
	intersect(r);
	if (r.i != null) {
		var col = r.i.t ? new V(((Math.floor(r.I.x * 64 + 2000) & 63) == 0 || (Math.floor(r.I.z * 64 + 2000) & 63) == 0) ? .05 : .2) : r.i.c;
		if (camera.maxDepth == 0)
			return col;
		for (var i = 0; i < lights.length; i++) {
			var currentLight = lights[i];
			var LR = sub(currentLight.position, r.I);
			var d = dot(LR, r.N);
			if (!r.inside && d > 0) {
				var len = length(LR);
				var L = mul(LR, 1 / len);
				var d = dot(L, r.N);
				var lRay = new Ray(L, r.I);
				if (!intersects(lRay)) {
					if (d > 0 && r.i.diff > 0)
						color.add(mul(mul(col, currentLight.emission), 2 * d * r.i.diff / (len * len)));
					d = dot(L, r.N);
					if (d > 0 && r.i.refl > 0)
						color.add(new V(2 * Math.pow(d, 64) * r.i.refl));
				}
			}
		}

		var Fr = 0;
		if (r.i.refr > 0) {
			var cosI = -dot(r.N, r.D);
			var sinI2 = 1 - cosI * cosI;
			var n2 = r.Inside ? 1 : r.i.rIdx;
			var n = n1 / n2;
			var cosT2 = 1 - n * n * sinI2;
			var R0 = (n1 - n2) / (n1 + n2);
			R0 *= R0;
			Fr = R0 + (1 - R0) * Math.pow(1 - cosI, 5);
			if (cosT2 > 0 && Fr < 1) {
				var T = add(mul(r.D, n), mul(r.N, n * cosI - Math.sqrt(cosT2)));
				var refractRay = new Ray(T, r.I);
				var refractColor = RayTrace(refractRay, depth + 1, n2);
				if (r.Inside)
					refractColor.mul(exp(mul(sub(new V(1), col), 2.5 * -r.t)));
				else
					refractColor.mul(col);
				color.add(mul(refractColor, (1 - Fr) * r.i.refr));
			}
		}
		if (r.i.refl > 0 || Fr > 0)
			color.add(mul(mul(r.i.reflCol, r.i.refl + Fr), RayTrace(new Ray(reflect(r.D, r.N), r.I), depth + 1, n1)));
		//skydome AO sampling
		if (r.i.diff > 0) {
			var skyRay = new Ray(frameMul(r.N, cosineHemSample()), r.I);
			if (!intersects(skyRay))
				color.add(mul(SampleSkydome(skyRay.D), mul(col, r.i.diff)));
		}
	} else
		color.add(SampleSkydome(r.D));
	return color;
}

function renderChunk(x, y) {
	//http://stackoverflow.com/a/31265419/2844473
	//my plans exactly

	// NEW INF! ALMOST: https://bugs.chromium.org/p/chromium/issues/detail?id=563816
	for (var xc = 0; xc < chunkWidth; xc++)
		for (var yc = 0; yc < chunkHeight; yc++) {
			//var base = (xc + yc * chunkWidth) * 3;
			var base = 3 * (x * chunkWidth + xc + (8 * chunkWidth) * (y * chunkHeight + yc));
			var r = camera.getRay(x * chunkWidth + xc + Math.random(), y * chunkHeight + yc + Math.random());
			var c = RayTrace(r, 1, 1);
			accumulator[base] += c.x;//x * chunkWidth + xc;
			accumulator[base + 1] += c.y;// * chunkWidth + yc;
			accumulator[base + 2] += c.z;
		}
}

addEventListener("message", function (e) {
	switch (e.data.type) {
		case "render":
			renderChunk(e.data.x, e.data.y);
			postMessage({ type: "chunkDone", x: e.data.x, y: e.data.y });
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
	}
});
