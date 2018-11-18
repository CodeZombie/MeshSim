//this is the lastest one

BatmanNode = function(x_, y_) {
    Acid.Entity.call(this, x_, y_);
    this.objectType = "node"
    this.radius = 8; //physical radius of the node
    this.broadcast_radius = 64; //the distance this node can broadcast
    this.color = "128, 255, 255"
    this.status = "idle";  //current state of the node                        
    this.substatus = "idle";//substatus of this node.

    this.received_broadcast_ids = [];       //the IDs of broadcasts this has received/broadcast
    this.received_frame_ids = [];          //the IDs of packets that were succesfully receivedu
    this.failed_frame_ids = [];         //the IDs of broadcasts that collided with other broadcasts.
    this.broadcast_being_received = null;   //holds the current broadcast that is being received. null when not receiving anything.
    this.frames_to_be_broadcast = [];      //the frames that we want to broadcast
    this.wait_time = 0;

    this.setBoundingBox(new Acid.Circle({radius: this.radius}));
}

BatmanNode.prototype = Object.create(Acid.Entity.prototype);
BatmanNode.prototype.constructor = BatmanNode;

BatmanNode.prototype.receiveBroadcast = function(broadcast_) {
    if(!this.received_frame_ids.includes(broadcast_.frame.id)) { //if we have never seen this frame before
        this.frames_to_be_broadcast.unshift(broadcast_.frame); //rebroadcast it
    }

    this.received_frame_ids.push(broadcast_.frame.id); //mark this frame as "Seen"
    
}

//broadcasts a packet.
BatmanNode.prototype.broadcastFrame = function(frame_) {
    this.color = frame_.color;
    //send a broadcast to neighbors
    frame_.from = this.id;

    broadcast = new Broadcast(this.x, this.y, frame_, this.broadcast_radius);     //create a new broadcast object
    broadcast.setParent(this); //set this node as the broadcast's parent
    this.received_frame_ids.push(frame_.id); //take note of this frame, so we don't accidentally receive it.
    Acid.EntityManager.addEntity(broadcast); //add it to the world.
    this.received_broadcast_ids.push(broadcast.id); //do not receive your own broadcast..
}

BatmanNode.prototype.onCollision = function(other_){
    if(other_.objectType == "broadcast") { //if it receives a broadcast
        if(this.broadcast_being_received != null) { //if there is already a broadcast being received
            if(this.broadcast_being_received.id != other_.id) { //and the broadcast being received is not this one..
                //collision!
                this.substatus = "nav_countdown";
                this.wait_time = other_.duration; //set the nav timer to the last broadcast
                this.received_broadcast_ids.push(this.broadcast_being_received.id); //and fail the two broacasts
                this.received_broadcast_ids.push(other_.id);
                this.broadcast_being_received = null;
            }
        }

        if(!this.received_broadcast_ids.includes(other_.id)) { //this is a new broadcast
            //add new frame the the receive queue thing
            this.substatus = "nav_countdown";
            this.wait_time = other_.duration;
            this.broadcast_being_received = other_;
            this.received_broadcast_ids.push(other_.id);
        }
    }
}

BatmanNode.prototype.update = function() {
    //receive broadcasts properly:
    if(this.substatus == "nav_countdown") {
        this.wait_time--;
        if(this.wait_time <= 0 && this.broadcast_being_received != null) {
            this.receiveBroadcast(this.broadcast_being_received);
        }
    }

    if(this.status == "idle"){
        if(this.frames_to_be_broadcast.length > 0) {
            this.status = "broadcasting";
            this.substatus = "nav_countdown";
        }
    }

    if(this.status == "broadcasting"){ //if we want to broadcast
        switch(this.substatus) {
            case "nav_countdown":
                if(this.wait_time <= 0) {
                    this.substatus = "difs_countdown";
                    this.wait_time = 8; //difs time = 8
                }
                break;

            case "difs_countdown":
                this.wait_time--;
                if(this.wait_time <= 0) {
                    this.substatus = "backoff_countdown";
                    this.wait_time = Math.floor(Math.random() *16); //wait a random amount of time
                }
                break;

            case "backoff_countdown":
                this.wait_time--;
                if(this.wait_time <= 0) {
                    this.status = "idle";
                    this.broadcastFrame(this.frames_to_be_broadcast.pop());
                }
                break;
        }
    }
}

BatmanNode.prototype.draw = function() {
    if(this.collision_counter > 0) {this.collision_counter-=2;}
    Acid.Graphics.drawCircle(this.x, this.y, this.radius, {lineWidth: 1, strokeStyle: "rgb(" + this.color + ")"});
    Acid.Graphics.drawText(this.x, this.y+4, this.id, {textAlign: "center", fillStyle: "rgb(" + this.color + ")", font: "8px Arial"});
    //Acid.Graphics.drawSquare(this.x, this.y, this.width, this.height, "#F00");
};

BatmanNode.prototype.onMouseDown = function() {
    frame = {
        type: "plaintext",
        data: "Hello this is some text.",
        id: (new Date()).getTime(),
        destination_node: 13,
        root_node: this.id,
        color: Math.floor(Math.random()*255).toString() + "," + Math.floor(Math.random()*255).toString() + "," + Math.floor(Math.random()*255).toString()
    }

    this.frames_to_be_broadcast.unshift(frame);
}