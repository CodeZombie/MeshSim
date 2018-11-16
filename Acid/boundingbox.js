//Bounding boxes are for collision detection and nothing else. 
//Every clickable/hoverable object will have a bounding box bound to it.

Acid = Acid || {};

Acid.Shape = function(args_) {
    this.radius = 32;
    this.width  = 32;
    this.height = 32;
    this.parent = null;
}

Acid.Shape.prototype.checkPoint = function(x_, y_, parent_x_, parent_y_) {
    //if [x_,y_] are within this box starting at global offset [parent_x_, parent_y_]
}

Acid.Shape.prototype.setParent = function(entity_) {
    this.parent = entity_;
}

Acid.Shape.prototype.setRadius = function(r_) {
    this.radius = r_;
}

Acid.Shape.prototype.getX = function() {
    return this.parent.x;
}

Acid.Shape.prototype.getY = function() {
    return this.parent.y;
}

/************* CIRCLE ******************/

Acid.Circle = function(args_) {
    Acid.Shape.call(this);
    if(args_.radius != null) {
        this.radius = args_.radius;
    }else {
        Acid.System.printError("Attempting to create Circle with no Raidus property.");
    }
}

Acid.Circle.prototype = Object.create(Acid.Shape.prototype);
Acid.Circle.prototype.constructor = Acid.Circle;

Acid.Circle.prototype.checkPoint = function(x_, y_) {
    var a = x_ - this.getX();
    var b = y_ - this.getY();
    if (Math.sqrt( a*a + b*b ) <= this.radius) { //I THINK THIS IS CORRECT LOL
        return true;
    }
    return false;
}

Acid.Circle.prototype.checkCircle = function(other_) {
    if (Math.sqrt(Math.pow(other_.getX() - this.getX(), 2) + Math.pow(other_.getY() - this.getY(), 2)) < (other_.radius + this.radius)) {
        return true;
    }
    return false;
}

/************* RECT ******************/

Acid.Rectangle = function(args_) {
    Acid.Shape.call(this);
    
    if(args_.width != null) {
        this.width = args_.width;
    }else {
        Acid.System.printError("Attempting to create Rectangle with no Width property.");
    }

    if(args_.height != null) {
        this.height = args_.height;
    }else {
        Acid.System.printError("Attempting to create Rectangle with no Height property.");
    }
}

Acid.Rectangle.prototype = Object.create(Acid.Shape.prototype);
Acid.Rectangle.prototype.constructor = Acid.Rectangle;

Acid.Rectangle.prototype.checkPoint = function(x_, y_) {
    if(x_ >= this.getX() && x_ <= this.getX() + this.width && y_ >= this.getY() && y_ <= this.getY() + this.height) {
        return true;
    }
    return false;
}