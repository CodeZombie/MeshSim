//this is the lastest one

BatmanNode = function(x_, y_) {
    Acid.Entity.call(this, x_, y_);

    this.objectType = "batmannode"
    this.canvas;
    this.canvasContext;

    this.SHORT_INTERFRAME_SPACE = 9; //1 being the smallest unit of time, in microseconds. 
    this.MAX_BACKOFF_TIME = 16; //the max amount of time the system will wait as a random backoff.
    this.DCF_INTERFRAME_SPACE = 16; //the amount of time to be waited during the physical carrier sense right before transmission.
    this.ACK_WAIT_TIME = 64;

    this.radius = 8; //physical radius of the node
    this.broadcast_radius = 64; //the distance this node can broadcast
    this.color = "128, 255, 255"
    this.status = "idle";  //current state of the node                        
    this.substatus = "idle";//substatus of this node.

    this.frame_waiting_to_be_acknowledged = null; // holds the frame waiting to be ack'd, if one needs to be ack'd.
    this.ack_timer = 0;

    this.received_frame_ids = [];          //the IDs of packets that were succesfully receivedu
    this.broadcast_being_received = null;   //holds the current broadcast that is being received. null when not receiving anything.
    this.frames_to_be_broadcast = [];      //the frames that we want to broadcast
    this.wait_time = 0;                     //the wait timer. 
    this.tx_counter = 0;                    //the amount of time it takes between wanting to tx, to actually txing the frame.

    this.announce_timer = 64 + Math.floor(Math.random() * 32);

    this.setBoundingBox(new Acid.Circle({radius: this.radius}));


    //batman specific stuff:
    this.routing_table = []
    /*
        [
            foreign_node: [(neighbor_node: distance), (neighbor_node, distance)],
            foreign_node..
            node_1: [ [neighbor_a, distance], [neighbor_b, distance], [neighbor_c, distance]],
            node_2: [ [neighbor_a, distance], [neighbor_b, distance], [neighbor_c, distance]]
        ]
    */
   
}

BatmanNode.prototype = Object.create(Acid.Entity.prototype);
BatmanNode.prototype.constructor = BatmanNode;

BatmanNode.prototype.onAttachToEntityManager = function() {
    Acid.Entity.prototype.onAttachToEntityManager.call(this);
    //Called when this entity is attached to the entity manager, and therefore, given an ID.
    this.routing_table[this.id] = [];
    this.routing_table[this.id][this.id] = 0; //obviously there is zero distance between this node and itself.
    if(this.id == 13){
        this.color = "255, 0, 0"
    }
    this.prerender();
}

BatmanNode.prototype.transmitRoutingTable = function(dest_) {
    var distance_table = [];

    for(node in this.routing_table) { //for every node in our routing table:
        shortest_distance = -1;
        for(neighbor_node in this.routing_table[node]) { //for every neighbor_node 
            if(shortest_distance == -1) {
                shortest_distance = this.routing_table[node][neighbor_node] //the distance from neighbor_node to node
            }else{
                if(this.routing_table[node][neighbor_node] < shortest_distance) {
                    shortest_distance = this.routing_table[node][neighbor_node];
                }
            }
        }
        distance_table[node] = shortest_distance;
    }

    this.addFrameToQueue({
        type: "RTR_ACK", //routing table request ack
        requires_ack: true,
        data:  "a",
        root_node: this.id,
        final_node: dest_,
        distance_table: distance_table,
        color: "0,64,0"
    }, "LOW");
}

