function Material(diffuse, specular = 0, refraction = 0) {
	if (typeof diffuse != 'number') {
		this.diffuse = diffuse.diffuse;
		this.specular = diffuse.specular;
		this.refraction = diffuse.refraction;
		this.glossiness = diffuse.glossiness;
		this.refractionIndex = diffuse.refractionIndex;
		this.tiled = diffuse.tiled;
		this.diffuseColor = V.copy(diffuse.diffuseColor);
		this.specularColor = V.copy(diffuse.specularColor);
		this.absorptionColor = V.copy(diffuse.absorptionColor);
	} else {
		this.diffuse = diffuse;
		this.specular = specular;
		this.refraction = refraction;
		if (Math.abs(this.diffuse + this.specular + this.refraction - 1) > .01)
			// Sum of all probabilities should be 1. Lower than that and the result has cases where no interaction happens (a black pixel is emitted). Higher means the last selector(s) (in the order of transmission, specular, diffuse) will have a lower or maybe even 0 probability of being called/applied.
			console.warn("Light interaction probabilties for", this, "do not sum to 1. Resulting render may be incorrect.");

		// Also, reflection is a bit weird, since this is one thing. It can be a perfect (specular) reflection, a completely random (diffuse) reflection (Where the light has scattered through the material), or something inbetween (called glossiness).
		// Here, we keep them separate to apply the colors correctly, and because randomizing a reflected ray causes different results than randomizing the surface normal.
		// So, a diffuse reflection is random by definition, but a specular reflection (where the light has not interacted with the material) can be in a randomized direction as well, when the surface is irregular.

		this.glossiness = 0;
		this.refractionIndex = 1;
		this.tiled = false;
		this.diffuseColor = V.single(1);
		this.specularColor = V.single(1);
		this.absorptionColor = V.single(0);
	}
};

Material.prototype.tileStrength = function (r) {
	const mask = mul(r.I, fsub(1, r.N)).mulf(16).addf(2000);
	const edge = (mask.x & 31) == 0 || (mask.y & 31) == 0 || (mask.z & 31) == 0;
	return edge ? .05 : .4;
};

Material.prototype.getDiffuse = function (r) {
	if (this.tiled)
		return mulf(this.diffuseColor, this.tileStrength(r));
	else
		return this.diffuseColor;
};

Material.prototype.getSpecular = function (r) {
	if (this.tiled)
		return mulf(this.specularColor, this.tileStrength(r));
	else
		return this.specularColor;
};
