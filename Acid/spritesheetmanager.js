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