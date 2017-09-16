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
