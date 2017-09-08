function Material(diff, spec = 0, refr = 0) {
	if (typeof diff != "number") {
		this.diff = diff.diff;
		this.spec = diff.spec;
		this.refr = diff.refr;
		this.gloss = diff.gloss;
		this.rIdx = diff.rIdx;
		this.tiled = diff.tiled;
		this.diffCol = new V(diff.diffCol);
		this.specCol = new V(diff.specCol);
		this.absCol = new V(diff.absCol);
	} else {
		this.diff = diff;
		this.spec = spec;
		this.refr = refr;
		this.gloss = 0;
		this.tiled = false;
		this.diffCol = new V(0);
		this.specCol = new V(1);
		this.absCol = new V(1);
	}
};
