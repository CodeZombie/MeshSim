//this is the lastest one

Node = function(x_, y_) {
    Acid.Entity.call(this, x_, y_);

    this.objectType = "node"

    this.SHORT_INTERFRAME_SPACE = 9; //1 being the smallest unit of time, in microseconds. 
    this.MAX_BACKOFF_TIME = 16; //the max amount of time the system will wait as a random backoff.
    this.DCF_INTERFRAME_SPACE = 16; //the amount of time to be waited during the physical carrier sense right before transmission.

    this.radius = 8; //physical radius of the node
    this.broadcast_radius = 64; //the distance this node can broadcast
    this.color = "128, 255, 255"
    this.status = "idle";  //current state of the node                        
    this.substatus = "idle";//substatus of this node.

    this.received_frame_ids = [];          //the IDs of packets that were succesfully receivedu
    this.broadcast_being_received = null;   //holds the current broadcast that is being received. null when not receiving anything.
    this.frames_to_be_broadcast = [];      //the frames that we want to broadcast
    this.wait_time = 0;

    this.frame_waiting_to_be_acknowledged = null;
    this.ack_timer = 0;
    this.rebroadcast_count = 0;

    this.frame_being_broadcast = null;

    this.setBoundingBox(new Acid.Circle({radius: this.radius}));
}

Node.prototype = Object.create(Acid.Entity.prototype);
Node.prototype.constructor = Node;

Node.prototype.waitingForACK  = function() {
    if(this.frame_waiting_to_be_acknowledged == null) {
        return false;
    }
    return true;
}

Node.prototype.cancelWaitForACK = function() {
    this.frame_waiting_to_be_acknowledged = null;
    this.ack_timer = 0;
    this.rebroadcast_count = 0;
}

Node.prototype.markFrameAsSeen = function(frame_){    
    if(!this.received_frame_ids.includes(frame_.id)) {
        this.received_frame_ids.push(frame_.id);
    }
}

Node.prototype.frameHasBeenReceivedBefore = function(frame_) {
    return this.received_frame_ids.includes(frame_.id);
}

Node.prototype.addFrameToQueue = function(frame_, priority_) {
    frame_.from_node = this.id; //obviously the frame came from this Node.
    //frame_.id = (new Date()).getTime(); //generate a new ID for the frame.
    
    if(frame_.duration == undefined) {
        if(frame_.data == undefined) {
            frame_.duration = 8;
        }else{
            frame_.duration = frame.data.length;
        }
    }

    if(frame_.requires_ack == undefined) {
        frame_.requires_ack = false;
    }

    if(frame_.final_node == undefined){
        frame_.final_node = -1; //-1 means there is no specific destination, aka for everyone.
    }

    if(frame_.color == undefined){
        frame_.color = Math.floor(Math.random()*255).toString() + "," + Math.floor(Math.random()*255).toString() + "," + Math.floor(Math.random()*255).toString();
    }
    if(frame_.root_node == undefined){
        frame_.root_node == this.id; //if the root node is not specified, assume it is this node.
    }

    if(priority_ == "LOW") {
        this.frames_to_be_broadcast.unshift(frame_);
    }else{
        this.frames_to_be_broadcast.push(frame_);
    }
}

Node.prototype.receiveFrame = function(frame_) {
    //only recieve broadcasts if their frames are meant for this node, or global (-1)
    if(frame_.final_node == -1 || frame_.final_node == this.id || frame_.hopping_to == -1 || frame_.hopping_to == this.id) {
        if(frame_.requires_ack) { //if the frame requires an ACK
            //send an ack:
            this.addFrameToQueue({
                type: "ACK",
                id: (new Date()).getTime(),
                acknowledging_id: frame_.id,
                final_node: frame_.hopped_from,
                color: "0, 0, 255"
            }, "HIGH");
        }
    
        if(frame_.type == "ACK" && this.frame_waiting_to_be_acknowledged != null){
            if(this.frame_waiting_to_be_acknowledged.id == frame_.acknowledging_id) {
                console.log("Great, we recieved the ACK")
                this.cancelWaitForACK();
            }
        }
    

        //TO HERE SHOULD BE PUT IN THE FLOODNODE OBJECT.
    }

    this.markFrameAsSeen(frame_);
    this.broadcast_being_received = null;
}

