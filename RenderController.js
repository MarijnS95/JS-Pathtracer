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
let renderStartTime = 0;
let avgFps = 0;
let toggleButton = null;
let renderTimeText = null;

const floor = new Material(0.4, 0.6);
floor.tiled = true;
floor.gloss = 0.0001;
floor.diffCol = V.single(0.7);
floor.specCol = V.single(0.7);

const redDiffuse = new Material(1);
redDiffuse.diffCol = new V(1, 0, 0);

const redTransparent = new Material(0, 0, 1);
redTransparent.diffCol = V.single(1);
redTransparent.absCol = new V(.2, .93, .93).mulf(2.5);
const redRefr = new Material(redTransparent);
redRefr.rIdx = 1.5;

const objects = [
	new Plane(-1, new V(0, 1, 0), floor),
	new Sphere(new V(-1, 0, 4), 0.32, new Material(0, 1)),
	new Sphere(new V(1, 0, 4), 0.32, redDiffuse),
	new Sphere(new V(0, 0, 2.8), 0.32, redRefr),
	new Box(new V(-2, -.5, 2), new V(-1, .5, 3), redTransparent)
];

const lights = [];

function workerMessage(e) {
	switch (e.data.type) {
		case "renderDone":
			renderFinished();
			break;
	}
}

function render() {
	renderStartTime = performance.now();
	numSamples++;
	scale = 1 / numSamples;
	syncPoint.fill(0);
	let xch = ctx.canvas.width / chunkWidth;
	for (let worker of workers)
		worker.postMessage({ type: "startRender", xChunks: xch, totalWork: xch * (ctx.canvas.height / chunkHeight), stride: ctx.canvas.width, rnd: numSamples * Math.random() * 0x7fff * 154323451 >>> 0 });
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
	end = performance.now() - renderStartTime;
	currentFps = 1000 / (end | 0);
	avgFps = (avgFps + currentFps) * .5;
	renderTime.textContent = 'Rendertime: ' + (end | 0) + 'ms; ' + (avgFps | 0) + 'fps';
}

addEventListener("load", function () {
	loadSkydome();
	ctx = document.querySelector("canvas").getContext("2d");
	accumulator = new Float32Array(new SharedArrayBuffer(ctx.canvas.width * ctx.canvas.height * 3 * 4));
	syncPoint = new Uint32Array(new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * 2));
	imageData = ctx.createImageData(ctx.canvas.width, ctx.canvas.height);

	for (let obj of objects)
		obj.type = obj.constructor.name;

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
	camera = new Camera(V.single(0), new V(0, 0, 1));
	console.log("Spawned all workers");
	renderTimeText = document.querySelector('#renderTime');
	toggleButton = document.querySelector('#toggle');
	toggleButton.addEventListener("click", toggleRendering);
});

function setIsRendering(value) {
	isRendering = value;
	toggleButton.textContent = isRendering ? "Stop" : "Start";
	if (isRendering)
		render();
}

function toggleRendering() {
	setIsRendering(!isRendering);
}

addEventListener("keypress", function (e) {
	if (e.which == 32)
		toggleRendering();
});

function reset() {
	accumulator.fill(0);
	numSamples = 0;
}

let skydomeWidth = 0, skydomeHeight = 0;

function loadSkydome() {
	fetch("Assets/uffizi_probe.float4")
		.then(r => r.arrayBuffer())
		.then(ab => {
			const dv = new DataView(ab);
			skydomeWidth = dv.getInt32(0, true);
			skydomeHeight = dv.getInt32(4, true);
			skydome = new Float32Array(ab, 8, dv.byteLength / 4 - 2);
			console.log("Skydome ready!", skydomeWidth, skydomeHeight, skydome);
			for (let worker of workers)
				worker.postMessage({ type: "setSkydome", skydomeWidth: skydomeWidth, skydomeHeight: skydomeHeight, skydome: skydome });
			reset();
		});
}
