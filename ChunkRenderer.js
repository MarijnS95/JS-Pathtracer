//script running in a web worker
var id = null;

function renderChunk(x, y){
	//http://stackoverflow.com/a/31265419/2844473
//my plans exactly
	for(var xc=0;xc<chunkWidth;xc++)
		for(var yc=0;yc<chunkHeight;yc++){
			var base = (xc + yc * chunkWidth) * 4;
			id.data[base] = x * chunkWidth + xc;
			id.data[base + 1] = y * chunkWidth + yc;
			id.data[base + 3] = 255;
		}
}

//initialize 
importScripts("Shared.js", "Vector.js");

addEventListener("message", function (e) { 
	//todo
	switch (e.data.type) {
		case "render":
			renderChunk(e.data.x, e.data.y);
			postMessage({ type: "chunkDone", x: e.data.x, y: e.data.y, id:id});
			//postMessage({ type: "chunkDone", x: e.data.x, y: e.data.y, id: e.data.id, acc: e.data.acc},[e.data.acc.buffer]);
			break;
		case "setid":
			id = e.data.id;
			break;
	}
});