//broadcasts a FRAME
Node.prototype.broadcastFrame = function(frame_) {
    this.frame_being_broadcast = frame_;

    broadcast = new Broadcast(this.x, this.y, frame_, this.broadcast_radius); //create a new broadcast object
    broadcast.setParent(this); //set this node as the broadcast's parent
    this.markFrameAsSeen(frame_); //mark it as seen so we don't recieve this frame after broadcasting it.
    Acid.EntityManager.addEntity(broadcast); //add it to the world.
}

Node.prototype.postFrameBroadcast = function() {
    if(this.frame_being_broadcast.requires_ack) {
        this.frame_waiting_to_be_acknowledged = this.frame_being_broadcast;
        this.ack_timer = 64; //64 us can pass before we will try to tx again.
    }
    this.frame_being_broadcast = null;
}

Node.prototype.onCollision = function(other_){
    if(status != "frame_collision") {
        if(other_.objectType == "broadcast") { //if we receive a broadcast
            if(this.status == "broadcasting" && this.substatus == "transmit_countdown") {
                return; //this system is half-duplex. Nothing can recieve while transmitting.
            }
            if(this.broadcast_being_received != null) { //if there is already a broadcast being received
                if(this.broadcast_being_received.id != other_.id) { //and the broadcast being received is not this one..
                    this.status = "frame_collision";
                    this.substatus = "nav_countdown";
                    this.wait_time = this.DCF_INTERFRAME_SPACE; //set the nav timer to a DIFS.
                    this.broadcast_being_received = null; //remove any received frame. It has been interrupted and is invalid.
                }
            }else{
                this.status = "receiving";
                this.substatus = "nav_countdown";
                this.wait_time = other_.duration;
                this.broadcast_being_received = other_;
            }
        }
    }
}

Node.prototype.update = function() {
    Acid.Entity.prototype.update.call(this);

    if(this.waitingForACK()) {
        this.ack_timer--;
        if(this.ack_timer <= 0) {
            //if it hasn't been three tries already, rebroadcast
            if(this.rebroadcast_count < 3) {
                this.rebroadcast_count++;
                var frame = this.frame_waiting_to_be_acknowledged;
                frame.id = (new Date()).getTime(); //give it a new ID.
                this.addFrameToQueue(frame, "HIGH"); //make it a new high priority one.
                this.frame_waiting_to_be_acknowledged = null; //set this to null so waitingForAck() returns false, so the frame can be broadcast properly.
            }else{
                this.cancelWaitForACK();
            }
        }
    }

    if(this.status == "frame_collision") {
        this.wait_time--;
        if(this.wait_time <= 0 ){
            this.status = "idle";
            this.substatus = "idle";
        }
    }

    //receive broadcasts properly:
    if(this.status == "receiving") {
        if(this.substatus == "nav_countdown") {
            this.wait_time--;
            if(this.wait_time <= 0 && this.broadcast_being_received != null) {
                this.receiveFrame(this.broadcast_being_received.frame);
                this.status = "idle";
                this.substatus = "idle";
            }
        }
    }

    if(!this.waitingForACK()) { //if we're not waiting for an ACK...
        if(this.status == "idle"){
            if(this.frames_to_be_broadcast.length > 0) {
                this.status = "broadcasting";
                this.substatus = "nav_countdown";
            }
        }

        if(this.status == "broadcasting"){ //if we want to broadcast
            switch(this.substatus) {
                case "nav_countdown":
                    this.wait_time--;
                    if(this.wait_time <= 0) {
                        this.substatus = "difs_countdown";
                        if(this.frames_to_be_broadcast.type == "ACK") {
                            this.wait_time = this.SHORT_INTERFRAME_SPACE; //DIFS
                        }else{
                            this.wait_time = this.DCF_INTERFRAME_SPACE; //DIFS
                        }
                    }
                    break;

                case "difs_countdown":
                    this.wait_time--;
                    if(this.wait_time <= 0) {
                        this.substatus = "backoff_countdown";
                        this.wait_time = 1 + Math.floor(Math.random() * this.MAX_BACKOFF_TIME); //wait a non-zero random amount of time
                    }
                    break;

                case "backoff_countdown":
                    this.wait_time--;
                    if(this.wait_time <= 0) {
                        this.substatus = "transmit_countdown";
                        frame = this.frames_to_be_broadcast.pop();
                        this.wait_time = frame.duration;
                        //this.wait_time = frame.data.length;
                        this.broadcastFrame(frame);
                    }
                    break;

                //this is the broadcasting state. This canont be interrupted.
                case "transmit_countdown":
                    this.wait_time--;
                    if(this.wait_time <= 0) {
                        this.postFrameBroadcast()
                        this.status = "idle";
                        this.substatus = "idle";
                    }
            }
        }
    }
}

