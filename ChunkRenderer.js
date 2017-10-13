//initialize
importScripts('Shared.js', 'Vector.js', 'AsmVector.js', 'Material.js', 'Sphere.js', 'Plane.js', 'Box.js', 'Camera.js', 'Ray.js', 'Light.js');


//script running in a web worker
let objects = [];
let lights = [];
let camera = null;
let skydome = null, skydomeWidth = 0, skydomeHeight = 0;
let accumulator = null;
let syncPoint = null;

function TracerModule(stdlib, vectorAsm, heap) {
	"use asm";

	const acos = stdlib.Math.acos;
	const sqrt = stdlib.Math.sqrt;
	const imul = stdlib.Math.imul;
	const fround = stdlib.Math.fround;
	const floor = stdlib.Math.floor;
	const PI = stdlib.Math.PI;

	var INVPI = fround(0);

	const f32 = new stdlib.Float32Array(heap);

	function init() {
		INVPI = fround(fround(1) / fround(PI));
	}

	function SampleSkydome(dir, skydomeWidth, skydomeHeight) {
		dir = dir | 0;
		skydomeWidth = fround(skydomeWidth);
		skydomeHeight = fround(skydomeHeight);

		var r = fround(0);
		var x = fround(0);
		var y = fround(0);
		var z = fround(0);

		var ix = 0;
		var iy = 0;

		x = fround(f32[dir >> 2]);
		y = fround(f32[dir + 4 >> 2]);
		z = fround(f32[dir + 8 >> 2]);

		r = fround(
			fround(INVPI * fround(acos(+z))) /
			fround(sqrt(
				fround(fround(x * x) + fround(y * y))
			))
		);

		x = fround(fround(x * r) + fround(1));
		x = fround(x * fround(0.5));

		y = fround(fround(y * r) + fround(1));
		y = fround(fround(1) - fround(y * fround(0.5)));

		ix = ~~floor(+fround(x * skydomeWidth));
		iy = ~~floor(+fround(y * skydomeHeight));
		iy = imul(iy, ~~floor(+skydomeWidth));
		return imul((ix + iy) | 0, 4 | 0) | 0;
	}

	return {
		init: init,
		SampleSkydome: SampleSkydome
	};
}

const tracerModule = TracerModule(self, vectorAsm, asmHeap);
tracerModule.init();

function SampleSkydome(dest, dir) {
	if (skydome == null) {
		vectorAsm.Mov(dest, dir);
	} else {
		const pos = tracerModule.SampleSkydome(dir, skydomeWidth, skydomeHeight);
		vectorAsm.V(dest, skydome[pos], skydome[pos + 1], skydome[pos + 2]);
	}
}

function RayTrace(r, color) {
	const R = vectorAsm.AllocNext();
	let n1 = 1;
	for (let depth = 0; ; depth++) {
		if (depth >= camera.maxDepth) {
			// return V.single(0);
			vectorAsm.VS(color, 0);
			break;
		}
		intersect(r);

		if (r.i == null) {
			const sd = vectorAsm.AllocNext();
			SampleSkydome(sd, r.D);
			vectorAsm.Mul(color, sd);
			vectorAsm.Pop();
			break;
		}

		const mtl = r.i.mtl;

		if (camera.maxDepth == 1) {
			const d = VectorAsmPushV(mtl.getDiffuse(r));
			vectorAsm.MulF(d, mtl.diffuse);
			vectorAsm.Mov(color, d);

			VectorAsmMovV(d, mtl.specularColor);
			vectorAsm.MulF(d, mtl.specular);
			vectorAsm.Add(color, d);

			VectorAsmMovV(d, mtl.absorptionColor);
			vectorAsm.NormF(d, Math.sqrt(3));
			vectorAsm.FSub(d, 1);
			vectorAsm.MulF(d, mtl.refraction);
			vectorAsm.Add(color, d);
			vectorAsm.Pop();
			break;
		}

		if (r.inside) {
			// WARNING: color should not be written to yet, otherwise this needs to happen  in a local vector, and Mul'd with color.
			VectorAsmMovV(color, mtl.absorptionColor);
			vectorAsm.MulF(color, -r.t);
			vectorAsm.Exp(color);
		}

		const selector = xor32();
		let cmp = mtl.refraction;
		let R = null;

		if (cmp > selector) {
			// In case the camera is already inside an object (because the above n1 = 1 assumes the camera is in air):
			if (r.inside && depth == 0)
				n1 = mat.refractionIndex;
			const n2 = r.inside ? 1 : mtl.refractionIndex;
			const n = n1 / n2;

			const cosI = -vectorAsm.Dot(r.N, r.D);
			const sin2I = 1 - cosI * cosI;
			const cos2T = 1 - n * n * sin2I;

			// Fresnel equation:
			let f0 = (n1 - n2) / (n1 + n2);
			f0 *= f0;
			const Fr = f0 + (1 - f0) * Math.pow(1 - cosI, 5);
			if (cos2T > 0 && Fr < xor32()) {
				vectorAsm.Mov(R, r.N);
				vectorAsm.MulF(R, n * cosI - Math.sqrt(cos2T));

				const v = vectorAsm.Dup(r.D);
				vectorAsm.MulF(v, n);
				vectorAsm.Add(R, v);
				vectorAsm.Pop();
				vectorAsm.CosineHemFrame(R, mtl.glossiness);

				// R = cosineHemFrame(
				// 	mulf(rD, n).add(mulf(rN, n * cosI - Math.sqrt(cos2T))),
				// 	mtl.glossiness);
				n1 = n2;
			} else {
				// IDEA: Here, it's possible for a diffuse or specular reflection to happen.
				// TODO: mtl.glossiness should be randomized, because right now it would be sampling in that radius around the normal, not on the entire 'circle' determined by the glossiness.
				// R = cosineHemFrame(reflect(rD, rN), mtl.glossiness);
				// color.mul(mtl.getSpecular(r));
				vectorAsm.Mov(R, r.D);
				vectorAsm.Reflect(R, r.N);
				vectorAsm.CosineHemFrame(R, mtl.glossiness);
				vectorAsm.Mul(color, VectorAsmPushV(mtl.getSpecular(r)));
				vectorAsm.Pop();
			}
		} else if ((cmp += mtl.specular) > selector) {
			vectorAsm.Mov(R, r.D);
			vectorAsm.Reflect(R, r.N);
			vectorAsm.CosineHemFrame(R, mtl.glossiness);
			vectorAsm.Mul(color, VectorAsmPushV(mtl.getSpecular(r)));
			vectorAsm.Pop();
		} else if ((cmp += mtl.diffuse) > selector) {
			// R = cosineHemFrame(rN, xor32());
			vectorAsm.Mov(R, r.N);
			vectorAsm.CosineHemFrame(R, xor32());

			// color.mul(mtl.getDiffuse(r));
			vectorAsm.Mul(color, VectorAsmPushV(mtl.getDiffuse(r)));
			vectorAsm.Pop();
		} else {
			vectorAsm.VS(color, 0);
			break;
		}
		vectorAsm.Norm(R);
		r.nextRay(R);
	}
	vectorAsm.Pop();
}

