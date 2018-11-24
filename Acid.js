
/*######### boundingbox.js #########*/

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

/*######### entity.js #########*/

var Acid = Acid||{};

Acid.Entity = function(x_, y_) {
	this.objectType = "entity";
	this.id = -1; //if this stays -1, either entityManager has fucked up, or the entity was not attached to the entitymanager
	this.x = x_;
	this.y = y_;
	this.clickable = true;
	this.hoverable = true;
	this.spriteSheet;
	this.spriteIndex;
	this.sprite;
	this.boundingBox;
	this.hovered = false;
};

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


/*######### entitymanager.js #########*/

var Acid = Acid||{};

Acid.EntityManager = (function() {
	var entities = [];
	var IDIterator = 0;
	
	return{
		addEntity : function(entity_) {
			entities.push(entity_);
			entity_.setId(IDIterator);
			IDIterator++;
			entity_.onAttachToEntityManager();
			return IDIterator-1;
		},
		
		getEntityIndexFromId : function(id_) {
			for(var i = 0 ; i < entities.length; i++) {
				if(entities[i].id === id_) {
					return i;
				}
			}
			return;			
		},
		
		getEntity : function(id_) {
			for(var i = 0 ; i < entities.length; i++) {
				if(entities[i].id === id_) {
					return entities[i];
				}
			}
			return;
		},
		
		deleteEntity : function(id_) {
			var index = this.getEntityIndexFromId(id_);
			if(index == -1) {
				return 0;
			}
			entities.splice(index, 1);
			return 1;
		},
		
		draw : function() {
			for(var i = 0; i < entities.length; i++) {
				if(entities[i] !== undefined) {
					entities[i].draw();
				}
			}
		}, 

		update : function() {
			for(var i = 0; i < entities.length; i++) {
				entities[i].update();
			}
			Acid.EntityManager.checkCollisions();
		},

		checkCollisions : function() {
			for(var a = 0; a < entities.length; a++) {
				for(var b = a+1; b < entities.length; b++) {
					if(entities[a].getBoundingBox().checkCircle(entities[b].getBoundingBox())) {
						entities[a].onCollision(entities[b]);
						entities[b].onCollision(entities[a]);
					}
				}
			}
		},

		onMouseEvent : function(event_, eventType_) {
			for(var i = 0; i < entities.length; i++) {
				if(eventType_ == Acid.MouseEventTypes.mousedown) {
					if(entities[i].isClickable()) {
						if(entities[i].getBoundingBox().checkPoint(Acid.Mouse.getX(), Acid.Mouse.getY())){
							entities[i].onMouseDown(event_);
						}
					}
				}else if(eventType_ == Acid.MouseEventTypes.mouseup) {
					if(entities[i].isClickable()) {
						if(entities[i].getBoundingBox().checkPoint(Acid.Mouse.getX(), Acid.Mouse.getY())){
							entities[i].onMouseUp(event_);
						}
					}
				}else if(eventType_ == Acid.MouseEventTypes.mousemove) {
					if(entities[i].isHoverable()) {
						if(entities[i].getBoundingBox().checkPoint(Acid.Mouse.getX(), Acid.Mouse.getY())){
							entities[i].onMouseMove(event_);
						}
					}
				}
				
			}
		}
	}
})();

/*######### graphics.js #########*/

var Acid = Acid||{};

