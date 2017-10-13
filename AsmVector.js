function VectorAsmModule(stdlib, foreign, heap) {
	"use asm";

	const fround = stdlib.Math.fround;
	const sqrt = stdlib.Math.sqrt;
	const sin = stdlib.Math.sin;
	const cos = stdlib.Math.cos;
	const exp = stdlib.Math.exp;
	const imul = stdlib.Math.imul;
	const abs = stdlib.Math.abs;
	const PI = stdlib.Math.PI;

	const f32 = new stdlib.Float32Array(heap);

	const vectorSize = 12;
	var stackBase = 0;
	var heapSize = 0;

	var vZero = 0;
	var vOne = 0;
	var PI_2 = fround(0);

	var seed = 0;

	function init(hs) {
		hs = hs | 0;

		heapSize = hs;

		vZero = Push(fround(0), fround(0), fround(0)) | 0;
		vOne = Push(fround(1), fround(1), fround(1)) | 0;

		PI_2 = fround(fround(PI) * fround(2));
	}

	function setSeed(s) {
		s = s | 0;
		seed = s >>> 0;
	}

	function xor32() {
		seed = seed ^ seed << 13;
		seed = seed ^ seed >> 17;
		seed = seed ^ seed << 5;
		return fround(fround(seed >>> 0) * fround(2.3283064365387e-10));
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

	function Neg(dest) {
		dest = dest | 0;

		V(
			dest,
			fround(-f32[dest >> 2]),
			fround(-f32[dest + 4 >> 2]),
			fround(-f32[dest + 8 >> 2]));
	}

	function Sort(left, right) {
		left = left | 0;
		right = right | 0;

		var lx = fround(0);
		var ly = fround(0);
		var lz = fround(0);

		var rx = fround(0);
		var ry = fround(0);
		var rz = fround(0);

		lx = fround(f32[left >> 2]);
		ly = fround(f32[left + 4 >> 2]);
		lz = fround(f32[left + 8 >> 2]);

		rx = fround(f32[right >> 2]);
		ry = fround(f32[right + 4 >> 2]);
		rz = fround(f32[right + 8 >> 2]);

		if (lx > rx) {
			f32[left >> 2] = rx;
			f32[right >> 2] = lx;
		}

		if (ly > ry) {
			f32[left + 4 >> 2] = ry;
			f32[right + 4 >> 2] = ly;
		}

		if (lz > rz) {
			f32[left + 8 >> 2] = rz;
			f32[right + 8 >> 2] = lz;
		}
	}

	function MinIdx(pos) {
		pos = pos | 0;

		var x = fround(0);
		var y = fround(0);
		var z = fround(0);

		x = fround(f32[pos >> 2]);
		y = fround(f32[pos + 4 >> 2]);
		z = fround(f32[pos + 8 >> 2]);

		if (y < x)
			return (y < z ? 1 : 2) | 0;
		return (x < z ? 0 : 2) | 0;
	}

	function MaxIdx(pos) {
		pos = pos | 0;

		var x = fround(0);
		var y = fround(0);
		var z = fround(0);

		x = fround(f32[pos >> 2]);
		y = fround(f32[pos + 4 >> 2]);
		z = fround(f32[pos + 8 >> 2]);

		if (y > x)
			return (y > z ? 1 : 2) | 0;
		return (x > z ? 0 : 2) | 0;
	}

	function At(pos, i) {
		pos = pos | 0;
		i = i | 0;

		return fround(f32[pos + (i << 2) >> 2]);
	}

	function SetAt(pos, i, v) {
		pos = pos | 0;
		i = i | 0;
		v = fround(v);

		f32[pos + (i << 2) >> 2] = v;
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

	function Exp(dest) {
		dest = dest | 0;

		V(dest,
			fround(exp(+f32[dest >> 2])),
			fround(exp(+f32[dest + 4 >> 2])),
			fround(exp(+f32[dest + 8 >> 2])));
	}

	function Abs(dest) {
		dest = dest | 0;

		V(dest,
			fround(abs(fround(f32[dest >> 2]))),
			fround(abs(fround(f32[dest + 4 >> 2]))),
			fround(abs(fround(f32[dest + 8 >> 2]))));
	}

	function Reflect(dest, src) {
		dest = dest | 0;
		src = src | 0;

		var d = fround(0);
		var n = 0;

		d = fround(fround(Dot(dest, src)) * fround(2));
		n = Dup(src) | 0;
		MulF(n, d);
		Sub(dest, n);
		Pop();
	}

	function FrameMul(dest, src) {
		dest = dest | 0;
		src = src | 0;

		var xa = fround(0);
		var ya = fround(0);
		var za = fround(0);

		var xt = fround(0);
		var yt = fround(0);
		var zt = fround(0);
		var T = 0;
		var B = 0;

		xt = fround(f32[dest >> 2]);
		yt = fround(f32[dest + 4 >> 2]);
		zt = fround(f32[dest + 8 >> 2]);

		xa = fround(abs(xt));
		ya = fround(abs(yt));
		za = fround(abs(zt));

		if ((fround(xa) < fround(ya)) | 0 & (fround(xa) < fround(za)) | 0)
			xt = fround(1);
		else if ((fround(ya) < fround(xa)) | 0 & (fround(ya) < fround(za)) | 0)
			yt = fround(1);
		else
			zt = fround(1);

		T = Push(xt, yt, zt) | 0;

		Cross(T, dest);
		Norm(T);

		B = Dup(T) | 0;
		Cross(B, dest);

		MulF(dest, fround(f32[src + 8 >> 2])); // N * v.z

		MulF(T, fround(f32[src >> 2])); // T * v.x
		Add(dest, T);

		MulF(B, fround(f32[src + 4 >> 2])); // B * v.y
		Add(dest, B);

		PopCnt(2);
	}

	function CosineHemSample(dest, v) {
		dest = dest | 0;
		v = fround(v);

		var phi = fround(0);
		var sinTheta = fround(0);

		if (v == fround(0)) {
			V(dest,
				fround(0),
				fround(0),
				fround(1));
		} else {
			v = fround(v * fround(xor32()));
			phi = fround(PI_2 * fround(xor32()));
			sinTheta = fround(sqrt(fround(v)));

			V(dest,
				fround(fround(cos(+phi)) * sinTheta),
				fround(fround(sin(+phi)) * sinTheta),
				fround(sqrt(fround(fround(1) - v))));
		}
	}

	function CosineHemFrame(dest, v) {
		dest = dest | 0;
		v = fround(v);
		var vec = 0;

		if (v != fround(0)) {
			vec = AllocNext() | 0;
			CosineHemSample(vec, v);
			FrameMul(dest, vec);
			Pop();
		}
	}

	return {
		init: init,
		setSeed: setSeed,
		xor32: xor32,
		V: V,
		VS: VS,
		Mov: Mov,
		AllocNext: AllocNext,
		Pop: Pop,
		PopCnt: PopCnt,
		Push: Push,
		PushF: PushF,
		Dup: Dup,
		Neg: Neg,
		Sort: Sort,
		MinIdx: MinIdx,
		MaxIdx: MaxIdx,
		At: At,
		SetAt: SetAt,
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
		Exp: Exp,
		Abs: Abs,
		Reflect: Reflect,
		FrameMul: FrameMul,
		CosineHemSample: CosineHemSample,
		CosineHemFrame: CosineHemFrame
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