function renderChunk(x, y, stride) {
	// Future: Use OffscreenCanvas (bitmaprenderer). Not in chrome yet: https://bugs.chromium.org/p/chromium/issues/detail?id=563816
	// However, we need to share the canvas with MULTIPLE workers SIMULTANEOUSLY. Not sure if that's possible.
	const chunkX = x * chunkWidth;
	const chunkY = y * chunkHeight;
	let chunkBase = chunkX + stride * chunkY;
	for (let yc = 0; yc < chunkHeight; yc++) {
		for (let xc = 0; xc < chunkWidth; xc++) {
			const base = 3 * (chunkBase + xc);
			const c = vectorAsm.PushF(1);
			const r = camera.getRay(chunkX + xc, chunkY + yc);
			RayTrace(r, c);
			r.pop();

			accumulator[base] += asmFHeap[c >> 2];
			accumulator[base + 1] += asmFHeap[c + 4 >> 2];
			accumulator[base + 2] += asmFHeap[c + 8 >> 2];
			// accumulator[base] += c.x;
			// accumulator[base + 1] += c.y;
			// accumulator[base + 2] += c.z;
			vectorAsm.Pop();
		}
		chunkBase += stride;
	}
}

addEventListener('message', function (e) {
	switch (e.data.type) {
		case 'startRender':
			seed = (e.data.rnd + 1/*threadidx*/) * 124737421 | 0;
			vectorAsm.setSeed(seed);
			while ((chunkIdx = Atomics.add(syncPoint, 0, 1)) < e.data.totalWork) {
				const x = (chunkIdx % e.data.xChunks) | 0,
					y = (chunkIdx / e.data.xChunks) | 0;
				renderChunk(x, y, e.data.stride);
				const chunksDone = Atomics.add(syncPoint, 1, 1);
				if (chunksDone == e.data.totalWork - 1)
					postMessage({ type: 'renderDone' });
			}
			break;
		case 'setup':
			for (let obj of e.data.objects) {
				switch (obj.type) {
					case 'Sphere':
						obj = new Sphere(obj);
						break;
					// case 'Plane':
					// 	obj = new Plane(obj);
					// 	break;
					// case 'Box':
					// 	obj = new Box(obj);
					// 	break;
					default:
						continue;
				}
				objects.push(obj);
			}
			syncPoint = e.data.syncPoint;
			break;
		case 'setCamera':
			camera = new Camera(e.data.camera);
			break;
		case 'setAccumulator':
			accumulator = e.data.accumulator;
			break;
		case 'setSkydome':
			skydome = e.data.skydome;
			skydomeWidth = e.data.skydomeWidth;
			skydomeHeight = e.data.skydomeHeight;
			break;
	}
});
