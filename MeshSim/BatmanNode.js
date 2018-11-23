//this is the lastest one

BatmanNode = function(x_, y_) {
    Acid.Entity.call(this, x_, y_);

    this.objectType = "batmannode"

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
    this.tx_counter = 0; //the amount of time it takes between wanting to tx, to actually txing the frame.

    this.announce_timer = 256 + Math.floor(Math.random() * 512);

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
}

BatmanNode.prototype.receiveBroadcast = function(broadcast_) {
    if(!this.received_frame_ids.includes(broadcast_.frame.id)) { //if we have never seen this frame before
        if(broadcast_.frame.type == "announcement") {
            for (foreign_node in broadcast_.frame.distance_table) { //for every foreign node in this distance table

                if(this.routing_table[foreign_node] == undefined){
                    this.routing_table[foreign_node] = [];
                }

                this.routing_table[foreign_node][broadcast_.frame.root_node] = broadcast_.frame.distance_table[foreign_node] + 1;
            }
        }


        //this.frames_to_be_broadcast.unshift(broadcast_.frame); //rebroadcast it
        this.received_frame_ids.push(broadcast_.frame.id); //mark this frame as "Seen"
        Researcher.addHop();
    }else{
        Researcher.addRedundantHop();
    }

    this.broadcast_being_received = null;
}

//broadcasts a packet.
BatmanNode.prototype.broadcastFrame = function(frame_) {
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

    if(this.announce_timer <= 0 ) {
        this.announce();
        this.announce_timer = 256 + Math.floor(Math.random() * 512);
    }
    this.announce_timer--;

    if(this.status == "collision") {
        this.wait_time--;
        if(this.wait_time <= 0 ){
            this.status = "idle";
            this.substatus = "idle";
        }
    }

    if(this.status == "idle"){
        if(this.frames_to_be_broadcast.length > 0) {
            this.status = "broadcasting";
            this.substatus = "nav_countdown";
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

    if(this.collision_counter > 0) {this.collision_counter-=2;}
    Acid.Graphics.drawCircle(this.x, this.y, this.radius, {lineWidth: 1, strokeStyle: "rgb(" + this.color + ")"});
    Acid.Graphics.drawText(this.x, this.y+4, this.id, {textAlign: "center", fillStyle: "rgb(" + this.color + ")", font: "8px Arial"});
    //Acid.Graphics.drawSquare(this.x, this.y, this.width, this.height, "#F00");
};

BatmanNode.prototype.announce = function() {
    //the distance table will contain only this node's min distance from every other connected node.
    /*
        distance_table = [
            a: 3 hops
            b: 4 hops
            c: 1 hop
        ]
    */
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

    frame = {
        type: "announcement",
        data:  "annc",
        id: (new Date()).getTime(),
        destination_node: -1,
        distance_table: distance_table,
        root_node: this.id
    };
    this.frames_to_be_broadcast.unshift(frame);
}

BatmanNode.prototype.onMouseDown = function() {
    /*frame = {
        type: "plaintext",
        data: "fuck yo",
        id: (new Date()).getTime(),
        destination_node: 13,
        root_node: this.id,
        color: Math.floor(Math.random()*255).toString() + "," + Math.floor(Math.random()*255).toString() + "," + Math.floor(Math.random()*255).toString()
    }

    this.frames_to_be_broadcast.unshift(frame);*/
    console.log(this.routing_table);
}

BatmanNode.prototype.onMouseMove = function(event_) {
    //console.log(this.received_frame_ids);
}