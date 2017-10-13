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
let renderInfo = null;
let logDiv = null;
let shouldReset = false;
let shouldInitializeStorage = true;

const floor = new Material(0.4, 0.6);
floor.tiled = true;
floor.glossiness = 0.0001;
floor.diffuseColor = V.single(0.7);
floor.specularColor = V.single(0.7);

const yellowdiffuse = new Material(1);
yellowdiffuse.diffuseColor = new V(1, 1, 0);

const redRefr = new Material(0, 0, 1);
redRefr.absorptionColor = new V(.2, .93, .93).mulf(2.5);
redRefr.refractionIndex = 1.5;

const blueTransparent = new Material(0, 0, 1);
blueTransparent.glossiness = 0.005;
blueTransparent.absorptionColor = new V(.93, .93, .2).mulf(3.5);

const objects = [
	new Plane(-1, new V(0, 1, 0), floor),
	new Sphere(new V(-1, 0, 4), 0.32, new Material(0, 1)),
	new Sphere(new V(1, 0, 4), 0.32, yellowdiffuse),
	new Sphere(new V(0, 0, 2.8), 0.32, redRefr),
	new Box(new V(-2, -.5, 2), new V(-1, .5, 3), blueTransparent),
];

const lights = [];

function workerMessage(e) {
	switch (e.data.type) {
		case 'renderDone':
			renderDone();
			break;
	}
}

function render() {
	renderStartTime = performance.now();

	if (shouldInitializeStorage) {
		console.log('New size: ', ctx.canvas.width, ctx.canvas.height);
		accumulator = new Float32Array(new SharedArrayBuffer(ctx.canvas.width * ctx.canvas.height * 3 * 4));
		imageData = ctx.createImageData(ctx.canvas.width, ctx.canvas.height);
		for (let worker of workers)
			worker.postMessage({
				type: 'setAccumulator',
				accumulator: accumulator
			});
		shouldInitializeStorage = false;
		shouldReset = true;
	}

	if (shouldReset) {
		accumulator.fill(0);
		numSamples = 0;

		renderInfo.textContent = 'pos: ' + camera.O.string() + '; dir: ' + camera.D.string() + '; focus: ' + camera.focalDistance.toFixed(2);

		shouldReset = false;
	}

	numSamples++;
	scale = 1 / numSamples;
	syncPoint.fill(0);
	let xch = ctx.canvas.width / chunkWidth;
	for (let worker of workers)
		worker.postMessage({ type: 'startRender', xChunks: xch, totalWork: xch * (ctx.canvas.height / chunkHeight), stride: ctx.canvas.width, rnd: numSamples * Math.random() * 0x7fff * 154323451 >>> 0 });
}
function sat(f) {
	f *= scale;
	if (f <= 0)
		return 0;
	if (f >= 1)
		return 255;
	return Math.sqrt(f) * 255;
}

function renderDone() {
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

addEventListener('load', function () {
	renderTimeText = document.querySelector('#renderTime');
	renderInfo = document.querySelector('#renderInfo');
	toggleButton = document.querySelector('#toggle');
	logDiv = document.querySelector('#log');

	// loadSkydome();
	let canvas = document.querySelector('canvas');
	ctx = canvas.getContext('2d');
	try {
		syncPoint = new Uint32Array(new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * 2));
	} catch (e) {
		console.error("Unable to create SharedArrayBuffer. Did you forget to turn on the flag at chrome://flags/#shared-array-buffer?");
		throw e;
	}

	for (let obj of objects)
		obj.type = obj.constructor.name;

	log('Spawning ' + navigator.hardwareConcurrency + ' worker threads...');
	for (let i = 0; i < navigator.hardwareConcurrency; i++) {
		worker = new Worker('ChunkRenderer.js');
		worker.onmessage = workerMessage;
		worker.postMessage({
			type: 'setup',
			objects: objects,
			syncPoint: syncPoint
		});
		workers.push(worker);
	}
	log('Worker threads spawned!');

	camera = new Camera(V.single(0), new V(0, 0, 1));
	toggleButton.addEventListener('click', toggleRendering);
	canvas.onresize = function (e) {
		shouldInitializeStorage = true;
		camera.update();
	};
});

function setIsRendering(value) {
	isRendering = value;
	toggleButton.textContent = isRendering ? 'Stop' : 'Start';
	if (isRendering)
		render();
}

function toggleRendering() {
	setIsRendering(!isRendering);
}

addEventListener('keypress', function (e) {
	if (e.which == 32)
		toggleRendering();
});

let skydomeWidth = 0, skydomeHeight = 0;

function loadSkydome() {
	log('Fetching skydome...');
	fetch('Assets/uffizi_probe.float4')
		.then(r => r.arrayBuffer())
		.then(ab => {
			const dv = new DataView(ab);
			skydomeWidth = dv.getInt32(0, true);
			skydomeHeight = dv.getInt32(4, true);
			skydome = new Float32Array(ab, 8, dv.byteLength / 4 - 2);
			for (let worker of workers)
				worker.postMessage({ type: 'setSkydome', skydomeWidth: skydomeWidth, skydomeHeight: skydomeHeight, skydome: skydome });
			log('Skydome ready!');
			shouldReset = true;
		});
}

function log(text) {
	const s = document.createElement('div');
	s.textContent = text;
	logDiv.appendChild(s);
}