Acid.Graphics = (function() {
	var canvas;
	var canvasContext;
	var backgroundColor = "#0f0";
	var scale = 1;
	
	return {
		attachCanvas : function(canvas_) {
			if(canvas_ === null || canvas_.tagName.toLowerCase() !== "canvas") {
				Acid.System.fatalError("Attempted to attach invalid canvas");
				return;
			}
			canvas = canvas_;
			
			canvasContext = canvas.getContext("2d");
			Acid.Mouse.initialize(canvas); //attach the canvas to to the mouse
		},
		
		getCanvas : function() {
			return canvas;
		},
		
		getCanvasContext : function() {
			return canvasContext;
		},
		
		getScale : function() {
			return scale;
		},
		
		setScale : function(s_) {
			scale = s_;
		},
		
		disableInterpolation : function() {
			canvasContext.imageSmoothingEnabled = false;
			/////////////////////////
			// Does not work on IE //
			/////////////////////////
			canvasContext.mozImageSmoothingEnabled = false;			
		},
		
		clear : function() {
			canvasContext.clearRect(0, 0, canvas.width, canvas.height);
		},

		drawOnTop : function() {
			canvasContext.globalCompositeOperation = 'source-over';
		},

		drawOnBottom : function() {
			canvasContext.globalCompositeOperation = 'destination-over';
		},

		setStyle : function(style_){
			if(style_.lineWidth != null) {
				canvasContext.lineWidth = style_.lineWidth;
			}else{
				canvasContext.lineWidth = 1;
			}

			if(style_.textAlign != null) {
				canvasContext.textAlign = style_.textAlign;
			}else{
				canvasContext.textAlign = "start";
			}

			if(style_.font != null) {
				canvasContext.font = style_.font;
			}else{
				canvasContext.font = "12px Arial";
			}
		
			if(style_.fillStyle != null) {
				canvasContext.fillStyle = style_.fillStyle;
			}else {
				canvasContext.fillStyle = "#0F0";
			}
		
			if(style_.strokeStyle != null) {
				canvasContext.strokeStyle = style_.strokeStyle;
			}else {
				canvasContext.strokeStyle = "#0F0";
			}
		
			if(style_.lineCap != null) {
				canvasContext.lineCap = style_.lineCap;
			}else {
				canvasContext.lineCap = "butt"; //or "round" or "square"
			}
			
			if(style_.lineDash != null) {
				canvasContext.lineDash = style_.lineDash;
			}else {
				canvasContext.lineDash = []; //empty array = no dashing. For dashes, use [n,m] where n = width of dash, and m is distance beteen dashes
			}		
		},

		setStyleCtx : function(ctx_, style_){
			if(style_.lineWidth != null) {
				ctx_.lineWidth = style_.lineWidth;
			}else{
				ctx_.lineWidth = 1;
			}

			if(style_.textAlign != null) {
				ctx_.textAlign = style_.textAlign;
			}else{
				ctx_.textAlign = "start";
			}

			if(style_.font != null) {
				ctx_.font = style_.font;
			}else{
				ctx_.font = "12px Arial";
			}
		
			if(style_.fillStyle != null) {
				ctx_.fillStyle = style_.fillStyle;
			}else {
				ctx_.fillStyle = "#0F0";
			}
		
			if(style_.strokeStyle != null) {
				ctx_.strokeStyle = style_.strokeStyle;
			}else {
				ctx_.strokeStyle = "#0F0";
			}
		
			if(style_.lineCap != null) {
				ctx_.lineCap = style_.lineCap;
			}else {
				ctx_.lineCap = "butt"; //or "round" or "square"
			}
			
			if(style_.lineDash != null) {
				ctx_.lineDash = style_.lineDash;
			}else {
				ctx_.lineDash = []; //empty array = no dashing. For dashes, use [n,m] where n = width of dash, and m is distance beteen dashes
			}		
		},

		drawCircle : function(x_, y_, radius_, style_) {
			canvasContext.beginPath();
			Acid.Graphics.setStyle(style_);
			canvasContext.arc(x_*scale,y_*scale,radius_*scale,0,2*Math.PI);
			canvasContext.stroke();
			return;
		},

		drawCircleCtx : function(ctx_, x_, y_, radius_, style_) {
			ctx_.beginPath();
			Acid.Graphics.setStyleCtx(ctx_, style_);
			ctx_.arc(x_*scale,y_*scale,radius_*scale,0,2*Math.PI);
			ctx_.stroke();
			return;
		},

		drawFilledCircle: function(x_, y_, radius_, style_) {
			canvasContext.beginPath();
			Acid.Graphics.setStyle(style_);
			canvasContext.arc(x_*scale,y_*scale,radius_*scale,0,2*Math.PI);
			canvasContext.fill();
			return;
		},

		drawFilledCircleCtx: function(ctx_, x_, y_, radius_, style_) {
			ctx_.beginPath();
			Acid.Graphics.setStyleCtx(ctx_, style_);
			ctx_.arc(x_*scale,y_*scale,radius_*scale,0,2*Math.PI);
			ctx_.fill();
			return;
		},
		
		drawSquare : function(x_, y_, w_, h_, color_) {
			if(w_ <= 0 || h_ <= 0) {
				Acid.System.printError("Attempted to draw square with invalid dimensions");
				return;
			}
			canvasContext.beginPath();
			canvasContext.strokeStyle = color_;
			canvasContext.rect(x_*scale, y_*scale, w_*scale, h_*scale);
			canvasContext.stroke();
		},
		
		drawFilledSquare : function(x_, y_, w_, h_, style_) {
			Acid.Graphics.setStyle(style_);
			canvasContext.fillRect(x_*scale, y_*scale, w_*scale, h_*scale);
		},
		drawText : function(x_, y_, text_, style_) {
			Acid.Graphics.setStyle(style_);
			canvasContext.fillText(text_, x_, y_);
		},

		drawTextCtx : function(ctx_, x_, y_, text_, style_) {
			Acid.Graphics.setStyleCtx(ctx_, style_);
			ctx_.fillText(text_, x_, y_);
		},
		
		drawImage(image_, x_, y_){
			canvasContext.drawImage(image_, x_, y_);
		}
	}
})();

