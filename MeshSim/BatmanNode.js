BatmanNode = function(x_, y_) {
    Node.call(this, x_, y_);

    this.routing_table = [];
    this.announce_timer = 8 + Math.floor(Math.random() * 128);
}

BatmanNode.prototype = Object.create(Node.prototype);
BatmanNode.prototype.constructor = BatmanNode;


/////////////////////////////////////
//BATMAN SPECIFIC FUNCTIONS
/////////////////////////////////////

BatmanNode.prototype.getNextHop = function(final_node) {
    if(this.routing_table[final_node] === undefined) {
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

BatmanNode.prototype.sendRoutingTableRequest = function() {
    //will send a frame to every surrounding node asking for routing table info.
    //No nodes should derive any info from this, because we need to ensure TWO WAY COMMUNICATION is possible to consider nodes neighbors.
    //Only add info to the table when a node receives a ROUTING_TABLE frame, not a ROUTING_TABLE_REQUEST

    for(frame_index in this.frames_to_be_broadcast) {
        if(this.frames_to_be_broadcast[frame_index].type == "ROUTING_TABLE_REQUEST") {
            this.frames_to_be_broadcast.splice(frame_index, 1);
        }
    }

    this.addFrameToQueue({
        type: "ROUTING_TABLE_REQUEST",
        color: "0,0,255",
        root_node: this.id,
        final_node: -1,
        hopping_to: -1
    }, "LOW");
}

BatmanNode.prototype.onReceiveACK = function(frame_) {
    Node.prototype.onReceiveACK.call(this, frame_);
    console.log("# Node " + this.id + " Received ACK from " + frame_.hopped_from);
}


BatmanNode.prototype.sendRoutingTable = function(dest_) {
    var distance_table = [];

    for(node in this.routing_table) { //for every node in our routing table:
        shortest_distance = -1;
        for(neighbor_node in this.routing_table[node]) { //for every neighbor_node 
            if(shortest_distance == -1) {
                shortest_distance = this.routing_table[node][neighbor_node] //the distance from neighbor_node to node
            }else if(this.routing_table[node][neighbor_node] < shortest_distance) {
                shortest_distance = this.routing_table[node][neighbor_node];
            }
        }
        distance_table[node] = shortest_distance;
    }
    this.addFrameToQueue({
        type: "ROUTING_TABLE", //routing table request ack
        root_node: this.id,
        final_node: dest_,
        hopping_to: dest_,
        distance_table: distance_table,
        color: "255,0,0"
    }, "LOW");
}

BatmanNode.prototype.onReadFrame = function(frame_) {
    if(frame_.type == "ROUTING_TABLE_REQUEST") {
        this.sendRoutingTable(frame_.root_node);

    }else if(frame_.type == "ROUTING_TABLE") {

       // console.log(frame_.final_node);
        if(frame_.hopping_to == this.id) {
            for(foreign_node in frame_.distance_table) {
                if(frame_.root_node != this.id && frame_.foreign_node != this.id) {
                    if(this.routing_table[foreign_node] === undefined) {
                        this.routing_table[foreign_node] = [];
                    }
                    this.routing_table[foreign_node][frame_.root_node] = frame_.distance_table[foreign_node] + 1;
                }
            }
        }
    }else if (frame_.type == "DATA") {
        if(frame_.final_node == this.id){
            //wow it made it! Congrats.
            console.log("Travel success. Packet recieved by destination node.");
        }else if(frame_.hopping_to == this.id){  //if this is the node this was hopping_to:
            var next_hop = this.getNextHop(frame_.final_node); //find the NEXT hop
            if(next_hop == -1){ //if the next hop can't be found
                console.log("Cannot hop from " + this.id + " to " + frame_.final_node + ". No path found.");
            }else{ //if the next hop is found:
                this.addFrameToQueue({
                    type: "DATA",
                    data:  frame_.data,
                    requires_ack: true,
                    final_node: frame_.final_node,
                    root_node: frame_.root_node,
                    hopped_from: this.id,
                    hopping_to: next_hop,
                    color: frame_.color
                }, "LOW");
            }
        }
    }
}

BatmanNode.prototype.onAttachToEntityManager = function() {
    Node.prototype.onAttachToEntityManager.call(this);

    this.routing_table[this.id] = [];
    this.routing_table[this.id][this.id] = 0; //obviously there is zero distance between this node and itself.
    if(this.id == 13){ //for demo purposes :(
        this.setColor("255, 0, 0");
    }
}

BatmanNode.prototype.update = function() {
    Node.prototype.update.call(this);

    if(Acid.System.getSteps() < 10000) {
        if(this.announce_timer <= 0 ) {
            this.sendRoutingTableRequest();
            var freq = Math.floor( (Acid.System.getSteps() / 500) * 64);
            this.announce_timer = Math.floor(Math.random() *  256);
        }
    }
    this.announce_timer--;
}

BatmanNode.prototype.onMouseDown = function() {
    //find the node that will get us to node 13 the quickest:
    var destination = document.getElementById('destination_id').value.toString();
    
    var next_hop = this.getNextHop(destination);
    if(next_hop == -1){ 
        console.log("Cannot hop from " + this.id + " to " + destination + ". No path found.");
    }else{
        this.addFrameToQueue({
            type: "DATA",
            data: "LOL FUCK",
            requires_ack: true,
            final_node: destination,
            root_node: this.id,
            hopped_from: this.id,
            hopping_to: next_hop,
            color: "0, 255, 0"
        }, "LOW");
    }
}

BatmanNode.prototype.onMouseMove = function(event_) {
    console.log(this.routing_table);
}