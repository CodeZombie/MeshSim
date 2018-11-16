//this is the lastest one

Node = function(x_, y_) {
    Acid.Entity.call(this, x_, y_);
    this.objectType = "node"
    this.radius = 8;
    this.broadcast_radius = 64;
    this.width = 0;
    this.color = "128, 255, 255"
    this.height = 0;
    this.status = "idle";  //current state of the node
                                //"broadcasting" : trying to broadcast a packet
                        

    this.substatus = "idle";//substatus of this node.
                                //"nav_timeout"
                                //backoff_timer
                                //carrier_sense



                            //"idle" : doing nothing.
                            //"wait_for_clear_carrier" : waits an increasing amount of time from nav_timer before carriersensing before broadcasting a packet.
                            //"broadcasting_packet" : having just broadcast a packet, it is now waiting the length of that packet before doing anything else. waits for broadcast_timer
                            //"wait_sifs" : waits the length of one SIFS from sifs_timer
                            //"listen_for_ack" : waits for an ACK from all known neighbors, if this packet requires an ACK, using response_timer;
                            //if not all ACKs are received, wait a random amount of time, then go back to "wait for clear carrier" and try to broadcast again, but this time only toward the nodes that didnt reply with an ACK.


    /*
    Listening:
        waits until a broadcast is detected.
        when it is, enter "receiving" mode. A timer will now count down to simulate time passing for receiving this broadcast.
        if a different broadcast is received in receiviing mode, both broadcasts will fail and be added to the failed_broadcasts array.
        if the counter gets to zero without collision, check to see if the packet is meant for us. if it is, do nothing. the transmission is finished.
        if the packet is not, broadcast it out to all our neighbors, except the one that sent it to us by entering broadcast mode.
    */

    
    this.waiting_for_ack_from = -1; //the ID of the node we are waiting for an acknowledgement from.
    this.neighbor_ids = [];                 //contains all neighbor IDs. Found via acks and packet receives.
    this.received_broadcast_ids = [];       //the IDs of broadcasts this has received/broadcast

    this.received_frame_ids = [];          //the IDs of packets that were succesfully receivedu
    this.failed_frame_ids = [];         //the IDs of broadcasts that collided with other broadcasts.
    this.broadcast_being_received = null;   //holds the current broadcast that is being received. null when not receiving anything.
    this.frames_to_be_broadcast = [];      //the frames that we want to broadcast

    this.nav_timer = 0;         //the amount of time this frame will take up on the medium
    this.ifs_timer = 0;         //the amount of time to wait between transmissions
    this.backoff_timer = 0;     //the random amount of time to wait between transmissions

    this.wait_time = 0;

    this.setBoundingBox(new Acid.Circle({radius: this.radius}));
}

Node.prototype = Object.create(Acid.Entity.prototype);
Node.prototype.constructor = Node;

Node.prototype.detectNeighbor = function(neighbor_id_) {
    if (!this.neighbor_ids.includes(neighbor_id_)) {
        this.neighbor_ids.push(neighbor_id_);
    }
}

Node.prototype.receiveBroadcast = function(broadcast_) {

    if(!this.received_frame_ids.includes(broadcast_.frame.id)) { //if we have never seen this frame before
        this.frames_to_be_broadcast.unshift(broadcast_.frame); //rebroadcast it
    }

    this.received_frame_ids.push(broadcast_.frame.id); //mark this frame as "Seen"
    
}

//broadcasts a packet.
Node.prototype.broadcastFrame = function(frame_) {
    this.color = frame_.color;
    //send a broadcast to neighbors
    frame_.from = this.id;

    broadcast = new Broadcast(this.x, this.y, frame_, this.broadcast_radius);     //create a new broadcast object
    broadcast.setParent(this); //set this node as the broadcast's parent
    this.received_frame_ids.push(frame_.id); //take note of this frame, so we don't accidentally receive it.
    Acid.EntityManager.addEntity(broadcast); //add it to the world.
    this.received_broadcast_ids.push(broadcast.id); //do not receive your own broadcast..
}

Node.prototype.onCollision = function(other_){
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

Node.prototype.update = function() {
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
                    console.log("kill me")
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

Node.prototype.draw = function() {
    if(this.collision_counter > 0) {this.collision_counter-=2;}
    Acid.Graphics.drawCircle(this.x, this.y, this.radius, {lineWidth: 1, strokeStyle: "rgb(" + this.color + ")"});
    Acid.Graphics.drawText(this.x, this.y+4, this.id, {textAlign: "center", fillStyle: "rgb(" + this.color + ")", font: "8px Arial"});
    //Acid.Graphics.drawSquare(this.x, this.y, this.width, this.height, "#F00");
};

Node.prototype.onMouseDown = function() {
    frame = {
        type: "plaintext",
        data: "Lo",
        id: (new Date()).getTime(),
        destination_node: 13,
        root_node: this.id,
        color: Math.floor(Math.random()*255).toString() + "," + Math.floor(Math.random()*255).toString() + "," + Math.floor(Math.random()*255).toString()
    }

    this.frames_to_be_broadcast.unshift(frame);
}