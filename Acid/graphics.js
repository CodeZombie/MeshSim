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

		drawCircle : function(x_, y_, radius_, style_) {
			canvasContext.beginPath();
			Acid.Graphics.setStyle(style_);
			canvasContext.arc(x_*scale,y_*scale,radius_*scale,0,2*Math.PI);
			canvasContext.stroke();
			return;
		},

		drawFilledCircle: function(x_, y_, radius_, style_) {
			canvasContext.beginPath();
			Acid.Graphics.setStyle(style_);
			canvasContext.arc(x_*scale,y_*scale,radius_*scale,0,2*Math.PI);
			canvasContext.fill();
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
		}
	}
})();