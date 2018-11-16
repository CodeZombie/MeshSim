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
			redraw();
			requestAnimationFrame(Acid.System.update);
		},
		redraw : function() {
			redrawFunction();
		}
	}
})();