BatmanNode.prototype.receiveBroadcast = function(broadcast_) {
    if(broadcast_.frame.final_node == this.id || broadcast_.frame.hopping_to == this.id || broadcast_.frame.final_node == -1 || broadcast_.frame.hopping_to == -1) {
        if(!this.received_frame_ids.includes(broadcast_.frame.id)) { //if we have never seen this frame before
            if(broadcast_.frame.type == "ROUTING_TABLE_REQUEST") {
                //send an ACK with my distance_table info.
                //Keep sending said frame until we recieve a final ACK back. Three way handshake.
                //time out after 3 failed attempts.
                this.transmitRoutingTable(broadcast_.frame.root_node);
            }else if(broadcast_.frame.type == "ACK"){
                if(broadcast_.frame.response_to_frame == this.last_frame_broadcast.id) {
                    this.waiting_for_ack = false;
                }
            }else if(broadcast_.frame.type == "data") {
                if(broadcast_.frame.final_node == this.id){
                    //wow it made it! Congrats.
                    Researcher.onTravelSuccess();
                    console.log("Travel success. Packet recieved by destination node.");
                }else if(broadcast_.frame.hopping_to == this.id){//if this is the node this was hopping_to:
                    var next_hop = this.getNextHop(broadcast_.frame.final_node); //find the NEXT hop
                    if(next_hop == -1){ 
                        console.log("Cannot hop from " + this.id + " to " + next_hop + ". No path found.");
                    }else{
                        //send this new packet
                        this.addFrameToQueue({
                            type: "data",
                            data:  broadcast_.frame.data,
                            final_node: broadcast_.frame.final_node,
                            root_node: broadcast_.frame.root_node,
                            hopped_from: this.id,
                            hopping_to: next_hop,
                            color: broadcast_.frame.color
                        }, "LOW");
                    }
                }
            }else if(broadcast_.frame.type == "ACK"){
                //if(broadcast_.frame.)
            }

            //this.frames_to_be_broadcast.unshift(broadcast_.frame); //rebroadcast it
            this.received_frame_ids.push(broadcast_.frame.id); //mark this frame as "Seen"
            Researcher.addHop();
        }else{
            Researcher.addRedundantHop();
        }
    }

    this.broadcast_being_received = null;
}

//broadcasts a packet.
BatmanNode.prototype.broadcastFrame = function(frame_) {
    if(frame_.requires_ack) {
        this.last_frame_broadcast = frame_; 
        this.last_frame_broadcast.id =  (new Date()).getTime();
        this.waiting_for_ack = true;
        this.ack_timer = this.ACK_WAIT_TIME;
        //we change the frame ID so it doesn't get rejected by the hopping_to node if it needs to be tx again.
    }
    this.color = frame_.color;
    frame_.from = this.id;

    broadcast = new Broadcast(this.x, this.y, frame_, this.broadcast_radius);     //create a new broadcast object
    broadcast.setParent(this); //set this node as the broadcast's parent

    //note this frame, if we havent already, so we don't accidentally rebroadcast. This avoids LOOPS
    if(!this.received_frame_ids.includes(frame_.id)) {
        this.received_frame_ids.push(frame_.id);
    }

    Acid.EntityManager.addEntity(broadcast); //add it to the world.

    Researcher.addBroadcastTime(this.tx_counter); //tell the researcher that the transmit was succesful and how long it took.
    this.tx_counter = 0;
}

BatmanNode.prototype.onCollision = function(other_){
    if(other_.objectType == "broadcast") { //if it receives a broadcast
        if(this.status == "broadcasting" && this.substatus == "transmit_countdown") {
            return; //this system is half-duplex. Nothing can recieve while transmitting.
        }

        if(this.broadcast_being_received != null) { //if there is already a broadcast being received
            if(this.broadcast_being_received.id != other_.id) { //and the broadcast being received is not this one..
                //collision!
                if(this.status != "collision") {
                    Researcher.onCollision(); //only call this once per collision, thus the if statement.
                }
                this.status = "collision";
                this.substatus = "nav_countdown";
                this.wait_time = other_.duration; //set the nav timer to the last broadcast
                this.broadcast_being_received = null;
            }
        }else{
            this.status = "receiving";
            this.substatus = "nav_countdown";
            this.wait_time = other_.duration;
            this.broadcast_being_received = other_;
        }
    }
}

