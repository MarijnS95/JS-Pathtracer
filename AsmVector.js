function VectorAsmModule(stdlib, foreign, heap) {
	"use asm";

	const fround = stdlib.Math.fround;
	const sqrt = stdlib.Math.sqrt;
	// const sin = stdlib.Math.sin;
	// const cos = stdlib.Math.cos;
	// const atan2 = stdlib.Math.atan2;
	const exp = stdlib.Math.exp;
	const imul = stdlib.Math.imul;

	const f32 = new stdlib.Float32Array(heap);

	const vectorSize = 12;
	var stackBase = 0;
	var heapSize = 0;
	var vZero = 0;
	var vOne = 0;

	function init(hs) {
		hs = hs | 0;

		heapSize = hs;

		vZero = Push(fround(0), fround(0), fround(0)) | 0;
		vOne = Push(fround(1), fround(1), fround(1)) | 0;
	}

	function V(pos, x, y, z) {
		// Writes a vector to a given position
		pos = pos | 0;
		x = fround(x);
		y = fround(y);
		z = fround(z);

		f32[pos >> 2] = x;
		f32[pos + 4 >> 2] = y;
		f32[pos + 8 >> 2] = z;
	}

	function VS(pos, f) {
		// Writes a vector to a given position
		pos = pos | 0;
		f = fround(f);

		V(pos, f, f, f);
	}

	function Mov(dest, src) {
		dest = dest | 0;
		src = src | 0;

		f32[dest >> 2] = f32[src >> 2];
		f32[dest + 4 >> 2] = f32[src + 4 >> 2];
		f32[dest + 8 >> 2] = f32[src + 8 >> 2];
	}

	function AllocNext() {
		var pos = 0;

		pos = stackBase | 0;

		stackBase = stackBase + vectorSize | 0;

		// if ((stackBase | 0) >= (heapSize | 0))
		// 	return -1;

		return pos | 0;
	}

	function Pop() {
		stackBase = stackBase - vectorSize | 0;
	}

	function PopCnt(count) {
		count = count | 0;

		// stackBase = (stackBase - ((vectorSize | 0) * (count | 0)) | 0) | 0;
		stackBase = stackBase - imul(vectorSize | 0, count) | 0;
	}

	function Push(x, y, z) {
		x = fround(x);
		y = fround(y);
		z = fround(z);

		V(stackBase, x, y, z);

		return AllocNext() | 0;
	}

	function Dup(pos) {
		pos = pos | 0;

		Mov(stackBase, pos);

		return AllocNext() | 0;
	}

	function PushF(f) {
		f = fround(f);

		V(stackBase, f, f, f);

		return AllocNext() | 0;
	}

	function Add(dest, src) {
		dest = dest | 0;
		src = src | 0;

		AddXYZ(
			dest,
			fround(f32[src >> 2]),
			fround(f32[src + 4 >> 2]),
			fround(f32[src + 8 >> 2]));
	}

	function AddF(dest, f) {
		dest = dest | 0;
		f = fround(f);

		AddXYZ(dest, f, f, f);
	}

	function AddXYZ(dest, x, y, z) {
		dest = dest | 0;
		x = fround(x);
		y = fround(y);
		z = fround(z);

		V(dest,
			fround(f32[dest >> 2] + x),
			fround(f32[dest + 4 >> 2] + y),
			fround(f32[dest + 8 >> 2] + z));
	}

	function Sub(dest, src) {
		dest = dest | 0;
		src = src | 0;

		SubXYZ(
			dest,
			fround(f32[src >> 2]),
			fround(f32[src + 4 >> 2]),
			fround(f32[src + 8 >> 2]));
	}

	function RSub(dest, src) {
		dest = dest | 0;
		src = src | 0;

		V(dest,
			fround(f32[src >> 2] - f32[dest >> 2]),
			fround(f32[src + 4 >> 2] - f32[dest + 4 >> 2]),
			fround(f32[src + 8 >> 2] - f32[dest + 8 >> 2]));
	}

	function SubF(dest, f) {
		dest = dest | 0;
		f = fround(f);

		SubXYZ(dest, f, f, f);
	}

	function SubXYZ(dest, x, y, z) {
		dest = dest | 0;
		x = fround(x);
		y = fround(y);
		z = fround(z);

		V(dest,
			fround(f32[dest >> 2] - x),
			fround(f32[dest + 4 >> 2] - y),
			fround(f32[dest + 8 >> 2] - z));
	}

	function FSub(dest, f) {
		dest = dest | 0;
		f = fround(f);

		XYZSub(dest, f, f, f);
	}

	function XYZSub(dest, x, y, z) {
		dest = dest | 0;
		x = fround(x);
		y = fround(y);
		z = fround(z);

		V(dest,
			fround(x - f32[dest >> 2]),
			fround(y - f32[dest + 4 >> 2]),
			fround(z - f32[dest + 8 >> 2]));
	}

	function Mul(dest, src) {
		dest = dest | 0;
		src = src | 0;

		MulXYZ(
			dest,
			fround(f32[src >> 2]),
			fround(f32[src + 4 >> 2]),
			fround(f32[src + 8 >> 2]));
	}

	function MulF(dest, f) {
		dest = dest | 0;
		f = fround(f);

		MulXYZ(dest, f, f, f);
	}

	function MulXYZ(dest, x, y, z) {
		dest = dest | 0;
		x = fround(x);
		y = fround(y);
		z = fround(z);

		V(dest,
			fround(f32[dest >> 2] * x),
			fround(f32[dest + 4 >> 2] * y),
			fround(f32[dest + 8 >> 2] * z));
	}

	function Div(dest, src) {
		dest = dest | 0;
		src = src | 0;

		DivXYZ(
			dest,
			fround(f32[src >> 2]),
			fround(f32[src + 4 >> 2]),
			fround(f32[src + 8 >> 2]));
	}

	function DivF(dest, f) {
		dest = dest | 0;
		f = fround(f);

		DivXYZ(dest, f, f, f);
	}

	function DivXYZ(dest, x, y, z) {
		dest = dest | 0;
		x = fround(x);
		y = fround(y);
		z = fround(z);

		V(dest,
			fround(f32[dest >> 2] / x),
			fround(f32[dest + 4 >> 2] / y),
			fround(f32[dest + 8 >> 2] / z));
	}

	function FDiv(dest, f) {
		dest = dest | 0;
		f = fround(f);

		XYZDiv(dest, f, f, f);
	}

	function XYZDiv(dest, x, y, z) {
		dest = dest | 0;
		x = fround(x);
		y = fround(y);
		z = fround(z);

		V(dest,
			fround(x / f32[dest >> 2]),
			fround(y / f32[dest + 4 >> 2]),
			fround(z / f32[dest + 8 >> 2]));
	}

	function Length(pos) {
		pos = pos | 0;
		var x = fround(0);
		var y = fround(0);
		var z = fround(0);

		x = fround(f32[pos >> 2]);
		y = fround(f32[pos + 4 >> 2]);
		z = fround(f32[pos + 8 >> 2]);

		return fround(sqrt(fround(
			fround(
				fround(x * x) +
				fround(y * y)
			) + fround(z * z)
		)));
	}

	function Dot(left, right) {
		left = left | 0;
		right = right | 0;

		return fround(
			fround(
				fround(f32[left >> 2] * f32[right >> 2]) +
				fround(f32[left + 4 >> 2] * f32[right + 4 >> 2])
			) + fround(f32[left + 8 >> 2] * f32[right + 8 >> 2]));
	}

	function Cross(dest, src) {
		dest = dest | 0;
		src = src | 0;

		var lx = fround(0);
		var ly = fround(0);
		var lz = fround(0);

		var rx = fround(0);
		var ry = fround(0);
		var rz = fround(0);

		lx = fround(f32[dest >> 2]);
		ly = fround(f32[dest + 4 >> 2]);
		lz = fround(f32[dest + 8 >> 2]);

		rx = fround(f32[src >> 2]);
		ry = fround(f32[src + 4 >> 2]);
		rz = fround(f32[src + 8 >> 2]);

		V(dest,
			fround(fround(ly * rz) - fround(lz * ry)),
			fround(fround(lz * rx) - fround(lx * rz)),
			fround(fround(lx * ry) - fround(ly * rx)));
	}

	function NormF(dest, f) {
		dest = dest | 0;
		f = fround(f);

		var l = fround(0);
		l = fround(Length(dest));

		if (l > fround(0))
			MulF(dest, fround(f / l));
	}

	function Norm(dest) {
		dest = dest | 0;

		NormF(dest, fround(1));
	}

	return {
		init: init,
		V: V,
		VS: VS,
		Mov: Mov,
		AllocNext: AllocNext,
		Pop: Pop,
		PopCnt: PopCnt,
		Push: Push,
		PushF: PushF,
		Dup: Dup,
		Add: Add,
		AddF: AddF,
		AddXYZ: AddXYZ,
		Sub: Sub,
		RSub: RSub,
		SubF: SubF,
		SubXYZ: SubXYZ,
		FSub: FSub,
		XYZSub: XYZSub,
		Mul: Mul,
		MulF: MulF,
		MulXYZ: MulXYZ,
		Div: Div,
		DivF: DivF,
		DivXYZ: DivXYZ,
		FDiv: FDiv,
		XYZDiv: XYZDiv,
		Length: Length,
		Dot: Dot,
		Cross: Cross,
		NormF: NormF,
		Norm: Norm,
	};
}

const heapSize = 8192;

const asmHeap = new ArrayBuffer(heapSize);
const asmFHeap = new Float32Array(asmHeap);
const vectorAsm = VectorAsmModule(self, null, asmHeap);
vectorAsm.init(heapSize);

function VectorAsmPushV(v) {
	return vectorAsm.Push(v.x, v.y, v.z);
}

function VectorAsmMovV(pos, v) {
	return vectorAsm.V(pos, v.x, v.y, v.z);
}

function VectorAsmGetV(pos) {
	return new V(asmFHeap[pos >> 2], asmFHeap[pos + 4 >> 2], asmFHeap[pos + 8 >> 2]);
}
