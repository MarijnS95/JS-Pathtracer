//main script that controls the page and commands the worker
//http://w3c.github.io/html/infrastructure.html#transferable-objects
//----------global variables for controller----------
var ctx = null;
var workers = [];
var accumulator = null;
var workStarted = 0, workFinished = 0;
var numXchunks = 0, numYchunks = 0;
var numFrames = 0, scale = 1;
var isRendering = false;

function workerMessage(e) {
	switch (e.data.type) {
		case "chunkDone":
			//console.log("Chunk %d, %d has finished", e.data.x, e.data.y);
			ctx.putImageData(e.data.id, e.data.x * chunkWidth, e.data.y * chunkHeight);
			workFinished++;
			//todo deal with passing another chunk if work has not yet finished
			sendWork(e.srcElement);
			//accumulator.set(e.data.acc, e.data.x * chunkWidth + e.data.y * chunkHeight * chunkWidth);
			delete e.data.acc;
			delete e;
			break;
	}
}

function sendWork(worker) {
	if (workStarted < 64) {
		var x = workStarted % numXchunks,
			y = (workStarted / numXchunks) | 0;
		//var accChunk = accumulator.subarray(x * chunkWidth + y * chunkWidth * chunkHeight);
		var msg = { type: "render", x: x, y: y, scale: scale };
		workStarted++;
		worker.postMessage(msg);
	} else {
		if (workFinished == 64) {
			console.timeEnd("renderTime");
			if (isRendering)
				requestAnimationFrame(render);
		} else {
			//console.log("no work in queue anymore...");
		}
	}
}

function render() {
	workStarted = workFinished = 0;
	console.time("renderTime");
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	numFrames++;
	scale = 1 / numFrames;
	for (var i = 0; i < workers.length; i++) {
		sendWork(workers[i]);
	}

	/*
	var scale = 1 / ++samples;
	for (x = 0; x < 512; x++)
		for (y = 0; y < 512; y++) {
			var debug = (y == 255 && (x & 15) == 0) && maxDepth != 0;
			var r = cam.getRay(x + Math.random(), y + Math.random());
			var c = RayTrace(r, 0, debug, 1);
			var i = (x + y * 512) * 4,
				j = (x + y * 512) * 3;
			accumulator[j] += c.x;
			accumulator[j + 1] += c.y;
			accumulator[j + 2] += c.z;

			data[i] = saturate(accumulator[j] * scale);
			data[i + 1] = saturate(accumulator[j + 1] * scale);
			data[i + 2] = saturate(accumulator[j + 2] * scale);
			data[i + 3] = 255;
		}*/
	//ctx.putImageData(id, 0, 0);
	//requestAnimationFrame(render);
}

//initialize
addEventListener("load", function () {
	//todo: load skydome, start renderer
	ctx = document.querySelector("canvas").getContext("2d");
	numXchunks = ctx.canvas.width / chunkWidth;
	numYchunks = ctx.canvas.height / chunkHeight;
	accumulator = new Float32Array(512 * 512 * 3);
	//spawn webworkers
	for (var i = 0; i < 8; i++) {
		var id = ctx.createImageData(chunkWidth, chunkHeight);
		workers.push(new Worker("ChunkRenderer.js"));
		workers[i].onmessage = workerMessage;
		workers[i].postMessage({ type: "setid", id: id });
	}
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