BatmanNode.prototype.update = function() {
    Acid.Entity.prototype.update.call(this);

    if(this.waiting_for_ack == true) {
        this.ack_timer--;
        if(this.ack_timer <= 0){
            //rebroadcast the frame, ignoring the queue:
            this.addFrameToQueue(this.last_frame_broadcast, "HIGH");
            this.waiting_for_ack = false;
            this.status = "idle";
        }
    }

    if(Acid.System.getSteps() % 1000 < 256) {
        if(this.announce_timer <= 0 ) {
            this.announce();
            this.announce_timer = 16 + Math.floor(Math.random() *  64);
        }
    }
    this.announce_timer--;

    if(this.status == "collision") {
        this.wait_time--;
        if(this.wait_time <= 0 ){
            this.status = "idle";
            this.substatus = "idle";
        }
    }

    if(!this.waiting_for_ack) {
        if(this.status == "idle"){
            if(this.frames_to_be_broadcast.length > 0) {
                this.status = "broadcasting";
                this.substatus = "nav_countdown";
            }
        }
    }

    //receive broadcasts properly:
    if(this.status == "receiving") {
        if(this.substatus == "nav_countdown") {
            this.wait_time--;
            if(this.wait_time <= 0 && this.broadcast_being_received != null) {
                this.receiveBroadcast(this.broadcast_being_received);
                this.status = "idle";
                this.substatus = "idle";
            }
        }
    }

    if(this.status == "broadcasting"){ //if we want to broadcast

        this.tx_counter++;

        switch(this.substatus) {
            case "nav_countdown":
                this.wait_time--;
                if(this.wait_time <= 0) {
                    this.substatus = "difs_countdown";
                    this.wait_time = this.DCF_INTERFRAME_SPACE; //DIFS
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
                    this.wait_time = frame.data.length;
                    this.broadcastFrame(frame);
                }
                break;

            //this is the broadcasting state. This canont be interrupted.
            case "transmit_countdown":
                this.wait_time--;
                if(this.wait_time <= 0) {
                    this.status = "idle";
                    this.substatus = "idle";
                }
        }
    }
}

BatmanNode.prototype.prerender = function() {
    this.canvas = document.createElement('canvas');
    this.canvas.width=32;
    this.canvas.height = 32;
    this.canvasContext = this.canvas.getContext("2d");

    Acid.Graphics.drawCircleCtx(this.canvasContext, this.radius, this.radius, this.radius, {lineWidth: 1, strokeStyle: "rgb(" + this.color + ")"});
    Acid.Graphics.drawTextCtx(this.canvasContext, this.radius, this.radius + 4, this.id, {textAlign: "center", fillStyle: "rgb(" + this.color + ")", font: "8px Arial"});
}

BatmanNode.prototype.draw = function() {
    if (this.hovered == true) {
        Acid.Graphics.drawOnTop();
        Acid.Graphics.drawFilledSquare(this.x, this.y, 128, 128, {fillStyle: "rgba(255, 50, 255, .25)"})
        Acid.Graphics.drawText(this.x+4, this.y+16, "wait_time: " + this.wait_time, {textAlign: "left", fillStyle: "rgba(0,0,0, .25)", font: "16px Arial"});
        Acid.Graphics.drawText(this.x+4, this.y+32, "status: " + this.status, {textAlign: "left", fillStyle: "rgba(0,0,0, .25)", font: "16px Arial"});
        Acid.Graphics.drawText(this.x+4, this.y+48, "substat: " + this.substatus, {textAlign: "left", fillStyle: "rgba(0,0,0, .25)", font: "16px Arial"});
        Acid.Graphics.drawText(this.x+4, this.y+64, "ftbb: " + this.frames_to_be_broadcast.length, {textAlign: "left", fillStyle: "rgba(0,0,0, .25)", font: "16px Arial"});
        Acid.Graphics.drawText(this.x+4, this.y+64+16, "annc: " + this.announce_timer, {textAlign: "left", fillStyle: "rgba(0,0,0, .25)", font: "16px Arial"});
    

        Acid.Graphics.drawOnBottom();
        Acid.Graphics.drawCircle(this.x, this.y, this.broadcast_radius, {lineWidth: 1, strokeStyle: "rgb(" + this.color + ")"})
    }

    Acid.Graphics.drawImage(this.canvas, this.x - this.radius, this.y - this.radius);
    //Acid.Graphics.drawCircle(this.x, this.y, this.radius, {lineWidth: 1, strokeStyle: "rgb(" + this.color + ")"});
    //Acid.Graphics.drawText(this.x, this.y+4, this.id, {textAlign: "center", fillStyle: "rgb(" + this.color + ")", font: "8px Arial"});
    
    
    
    //Acid.Graphics.drawSquare(this.x, this.y, this.width, this.height, "#F00");
};

