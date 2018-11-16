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