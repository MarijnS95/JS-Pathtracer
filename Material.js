function Material(diff, spec = 0, refr = 0) {
	if (typeof diff != "number") {
		this.diff = diff.diff;
		this.spec = diff.spec;
		this.refr = diff.refr;
		this.gloss = diff.gloss;
		this.rIdx = diff.rIdx;
		this.tiled = diff.tiled;
		this.diffCol = V.copy(diff.diffCol);
		this.specCol = V.copy(diff.specCol);
		this.absCol = V.copy(diff.absCol);
	} else {
		this.diff = diff;
		this.spec = spec;
		this.refr = refr;
		this.gloss = 0;
		this.rIdx = 1;
		this.tiled = false;
		this.diffCol = V.single(1);
		this.specCol = V.single(1);
		this.absCol = V.single(0);
	}
};

Material.prototype.tileStrength = function (r) {
	const mask = mul(r.I, fsub(1, r.N)).mulf(16).addf(2000);
	const edge = (mask.x & 31) == 0 || (mask.y & 31) == 0 || (mask.z & 31) == 0;
	return edge ? .05 : .4;
};

Material.prototype.getDiffuse = function (r) {
	if (this.tiled)
		return mulf(this.diffCol, this.tileStrength(r));
	else
		return this.diffCol;
};

Material.prototype.getSpecular = function (r) {
	if (this.tiled)
		return mulf(this.specCol, this.tileStrength(r));
	else
		return this.specCol;
};