BatmanNode.prototype.announce = function() {
    //will send a frame to every surrounding node asking for routing table info.
    //No nodes should derive any info from this, because we need to ensure TWO WAY COMMUNICATION is possible to consider nodes neighbors.
    //Data can only be added to the routing_table on ACK FRAMES!!!!!

    this.addFrameToQueue({
        type: "ROUTING_TABLE_REQUEST",
        requires_ack: true,
        data:  "a",
        root_node: this.id,
        color: "0,64,0"
    }, "LOW");

}
/*
BatmanNode.prototype.announce = function() {


    var distance_table = [];

    for(node in this.routing_table) { //for every node in our routing table:
        shortest_distance = -1;
        for(neighbor_node in this.routing_table[node]) { //for every neighbor_node 
            if(shortest_distance == -1) {
                shortest_distance = this.routing_table[node][neighbor_node] //the distance from neighbor_node to node
            }else{
                if(this.routing_table[node][neighbor_node] < shortest_distance) {
                    shortest_distance = this.routing_table[node][neighbor_node];
                }
            }
        }
        distance_table[node] = shortest_distance;
    }

    //first, clear any existing announce frames from the queue. We only ever need to send one at a time. Having multiple in the queue is a waste.
    for(frame_index in this.frames_to_be_broadcast) {
        if(this.frames_to_be_broadcast[frame_index].type == "announcement_request") {
            this.frames_to_be_broadcast.splice(frame_index, 1);
        }
    }

    this.addFrameToQueue({
        type: "announcement_request",
        data:  "a",
        root_node: this.id,
        //distance_table: distance_table,
        color: "0,64,0"
    });
}*/

BatmanNode.prototype.addFrameToQueue = function(frame_, priority_) {
    frame_.from_node = this.id;
    frame_.id = (new Date()).getTime();
    
    if(frame_.final_node == undefined){
        frame_.final_node = -1;
    }

    if(frame_.color == undefined){
        frame_.color = Math.floor(Math.random()*255).toString() + "," + Math.floor(Math.random()*255).toString() + "," + Math.floor(Math.random()*255).toString();
    }
    if(frame_.root_node == undefined){
        frame_.root_node == this.id;
    }

    if(priority_ == "LOW") {
        this.frames_to_be_broadcast.unshift(frame_);
    }else{
        this.frames_to_be_broadcast.push(frame_);
    }
}

BatmanNode.prototype.getNextHop = function(final_node) {
    if(this.routing_table[final_node] == undefined) {
        return -1;
    }
    var quickest_route_node = -1;
    for(neighbor in this.routing_table[final_node]) {
        if(quickest_route_node == -1){
            quickest_route_node = neighbor;
        }else if(this.routing_table[final_node][neighbor] < this.routing_table[final_node][quickest_route_node]) {
            quickest_route_node = neighbor;
        }
    }
    return quickest_route_node;
}

BatmanNode.prototype.onMouseDown = function() {
    //find the node that will get us to node 13 the quickest:
    var destination = 13;
    var next_hop = this.getNextHop(destination);
    if(next_hop == -1){ 
        console.log("Cannot hop from " + this.id + " to " + destination + ". No path found.");
    }else{
        this.addFrameToQueue({
            type: "data",
            data: "LOL FUCK",
            final_node: destination,
            root_node: this.id,
            hopped_from: this.id,
            hopping_to: next_hop
        }, "LOW");
    }
}

BatmanNode.prototype.onMouseMove = function(event_) {
    console.log(this.routing_table);
}