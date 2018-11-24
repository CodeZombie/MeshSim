Broadcast = function(x_, y_, frame_, radius_) {
    Acid.Entity.call(this, x_, y_);
    this.objectType = "broadcast"
    this.frame = frame_;
    this.canvas;
    /*
        DATA PACKET
        packet.id: the ID of this packet. This ID doesnt change across the network.
        packet.sent_id: the ID of the node that forwarded this packet.
        packet.root_node: the ID of the node that initially created the packet.
        packet.destination_node: the ID of the node that this packet is intended for.
        packet.data: plaintext content of the packet.
        packet.sent_time: time in unix ms that this was sent.
        
        ACK PACKET
        Packet ID: the ID of the packet this is acknowledging.
        Parent Node: The node this acknowledgement is coming from.
    */

    this.radius = radius_;
    this.path = [];
    this.broadcast_id = -1; //the id of this broadcast message, not the entity id.
    this.duration = Math.floor(this.frame.data.length/2);
    this.duration_timer = this.duration;
    this.parent = null;
    this.setBoundingBox(new Acid.Circle({radius: this.radius}));
    //this.setBoundingBox(new Acid.Rectangle({width: this.width, height: this.height}));
    this.prerender();
}

Broadcast.prototype = Object.create(Acid.Entity.prototype);
Broadcast.prototype.constructor = Broadcast;

Broadcast.prototype.setParent = function(entity_) {
    this.parent = entity_;
}

Broadcast.prototype.update = function() {
    if(this.duration_timer <= 0) {
        Acid.EntityManager.deleteEntity(this.id);
    }
    this.duration_timer--;
}

Broadcast.prototype.prerender = function() {
    this.canvas = document.createElement('canvas');
    this.canvas.width= this.radius * 2;
    this.canvas.height = this.radius * 2;
    var canvasContext = this.canvas.getContext("2d");

    Acid.Graphics.drawFilledCircleCtx(canvasContext, this.radius, this.radius, this.radius, {lineWidth: 2, fillStyle: "rgba(" + this.frame.color + ", " + (this.duration_timer / this.duration) + ")"});
}

Broadcast.prototype.draw = function() {
    Acid.Graphics.drawOnTop();
    Acid.Graphics.drawImage(this.canvas, this.x - this.radius, this.y - this.radius);
    Acid.Graphics.drawOnBottom();

};
