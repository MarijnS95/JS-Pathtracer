//main script that controls the page and commands the worker
//http://w3c.github.io/html/infrastructure.html#transferable-objects
//----------global variables for controller----------
var ctx = null;
var workers = [];
var accumulator = null;
var numSamples = 0, scale = 1;
var isRendering = false;
var id = null;
var camera = null;
var syncPoint = null;

var spheres = [
	new Sphere(new V(0, -10000, 0), 9999 * 9999, 0.4, 0.15),
	new Sphere(new V(-1, 0, 4), 0.32, 0, 1),
	new Sphere(new V(1, 0, 4), 0.32, 1, 0),
	new Sphere(new V(0, 0, 2.8), 0.32, 0, 0, 1)
];

//, new Sphere(new V(0, 0, 12), 0.32, 1, 0, 0)];
spheres[0].t = true;
spheres[0].gloss = 0.0001;
spheres[0].diffCol = new V(0.7);
spheres[0].specCol = new V(0.7);

spheres[2].diffCol = new V(1, 0, 0);

spheres[3].diffCol = new V(1);
spheres[3].absCol = new V(.2, .93, .93).mul(2.5);
spheres[3].rIdx = 1.5;

var lights = [];//[new Light(new V(2), new V(40))];

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
	var xch = ctx.canvas.width / chunkWidth;
	for (var i = 0; i < workers.length; i++)
		workers[i].postMessage({ type: "startRender", xChunks: xch, totalWork: xch * (ctx.canvas.height / chunkHeight), stride: ctx.canvas.width, rnd: numSamples * Math.random() * 0x7fff * 154323451 >>> 0 });
}
function sat(f) {
	f *= scale;
	return (f > 1 ? 1 : (f < 0 ? 0 : Math.sqrt(f))) * 255;
}

function renderFinished() {
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	var i = 0;
	for (i = 0; i < ctx.canvas.width * ctx.canvas.height; i++) {
		id.data[i * 4] = sat(accumulator[i * 3]);
		id.data[i * 4 + 1] = sat(accumulator[i * 3 + 1]);
		id.data[i * 4 + 2] = sat(accumulator[i * 3 + 2]);
		id.data[i * 4 + 3] = 255;
	}
	ctx.putImageData(id, 0, 0);
	if (isRendering)
		requestAnimationFrame(render);
	console.timeEnd("renderTime");
}

//initialize
addEventListener("load", function () {
	loadSkydome();
	//todo: load skydome, start renderer
	ctx = document.querySelector("canvas").getContext("2d");
	accumulator = new Float32Array(new SharedArrayBuffer(ctx.canvas.width * ctx.canvas.height * 3 * 4));
	syncPoint = new Uint32Array(new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * 2));
	id = ctx.createImageData(ctx.canvas.width, ctx.canvas.height);
	//spawn webworkers
	for (var i = 0; i < 8; i++) {
		workers.push(new Worker("ChunkRenderer.js"));
		workers[i].onmessage = workerMessage;
		workers[i].postMessage({ type: "setSpheres", spheres: spheres });
		workers[i].postMessage({ type: "setLights", lights: lights });
		workers[i].postMessage({ type: "setAccumulator", accumulator: accumulator });
		workers[i].postMessage({ type: "setSyncPoint", syncPoint: syncPoint });
	}
	camera = new Camera(new V(0), new V(0, 0, 1));
	console.log("Created all workers");
	//render();
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

var skydomeWidth = 0, skydomeHeight = 0;

function loadSkydome() {
	fetch("Assets/uffizi_probe.float4").then(r => r.arrayBuffer().then(ab => {
		var dv = new DataView(ab);
		skydomeWidth = dv.getInt32(0, true);
		skydomeHeight = dv.getInt32(4, true);
		var skydomeView = new Float32Array(ab, 8, dv.byteLength / 4 - 2);
		// Only want the skydome in memory once, shared for all threads.
		var sab = new SharedArrayBuffer(skydomeView.byteLength);
		skydome = new Float32Array(sab);
		//skydomeView.transfer(skydome);
		for (var i = 0; i < skydomeView.length; i++)
			skydome[i] = skydomeView[i];
		delete skydomeView, dv, ab;
		console.log("Skydome ready!", skydomeWidth, skydomeHeight, skydome);
		for (var i = 0; i < workers.length; i++)
			workers[i].postMessage({ type: "setSkydome", skydomeWidth: skydomeWidth, skydomeHeight: skydomeHeight, skydome: skydome });
		reset();
	}));
}