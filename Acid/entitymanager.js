var Acid = Acid||{};

Acid.EntityManager = (function() {
	var entities = [];
	var IDIterator = 0;
	
	return{
		addEntity : function(entity_) {
			entities.push(entity_);
			entity_.setId(IDIterator);
			IDIterator++;
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