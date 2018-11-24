FloodNode = function(x_, y_) {
    Node.call(this, x_, y_);
}

FloodNode.prototype = Object.create(Node.prototype);
FloodNode.prototype.constructor = FloodNode;

FloodNode.prototype.receiveFrame = function(frame_) {
    //FROM HERE: 
    if(!this.frameHasBeenReceivedBefore(frame_)) { //if we have never seen this frame before
        this.color = frame_.color;
        this.addFrameToQueue(frame_, "LOW");
    }
    Node.prototype.receiveFrame.call(this, frame_);
}