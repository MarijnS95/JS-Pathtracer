//initialize 
importScripts("Shared.js", "Vector.js", "Sphere.js", "Camera.js", "Ray.js", "Light.js");

//script running in a web worker
var spheres = [];
var lights = [];
var camera = null;
var acc = new Float32Array(chunkWidth * chunkHeight * 3);

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

function RayTrace(r, depth, n1) {
	var color = new V(0);
	if (depth > camera.maxDepth) return color;
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
			color.add(mul(mul(col, r.i.refl + Fr), RayTrace(new Ray(reflect(r.D, r.N), r.I), depth + 1, n1)));
		//skydome AO sampling

	}/* else
		color.add(SampleSkydome(r.D));*/
	return color;
}

function renderChunk(x, y) {
	//http://stackoverflow.com/a/31265419/2844473
	//my plans exactly
	for (var xc = 0; xc < chunkWidth; xc++)
		for (var yc = 0; yc < chunkHeight; yc++) {
			var base = (xc + yc * chunkWidth) * 3;
			var r = camera.getRay(x * chunkWidth + xc + Math.random(), y * chunkHeight + yc + Math.random());
			var c = RayTrace(r, 1, 1);
			acc[base] = c.x * 255;//x * chunkWidth + xc;
			acc[base + 1] = c.y * 255;// * chunkWidth + yc;
			acc[base + 2] = c.z * 255;
		}
}

addEventListener("message", function (e) {
	//todo
	switch (e.data.type) {
		case "render":
			renderChunk(e.data.x, e.data.y);
			postMessage({ type: "chunkDone", x: e.data.x, y: e.data.y, acc: acc });
			break;
		case "setSpheres":
			for (var i = 0; i < e.data.spheres.length; i++)
				spheres[i] = new Sphere(e.data.spheres[i]);
			break;
		case "setLights":
			lights = e.data.lights;
			console.log(lights);
			break;
		case "setCamera":
			camera = new Camera(e.data.camera);
			//console.log("Received a camera:", camera);
			break;
	}
});
