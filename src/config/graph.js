/* 
  ES6 GRAPH 

class Graph {
  constructor() {
    this.adjList = new Map();
  }
};

Graph.prototype.addVertex = function( vertex ) {
  // body...
  if( !this.adjList.has(vertex) ) {
    this.adjList.set( vertex.index, [] );
  } else {
    throw 'Already Exist!!!';
  }
};

Graph.prototype.addEdge = function( vertex, node ) {
  // body...
  if( this.adjList.has( vertex.index ) ) {
    if( this.adjList.has( node.index ) ) {
      let arr = this.adjList.get( vertex.index );
      if( !arr.includes( node.index ) ) {
        arr.push( node.ind );
      }
    } else {
      throw `Can't add non-existing vertext -> '${node.index}'`;
    }
  } else {
    throw `You should add '${vertext.index}' first`;
  }
};

Graph.prototype.display = function() {
  // body...
  for ( let [key, value] of this.adjList ) {
    console.log( ket, value );
  }
};

*/