/*######### mapmanager.js #########*/

var Acid = Acid||{};

Acid.MapManager = (function() {
	var width = 0;
	var height = 0;
	var tiles = [];
	var spriteSheet = undefined;
	return {
		getWidth : function() {
			return width;
		},
		
		getHeight : function() {
			return height;
		},
		
		getTiles : function() {
			return tiles;
		},

		setSpriteSheet : function(s_) {
			spriteSheet = s_;
		},
		
		populate : function(json_) {
			var jsonObject = JSON.parse(json_);
			width = jsonObject.mapwidth;
			height = jsonObject.mapheight;
			tiles = jsonObject.tiles;
		},
		
		draw : function() {
			if(spriteSheet === undefined) {
				console.log("Cannot draw map: no spriteSheet defined");
				Acid.Graphics.drawFilledSquare(0, 0, width*32, height*32, "#f0f");	//32 arbitrarily chosen
				return -1;
			}
			
			for(var y = 0; y < height; y++) {
				for(var x = 0; x < width; x++) {
					spriteSheet.drawSprite(tiles[(y*width) + x], spriteSheet.spriteWidth*x, spriteSheet.spriteHeight*y);
				}
			}	
		}
	}
})();

/*######### mouse.js #########*/

var Acid = Acid||{};

Acid.MouseEventTypes = Object.freeze({
	mousedown : 1,
	mouseup : 2,
	mousedownthenup : 3,
	mousemove : 4
});

Acid.Mouse = (function() {
	var mouse_x;
	var mouse_y;
	
	return {
		initialize : function(canvas_) {
			canvas_.addEventListener("mousemove", function(event) {
				Acid.Mouse.updateMouseCoordinates(event);
				Acid.EntityManager.onMouseEvent(event, Acid.MouseEventTypes.mousemove);
			});
			
			canvas_.addEventListener("mousedown", function(event) {
				Acid.Mouse.updateMouseCoordinates(event);
				Acid.EntityManager.onMouseEvent(event, Acid.MouseEventTypes.mousedown);
			});
			
			canvas_.addEventListener("mouseup", function(event) {
				Acid.Mouse.updateMouseCoordinates(event);
				Acid.EntityManager.onMouseEvent(event, Acid.MouseEventTypes.mouseup);
			});
		},

		updateMouseCoordinates : function(mouseEvent_) {
			var canvas_rectangle = Acid.Graphics.getCanvas().getBoundingClientRect();
			//convert mouse screen position into canvas position:
			mouse_x = Math.round(Math.round(((mouseEvent_.clientX - canvas_rectangle.left)/(canvas_rectangle.right - canvas_rectangle.left)) * Acid.Graphics.getCanvas().width) / Acid.Graphics.getScale());
			mouse_y = Math.round(Math.round(((mouseEvent_.clientY - canvas_rectangle.top)/(canvas_rectangle.bottom - canvas_rectangle.top)) * Acid.Graphics.getCanvas().height) / Acid.Graphics.getScale());

		},

		getX : function() {
			return mouse_x;
		},
		
		getY : function() {
			return mouse_y;
		}
	}
})();

/*######### resourcemanager.js #########*/

var Acid = Acid||{};

Acid.ResourceManager = (function() {
	var images = [];
	var IDIterator = 0;
	
	return {
		loadImage : function(path_, callback_) {
			Acid.System.increaseNumberOfNeededResources();
			var reservedID = IDIterator;//this way, elements are always placed in the array in the exact order that loadImage() is called.
			IDIterator++;
			var img = new Image();
			img.onerror = function(){
				Acid.System.printError("Failed to load image: " + path_);
				callback_(undefined);
			};
			img.onload = function() {
				Acid.System.increaseNumberOfLoadedResources();
				images[reservedID] = img;
				callback_(reservedID);
			}
			img.src = path_;
		},
		
		getImage : function(id_) {
			if(images[id_] === undefined) {
				Acid.System.printError("Attempted to fetch image with unknown id: " + id_);
			}
			return images[id_];
		}
	};
})();

