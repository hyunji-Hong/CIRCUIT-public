class Stack {
  constructor() {
    this.data = [];
  }
}

Stack.prototype.push = function( item ) {
  // body...
  this.data.push( item );
};

Stack.prototype.pop = function() {
  // body...
  return this.data.pop() || null;
};

Stack.prototype.isEmpty = function() {
  // body...
  if ( this.data.length === 0 ) {
    return true;
  } else {
    return false;
  }
};

Stack.prototype.toString = function() {
  // body...
  let returnStr = "[STACK] : ";
  for ( let i = 0; i < this.data.length; ++i ) {
    returnStr += '[' + this.data[i].type + ':'
              + this.data[i].index + ']'
              + this.data[i].name + " - ";
  }
  return returnStr;
};