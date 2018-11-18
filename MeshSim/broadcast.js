Broadcast = function(x_, y_, frame_, radius_) {
    Acid.Entity.call(this, x_, y_);
    this.objectType = "broadcast"
    this.frame = frame_;
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
    this.duration = this.frame.data.length;
    this.duration_timer = this.duration;
    this.parent = null;
    this.setBoundingBox(new Acid.Circle({radius: this.radius}));
    //this.setBoundingBox(new Acid.Rectangle({width: this.width, height: this.height}));
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

Broadcast.prototype.draw = function() {
    Acid.Graphics.drawFilledCircle(this.x, this.y, this.radius, {lineWidth: 2, fillStyle: "rgba(" + this.frame.color + ", " + (this.duration_timer / this.duration) + ")"});
    Acid.Graphics.drawText(this.x, this.y+ this.radius, this.id, {font: "8px Arial", fillStyle: "#0f0"})
};