/*######### spritesheet.js #########*/

var Acid = Acid||{};

Acid.SpriteSheet = function(id_, resource_, spriteWidth_, spriteHeight_) {
	this.objectType = "spritesheet";
	this.resource = resource_; //reference to actual resource
	this.spriteWidth = spriteWidth_;
	this.spriteHeight = spriteHeight_;
	this.spritePositions = []; //idk how i feel about the name of this variable, but whatever.
	this.id = id_;
	
	if(this.resource === undefined) {
		console.log("Attempted to create SpriteSheet with undefined resource!");
	}
	if(this.resource.width === undefined) {
		console.log("Attempted to create SpriteSheet with non-image resource!");
	}
	
	for(var y = 0; y < this.resource.height / this.spriteHeight; y++){
		for(var x = 0; x < this.resource.width / this.spriteWidth; x++){
			this.spritePositions.push({x : (x * this.spriteWidth), y : (y * this.spriteHeight)});
		}
	}	
};

Acid.SpriteSheet.prototype.getBoundingBox = function() {
	
}

Acid.SpriteSheet.prototype.drawSprite = function(index_, x_, y_) {
	var canvasContext = Acid.Graphics.getCanvasContext();
	var scale = Acid.Graphics.getScale();
	
	if(this.resource === undefined) {
		//replace this with the drawSquare func
		canvasContext.beginPath();
		canvasContext.fillStyle = "#f0f";
		canvasContext.fillRect(Math.round(x_*scale),Math.round(y_*scale),Math.round(spriteWidth*scale),Math.round(spriteHeight*scale));
		canvasContext.stroke();
		console.log("Failed to draw sprite! (spriteSheet : " + spriteSheetID_ + ", spriteIndex : " + spriteIndex_ + ")");
		return -1;
	}
	//draw sprite...
	if(this.spritePositions[index_] === undefined) {
		console.log("Could not find sprite index");
		return -1;
	}
	canvasContext.drawImage(this.resource, this.spritePositions[index_].x, this.spritePositions[index_].y, this.spriteWidth, this.spriteHeight, Math.round(x_*scale), Math.round(y_*scale), Math.round(this.spriteWidth*scale) ,Math.round(this.spriteHeight*scale));		
};

/*######### spritesheetmanager.js #########*/

var Acid = Acid||{};

Acid.SpriteSheetManager = (function() {
	var spriteSheets = [];
	var IDIterator = 0;
	
	return {
		createSpriteSheet : function(resource_, spriteWidth_, spriteHeight_) {
			//var id = spriteSheets.length;
			
			//check if resource_ is valid
			if(resource_ === undefined) {
				console.log("Attempted to create SpriteSheet with undefined resource!");
				return -1;
			}
			if(resource_.width === undefined) {
				console.log("Attempted to create SpriteSheet with non-image resource!");
				return -1;
			}			
					
			spriteSheets.push(new Acid.SpriteSheet(IDIterator, resource_, spriteWidth_, spriteHeight_));
			IDIterator++;
			return IDIterator-1;
		},
		getSpriteSheet : function(id_) {
			if(spriteSheets[id_] == undefined) {
				console.log("Could not find spriteSheet (" + id_ + ")");
			}
			return spriteSheets[id_];
		}
	}
})();

/*######### system.js #########*/

var Acid = Acid||{};

Acid.System = (function() {
	var initializeFunction;
	var redrawFunction;
	
	var resourcesNeeded = 0;
	var resourcesLoaded = 0;
	
	return {
		start : function(loadResourceFunc_, initializeFunc_, redrawFunc_) {
			initializeFunction = initializeFunc_;
			redrawFunction = redrawFunc_;
			
			loadResourceFunc_();
			this.checkResourceLoop();
		},
		
		checkResourceLoop : function() {
			if(resourcesLoaded === resourcesNeeded) {
				initializeFunction();
				Acid.System.update();
				Acid.System.redraw();
				//redraw();
				
			}else {
				requestAnimationFrame(Acid.System.checkResourceLoop);
			}
			//////////////////////////////////////////////////
			//// perhaps a timeout in here would be nice /////
			//////////////////////////////////////////////////
		},
		 
		printError : function(text_) {
			console.log("ERROR: " + text_);
		},
		
		printMessage : function(text_) {
			console.log("MESSAGE: " + text_);
		},
		
		fatalError : function(text_) {
			alert("Fatal Error: " + text_);
			running = false;
		},
		
		increaseNumberOfNeededResources : function() {
			resourcesNeeded++;
		},
		
		increaseNumberOfLoadedResources : function() {
			resourcesLoaded++;
		},
		update : function() {
			Acid.EntityManager.update();
			setTimeout(Acid.System.update, 0);
		},

		redraw : function() {
			redrawFunction();
			//setTimeout(Acid.System.redraw, Math.floor(Math.random() * 9999));
			requestAnimationFrame(Acid.System.redraw);
		}
	}
})();

