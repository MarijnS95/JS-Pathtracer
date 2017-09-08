//initialize
importScripts("Shared.js", "Vector.js", "Material.js", "Sphere.js", "Plane.js", "Camera.js", "Ray.js", "Light.js");

//script running in a web worker
let objects = [];
let lights = [];
let camera = null;
let skydome = null, skydomeWidth = 0, skydomeHeight = 0;
let accumulator = null;
let syncPoint = null;

function SampleSkydome(dir) {
	if (skydome == null)
		return dir;
	const r = INVPI * Math.acos(dir.z) / Math.sqrt(dir.x * dir.x + dir.y * dir.y);
	const x = (dir.x * r + 1) * 0.5,
		y = 1 - (dir.y * r + 1) * 0.5;
	const pos = (Math.floor(x * skydomeWidth) + Math.floor(y * skydomeHeight) * skydomeWidth) * 4;
	return new V(skydome[pos], skydome[pos + 1], skydome[pos + 2]);
}

function RayTrace(r) {
	let color = new V(1);
	let n1 = 1.0;
	for (let depth = 0; ; depth++) {
		if (depth >= camera.maxDepth)
			return new V(0);
		intersect(r);
		if (r.i == null) {
			color.mul(SampleSkydome(r.D));
			break;
		}

		const mtl = r.i.mtl;

		if (mtl.tiled) {
			const tileValue = ((Math.floor(r.I.x * 16 + 2000) & 31) == 0 || (Math.floor(r.I.z * 16 + 2000) & 31) == 0) ? .05 : .4;
			color.mul(tileValue);
		}

		if (camera.maxDepth == 0) //TODO
			return mtl.diffCol;

		const selector = xor32();
		let R = null;
		let cmp = mtl.refr;

		if (cmp > selector) {
			const cosI = -dot(r.N, r.D);
			const sinI2 = 1 - cosI * cosI;
			const n2 = r.inside ? 1 : mtl.rIdx;
			const n = n1 / n2;
			const cosT2 = 1 - n * n * sinI2;
			let R0 = (n1 - n2) / (n1 + n2);
			R0 *= R0;
			const Fr = R0 + (1 - R0) * Math.pow(1 - cosI, 5);
			if (cosT2 > 0 && Fr < xor32()) {
				R = mul(r.D, n).add(mul(r.N, n * cosI - Math.sqrt(cosT2)));
				n1 = n2;
				color.mul(r.inside ? exp(mul(mtl.absCol, -r.t)) : mtl.diffCol);
			} else {
				R = frameMul(reflect(r.D, r.N), cosineHemSample(mtl.gloss));
				color.mul(mtl.specCol);
			}
		} else if ((cmp += mtl.spec) > selector) {
			R = frameMul(reflect(r.D, r.N), cosineHemSample(mtl.gloss));
			color.mul(mtl.specCol);
		} else if ((cmp += mtl.diff) > selector) {
			R = frameMul(r.N, cosineHemSample(xor32()));
			color.mul(mtl.diffCol);
		} else {
			color.set(0);
			break;
		}
		r.nextRay(R.normalize());
	}
	return color;
}

function renderChunk(x, y, stride) {
	//http://stackoverflow.com/a/31265419/2844473
	//my plans exactly

	// NEW INF! ALMOST: https://bugs.chromium.org/p/chromium/issues/detail?id=563816
	for (let xc = 0; xc < chunkWidth; xc++)
		for (let yc = 0; yc < chunkHeight; yc++) {
			const base = 3 * (x * chunkWidth + xc + stride * (y * chunkHeight + yc));
			const r = camera.getRay(x * chunkWidth + xc, y * chunkHeight + yc);
			const c = RayTrace(r);
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
				const x = (chunkIdx % e.data.xChunks) | 0,
					y = (chunkIdx / e.data.xChunks) | 0;
				renderChunk(x, y, e.data.stride);
				const chunksDone = Atomics.add(syncPoint, 1, 1);
				if (chunksDone == e.data.totalWork - 1)
					postMessage({ type: "renderDone" });
			}
			break;
		case 'setup':
			for (let obj of e.data.objects) {
				switch (obj.type) {
					case 'Sphere':
						obj = new Sphere(obj);
						break;
					case 'Plane':
						obj = new Plane(obj);
						break;
					default:
						continue;
				}
				objects.push(obj);
			}
			accumulator = e.data.accumulator;
			syncPoint = e.data.syncPoint;
			break;
		case "setCamera":
			camera = new Camera(e.data.camera);
			break;
		case "setSkydome":
			skydome = e.data.skydome;
			skydomeWidth = e.data.skydomeWidth;
			skydomeHeight = e.data.skydomeHeight;
			break;
	}
});
