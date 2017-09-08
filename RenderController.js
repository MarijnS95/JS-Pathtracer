//main script that controls the page and commands the worker
//http://w3c.github.io/html/infrastructure.html#transferable-objects
//----------global variables for controller----------
const workers = [];
let ctx = null;
let accumulator = null;
let numSamples = 0, scale = 1;
let isRendering = false;
let imageData = null;
let camera = null;
let syncPoint = null;

const objects = [
	new Sphere(new V(0, -10000, 0), 9999 * 9999, 0.4, 0.15),
	new Sphere(new V(-1, 0, 4), 0.32, 0, 1),
	new Sphere(new V(1, 0, 4), 0.32, 1, 0),
	new Sphere(new V(0, 0, 2.8), 0.32, 0, 0, 1)
];

//, new Sphere(new V(0, 0, 12), 0.32, 1, 0, 0)];
objects[0].t = true;
objects[0].gloss = 0.0001;
objects[0].diffCol = new V(0.7);
objects[0].specCol = new V(0.7);

objects[2].diffCol = new V(1, 0, 0);

objects[3].diffCol = new V(1);
objects[3].absCol = new V(.2, .93, .93).mul(2.5);
objects[3].rIdx = 1.5;

const lights = [];//[new Light(new V(2), new V(40))];

function workerMessage(e) {
	switch (e.data.type) {
		case "renderDone":
			renderFinished();
			break;
	}
}

function render() {
	console.time("renderTime");
	numSamples++;
	scale = 1 / numSamples;
	syncPoint.fill(0);
	let xch = ctx.canvas.width / chunkWidth;
	for (let i = 0; i < workers.length; i++)
		workers[i].postMessage({ type: "startRender", xChunks: xch, totalWork: xch * (ctx.canvas.height / chunkHeight), stride: ctx.canvas.width, rnd: numSamples * Math.random() * 0x7fff * 154323451 >>> 0 });
}
function sat(f) {
	f *= scale;
	return (f > 1 ? 1 : (f < 0 ? 0 : Math.sqrt(f))) * 255;
}

function renderFinished() {
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	for (let i = 0; i < ctx.canvas.width * ctx.canvas.height; i++) {
		imageData.data[i * 4] = sat(accumulator[i * 3]);
		imageData.data[i * 4 + 1] = sat(accumulator[i * 3 + 1]);
		imageData.data[i * 4 + 2] = sat(accumulator[i * 3 + 2]);
		imageData.data[i * 4 + 3] = 255;
	}
	ctx.putImageData(imageData, 0, 0);
	if (isRendering)
		requestAnimationFrame(render);
	console.timeEnd("renderTime");
}

//initialize
addEventListener("load", function () {
	loadSkydome();
	ctx = document.querySelector("canvas").getContext("2d");
	accumulator = new Float32Array(new SharedArrayBuffer(ctx.canvas.width * ctx.canvas.height * 3 * 4));
	syncPoint = new Uint32Array(new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * 2));
	imageData = ctx.createImageData(ctx.canvas.width, ctx.canvas.height);
	console.log('Spawning', navigator.hardwareConcurrency, 'worker threads.');
	for (let i = 0; i < navigator.hardwareConcurrency; i++) {
		worker = new Worker("ChunkRenderer.js");
		worker.onmessage = workerMessage;
		worker.postMessage({
			type: "setup",
			objects: objects,
			accumulator: accumulator,
			syncPoint: syncPoint
		});
		workers.push(worker);
	}
	camera = new Camera(new V(0), new V(0, 0, 1));
	console.log("Created all workers");
});

addEventListener("keypress", function (e) {
	if (e.which == 32) {
		isRendering = !isRendering;
		if (isRendering)
			render();
	}
});

function reset() {
	accumulator.fill(0);
	numSamples = 0;
}

let skydomeWidth = 0, skydomeHeight = 0;

function loadSkydome() {
	fetch("Assets/uffizi_probe.float4").then(r => r.arrayBuffer().then(ab => {
		const dv = new DataView(ab);
		skydomeWidth = dv.getInt32(0, true);
		skydomeHeight = dv.getInt32(4, true);
		skydome = new Float32Array(ab, 8, dv.byteLength / 4 - 2);
		console.log("Skydome ready!", skydomeWidth, skydomeHeight, skydome);
		for (let worker of workers)
			worker.postMessage({ type: "setSkydome", skydomeWidth: skydomeWidth, skydomeHeight: skydomeHeight, skydome: skydome });
		reset();
	}));
}
