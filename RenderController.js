//main script that controls the page and commands the worker
//http://w3c.github.io/html/infrastructure.html#transferable-objects
//----------global variables for controller----------
var ctx = null;
var workers = [];
var accumulator = null;
var workStarted = 0, workFinished = 0;
var numXchunks = 0, numYchunks = 0;
var numSamples = 0, scale = 1;
var isRendering = false;
var id = null;
var camera = null;

var spheres = [new Sphere(new V(0, -500, 0), 249100, 0.3, 0.7), new Sphere(new V(-1, 0, 4), 0.32, 0, 1), new Sphere(new V(1, 0, 4), 0.32, 1, 0), new Sphere(new V(0, 0, 2.8), 0.32, 0, 0, 1)];//, new Sphere(new V(0, 0, 12), 0.32, 1, 0, 0)];
spheres[0].t = true;
spheres[2].c = new V(1, 0, 0);
spheres[3].c = new V(0, 1, 1);
spheres[3].rIdx = 1.5;

var lights = [];//[new Light(new V(2), new V(40))];

function workerMessage(e) {
	switch (e.data.type) {
		case "chunkDone":
			//console.log("Chunk %d, %d has finished", e.data.x, e.data.y);
			//ctx.putImageData(e.data.id, e.data.x * chunkWidth, e.data.y * chunkHeight);
			workFinished++;
			//todo deal with passing another chunk if work has not yet finished
			sendWork(e.srcElement);
			//accumulator.set(e.data.acc, (e.data.x * chunkWidth + e.data.y * chunkHeight * ctx.canvas.width) * 3);
			for (var i = 0; i < chunkHeight; i++) {
				accumulator.set(e.data.acc.subarray(i * chunkWidth * 3, (i + 1) * chunkWidth * 3), (e.data.x * chunkWidth + (e.data.y * chunkHeight + i) * ctx.canvas.width) * 3);
			}
			break;
	}
}

var tempArr = new Float32Array(chunkWidth * chunkHeight * 3);

function sendWork(worker) {
	if (workStarted < 64) {
		var x = workStarted % numXchunks | 0,
			y = (workStarted / numXchunks) | 0;
		for (var i = 0; i < chunkHeight; i++) {
			var base = (x * chunkWidth + (y * chunkHeight + i) * ctx.canvas.width) * 3;
			tempArr.set(accumulator.subarray(base, base + chunkWidth * 3), i * chunkWidth * 3);
		}
		var msg = { type: "render", x: x, y: y, acc: tempArr };
		workStarted++;
		worker.postMessage(msg);
	} else {
		if (workFinished == 64) {
			renderFinished();
		} else {
			//console.log("no work in queue anymore...");
		}
	}
}

function render() {
	workStarted = workFinished = 0;
	console.time("renderTime");
	numSamples++;
	scale = 1 / numSamples;
	for (var i = 0; i < workers.length; i++) {
		sendWork(workers[i]);
	}
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
	//console.log(i, id.data.length, id.data);
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
	numXchunks = ctx.canvas.width / chunkWidth;
	numYchunks = ctx.canvas.height / chunkHeight;
	accumulator = new Float32Array(ctx.canvas.width * ctx.canvas.height * 3);
	id = ctx.createImageData(ctx.canvas.width, ctx.canvas.height);
	//spawn webworkers
	for (var i = 0; i < 8; i++) {
		workers.push(new Worker("ChunkRenderer.js"));
		workers[i].onmessage = workerMessage;
		workers[i].postMessage({ type: "setSpheres", spheres: spheres });
		workers[i].postMessage({ type: "setLights", lights: lights });
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
	for (var i = 0; i < accumulator.length; i++)
		accumulator[i] = 0;
	numSamples = 0;
}

var skydomeWidth = 0, skydomeHeight = 0;

function loadSkydome() {
	var skydomeRequest = new XMLHttpRequest();
	skydomeRequest.open("GET", "Assets/uffizi_probe.float4"); //"https://dl.dropboxusercontent.com/u/86176287/graphics/js_cpu_fun/Assets/uffizi_probe.float4"
	skydomeRequest.responseType = "arraybuffer";
	skydomeRequest.onreadystatechange = function () {
		console.log("skydome readystate change", skydomeRequest.readyState, skydomeRequest.status, skydomeRequest.statusText);
		if (skydomeRequest.readyState === 4) {// && skydomeRequest.status == 200
			//chrome needs to be started with --allow-file-access-from-files, and it'll have a statuscode of 0 when finishing
			var dv = new DataView(skydomeRequest.response);
			skydomeWidth = dv.getInt32(0, true);
			skydomeHeight = dv.getInt32(4, true);
			skydome = new Float32Array(skydomeRequest.response, 8, dv.byteLength / 4 - 2);
			console.log("Skydome ready!", skydomeWidth, skydomeHeight, skydome);
			for (var i = 0; i < workers.length; i++) {
				workers[i].postMessage({ type: "setSkydome", skydomeWidth: skydomeWidth, skydomeHeight: skydomeHeight, skydome: skydome });
			}
			reset();
		}
	}
	skydomeRequest.send();
}