Node.prototype.draw = function() {
    if (this.hovered == true) {
        Acid.Graphics.drawOnTop();
        Acid.Graphics.drawFilledSquare(this.x, this.y, 128, 128, {fillStyle: "rgba(255, 50, 255, .25)"})
        Acid.Graphics.drawText(this.x+4, this.y+16, "wait_time: " + this.wait_time, {textAlign: "left", fillStyle: "rgba(0,0,0, .25)", font: "16px Arial"});
        Acid.Graphics.drawText(this.x+4, this.y+32, "status: " + this.status, {textAlign: "left", fillStyle: "rgba(0,0,0, .25)", font: "16px Arial"});
        Acid.Graphics.drawText(this.x+4, this.y+48, "substat: " + this.substatus, {textAlign: "left", fillStyle: "rgba(0,0,0, .25)", font: "16px Arial"});
        Acid.Graphics.drawText(this.x+4, this.y+64, "ftbb: " + this.frames_to_be_broadcast.length, {textAlign: "left", fillStyle: "rgba(0,0,0, .25)", font: "16px Arial"});
        Acid.Graphics.drawText(this.x+4, this.y+64+16, "ackt: " + this.ack_timer, {textAlign: "left", fillStyle: "rgba(0,0,0, .25)", font: "16px Arial"});
        Acid.Graphics.drawText(this.x+4, this.y+64+32, "rbx#: " + this.rebroadcast_count, {textAlign: "left", fillStyle: "rgba(0,0,0, .25)", font: "16px Arial"});
        Acid.Graphics.drawText(this.x+4, this.y+64+32+16, "fwtba: " + (this.broadcast_being_received != null), {textAlign: "left", fillStyle: "rgba(0,0,0, .25)", font: "16px Arial"});

        Acid.Graphics.drawOnBottom();
        Acid.Graphics.drawCircle(this.x, this.y, this.broadcast_radius, {lineWidth: 1, strokeStyle: "rgb(" + this.color + ")"})
    }

    if(this.collision_counter > 0) {this.collision_counter-=2;}
    Acid.Graphics.drawCircle(this.x, this.y, this.radius, {lineWidth: 1, strokeStyle: "rgb(" + this.color + ")"});
    Acid.Graphics.drawText(this.x, this.y+4, this.id, {textAlign: "center", fillStyle: "rgb(" + this.color + ")", font: "8px Arial"});
    //Acid.Graphics.drawSquare(this.x, this.y, this.width, this.height, "#F00");
};

Node.prototype.onMouseDown = function() {
    //dest = document.getElementById('destination_id').value.toString();
    dest = -1;
    frame = {
        type: "data",
        data: "hello world",
        //requires_ack: true,
        id: (new Date()).getTime(),
        final_node: dest,
        root_node: this.id,
        color: Math.floor(Math.random()*255).toString() + "," + Math.floor(Math.random()*255).toString() + "," + Math.floor(Math.random()*255).toString()
    }
    console.log(dest);
    this.addFrameToQueue(frame, "LOW");
}

Node.prototype.onMouseMove = function(event_) {
    //console.log(this.received_frame_ids);
}