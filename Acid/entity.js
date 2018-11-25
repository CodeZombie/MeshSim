var Acid = Acid||{};

Acid.Entity = function(x_, y_) {
	this.objectType = "entity";
	this.id = -1; //if this stays -1, either entityManager has fucked up, or the entity was not attached to the entitymanager
	this.setX(x_);
	this.setY(y_);
	this.clickable = true;
	this.hoverable = true;
	this.spriteSheet;
	this.spriteIndex;
	this.sprite;
	this.boundingBox;
	this.hovered = false;
};

Acid.Entity.prototype.setX = function(x_) {
	this.x = x_; //dubdivide into different areas. OKSSSS
	this.updateSubdivision();
}

Acid.Entity.prototype.setY = function(y_) {
	this.y = y_;
	this.updateSubdivision();
}

Acid.Entity.prototype.updateSubdivision = function() {
	//call entity manager
}


Acid.Entity.prototype.onAttachToEntityManager = function() {
	
}

Acid.Entity.prototype.setId = function(id_) {
	this.id = id_;
}
	
Acid.Entity.prototype.setSprite = function(spriteSheet_, spriteIndex_) {
	if(spriteSheet_ === undefined) {
		Acid.System.printError("Attemping to set undefined sprite to entity with id: " + this.id);
		return;
	}
	this.spriteSheet = spriteSheet_;
	this.spriteIndex = spriteIndex_;
};

Acid.Entity.prototype.onCollision = function(other_) {
    //console.log("I am " + this.id + "and im getting hit with: " + other_.id);
}

Acid.Entity.prototype.isClickable = function() {
	if (this.boundingBox == null) {
		return false;
	}

	return this.clickable;
}

Acid.Entity.prototype.isHoverable = function() {
	if (this.boundingBox == null) {
		return false;
	}

	return this.hoverable;
}

Acid.Entity.prototype.setBoundingBox = function(shape_) {
	this.boundingBox = shape_;
	this.boundingBox.setParent(this);
}

Acid.Entity.prototype.getBoundingBox = function() {
	if (this.boundingBox != null) {
		return this.boundingBox;
	}
	return false;
}

Acid.Entity.prototype.draw = function() {
	if(this.spriteSheet !== undefined) {
		this.spriteSheet.drawSprite(this.spriteIndex, this.x, this.y);
	}
};

Acid.Entity.prototype.update = function() {
	this.hovered = false;
	if(this.getBoundingBox().checkPoint(Acid.Mouse.getX(), Acid.Mouse.getY())){
		this.hovered = true;
	}
}

Acid.Entity.prototype.onMouseDown = function() {
}

Acid.Entity.prototype.onMouseUp = function() {
}

Acid.Entity.prototype.onMouseMove = function() {
}

//MAKE ENTITY A BASE CLASS THAT OTHERS CAN INHERIT FROM, WITH BASIC THINGS LIKE DRAW(), UPDATE(), isOnPoint(), collisionCheck(other), etc