/*######### window.js #########*/

var Acid = Acid||{};

Acid.Window = function(id_, x_, y_, width_, height_, spriteSheet_) {
	this.objectType = "window";
	this.id = id_;
	this.x = x_;
	this.y = y_;
	this.width = width_;
	this.height = height_;
	this.spriteSheet = spriteSheet_;
	this.mouseEvents = [];	
}

Acid.Window.prototype.draw = function() {
	for(var yi = 0; yi < (((this.y + this.height) - this.y) - (this.spriteSheet.spriteHeight * 2)) / this.spriteSheet.spriteHeight; yi++) {
		for(var xi = 0; xi < (((this.x + this.width) - this.x) - (this.spriteSheet.spriteWidth * 2)) / this.spriteSheet.spriteHeight; xi++) {
			this.spriteSheet.drawSprite(4, this.x + this.spriteSheet.spriteWidth + (xi * this.spriteSheet.spriteWidth), this.y + this.spriteSheet.spriteHeight + (yi * this.spriteSheet.spriteHeight));
		}
	}
	//draw top and bottom
	for(var i=0; i < (((this.x + this.width) - this.x) - (this.spriteSheet.spriteWidth * 2)) / this.spriteSheet.spriteHeight; i++) {
		this.spriteSheet.drawSprite(1, this.x + this.spriteSheet.spriteWidth + (i * this.spriteSheet.spriteWidth), this.y);
		this.spriteSheet.drawSprite(7, this.x + this.spriteSheet.spriteWidth + (i * this.spriteSheet.spriteWidth), this.y + this.height - this.spriteSheet.spriteHeight);
	}
	
	//draw left and right columns
	for(var i = 0; i < (((this.y + this.height) - this.y) - (this.spriteSheet.spriteHeight * 2)) / this.spriteSheet.spriteHeight; i++) {
		this.spriteSheet.drawSprite(3, this.x, this.y  + this.spriteSheet.spriteHeight + (i * this.spriteSheet.spriteHeight));
		this.spriteSheet.drawSprite(5, this.x + this.width - this.spriteSheet.spriteWidth, this.y + this.spriteSheet.spriteHeight + (i * this.spriteSheet.spriteHeight));
	}
	//draw corners
	this.spriteSheet.drawSprite(0, this.x, this.y);
	this.spriteSheet.drawSprite(2, this.x + this.width - this.spriteSheet.spriteWidth, this.y);
	this.spriteSheet.drawSprite(6, this.x, this.y + this.height - this.spriteSheet.spriteHeight);
	this.spriteSheet.drawSprite(8, this.x + this.width - this.spriteSheet.spriteWidth, this.y + this.height - this.spriteSheet.spriteHeight);

	//now draw interfaces within the window				
};

/*######### windowmanager.js #########*/

var Acid = Acid||{};

Acid.WindowManager = (function() {
	var windows = [];
	var IDIterator = 0;
	
	return {	
		createWindow : function(x_, y_, width_, height_, spriteSheet_) {
			if(spriteSheet_ === undefined || spriteSheet_.objectType !== "spritesheet") {
				Acid.System.printError("Attempting to create window with invalid spritesheet");
				return;
			}
			if(width_ <= 0 || height_ <= 0) {
				Acid.System.printError("Attempting to create window with invalid dimensions");
				return;
			}
			windows.push(new Acid.Window(IDIterator, x_, y_, width_, height_, spriteSheet_));
			IDIterator++;
			return IDIterator-1;
		},
		
		draw : function() {
			for(var i = 0; i < windows.length; i++) {
				if(windows[i] !== undefined) {
					windows[i].draw();
				}
			}
		},
		
		getWindow : function(id_) {
			for(var i = 0; i < windows.length; i++) {
				if(windows[i].id === id_) {
					return windows[i];
				}
			}
			return;
		}
	}
})();
