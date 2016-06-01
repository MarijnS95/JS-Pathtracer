//initialize 
importScripts("Shared.js", "Vector.js");

//script running in a web worker
var id = null;
var acc = new Float32Array(chunkWidth * chunkHeight * 3);

function renderChunk(x, y) {
	//http://stackoverflow.com/a/31265419/2844473
	//my plans exactly
	for (var xc = 0; xc < chunkWidth; xc++)
		for (var yc = 0; yc < chunkHeight; yc++) {
			var base = (xc + yc * chunkWidth) * 3;
			acc[base] = x * chunkWidth + xc;
			acc[base + 1] = y * chunkWidth + yc;
			acc[base + 2] = 0;
		}
}

addEventListener("message", function (e) {
	//todo
	switch (e.data.type) {
		case "render":
			renderChunk(e.data.x, e.data.y);
			postMessage({ type: "chunkDone", x: e.data.x, y: e.data.y, acc: acc });
			//postMessage({ type: "chunkDone", x: e.data.x, y: e.data.y, id: e.data.id, acc: e.data.acc},[e.data.acc.buffer]);
			break;
		case "setid":
			id = e.data.id;
			break;
	}
});
