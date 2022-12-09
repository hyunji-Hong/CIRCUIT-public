module.exports = class Queue {
  constructor() {
    this.data = [];
    // type : Array
  };

  enqueue( item ) {
    this.data.push( item );
  };

  dequeue() {
    return this.data.shift();
  };

  isEmpty() {
    if ( this.data.length === 0 ) {
      return true;
    } else {
      return false;
    }
  };

  toString() {
    let returnStr = "[QUEUE] : ";
    for ( let i = 0; i < this.data.length; ++i ) {
      returnStr += '[' + this.data[i].type + ':'
                + this.data[i].index + ']'
                + this.data[i].name + " - ";
    }
    return returnStr;
  };
}