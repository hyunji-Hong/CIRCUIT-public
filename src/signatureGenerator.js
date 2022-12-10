// Generate signatures for specific crypto-mining sites
const CDP = require('chrome-remote-interface');
const usage = require( 'usage' );
const fs = require('fs');
const path = require( 'path' );
const logger = require('./config/winston');

class Queue {
  constructor() {
    this.data = [];
    // type : Array
  }
}
Queue.prototype.enqueue = function( item ) {
  // body...
  this.data.push( item );
};
Queue.prototype.dequeue = function() {
  // body...
  return this.data.shift();
};
Queue.prototype.isEmpty = function() {
  // body...
  if ( this.data.length === 0 ) {
    return true;
  } else {
    return false;
  }
};

Queue.prototype.toString = function() {
  // body...
  let returnStr = "[QUEUE] : ";
  for ( let i = 0; i < this.data.length; ++i ) {
    returnStr += '[' + this.data[i].type + ':'
              + this.data[i].index + ']'
              + this.data[i].name + " - ";
  }
  return returnStr;
};

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
              + this.data[i].name + " -> ";
  }
  return returnStr;
};

function visitNode( _node ) {
  console.log( 'Node Type : ' + _node.type + ' Node Name : ' + _node.name + ' / Node Index : ' + _node.index );
}

function visitEdge( _edge ) {
  console.log( 'Edge Type : ' + _edge.type + ' Edge Name : ' + _edge.name_or_index + ' Edge nodeIndex : ' + _edge.nodeIndex + ' / Edge Index : ' + _edge.index );
}

class Graph {
  constructor() {
    this.edges = {};
    this.nodes = [];
  }
}

Graph.prototype.addNode = function( node ) {
  // body...
  this.nodes.push( node );
  this.edges[node.index] = [];
};

Graph.prototype.addEdge = function( node, node2, edge ) {
  // body...
  this.edges[node.index].push( { 'node': node2, 'edge': edge } )
};

Graph.prototype.display = function() {
  let graph = "";
  this.nodes.forEach( ( node ) => {
    graph += `[${node.index}]` + node.name + "->" +   
    this.edges[node.index].map( n => n.node.index ).join(" / ") +
    "\n";
  });
  console.log( graph )
};

Graph.prototype.findPath = function( startIndex, endIndex ) {
  // body...
  let currentNode = this.nodes.find( ( node ) => node.index === endIndex );
  let path = "";
  // console.log( this.edges[8733]);
  while( !( currentNode.index === startIndex ) ) {
    this.nodes.forEach( ( node ) => {
      let edgeInfo = this.edges[node.index].map( n => n.node.index )
      if ( edgeInfo.includes( currentNode.index ) ) {        
        path += `[NODE : ${currentNode.index}]${currentNode.name} -- [EDGE : ${this.edges[node.index][edgeInfo.indexOf( currentNode.index )].edge.index}]${this.edges[node.index][edgeInfo.indexOf( currentNode.index )].edge.name_or_index} -> `        
        currentNode = node;
      }
    })
  }
  path += `[NODE]${currentNode.name}`;
  return path;
};

function parseSnapShot( _snapshot ) {
  const meta = _snapshot.snapshot.meta;
  const strings = _snapshot.strings;
  const nodes = _snapshot.nodes;
  const edges = _snapshot.edges;

  const nodeTypes = meta.node_types;
  const nodeTypes0 = nodeTypes[0];
  const edgeTypes = meta.edge_types;
  const edgeTypes0 = edgeTypes[0];

  const nodeFields = meta.node_fields;
  // Type, Name, Id, Self-size, Edge_count, TraceNode_Id
  const nodeFieldsLen = nodeFields.length; // 6

  const edgeFields = meta.edge_fields;
  // Type, String_or_Index, To_node

  const edgeFieldsLen = edgeFields.length; // 3

  let edgeIndex = 0;
  let numNodes = _snapshot.snapshot.node_count;

  let node;
  let nodeFieldsValue;

  let edgeCnt;
  let edge;
  let edgeFieldsValue;

  let computedNodes = [];

  for ( let i = 0; i < numNodes; i++ ) {
    node = computedNodes[i] = { edges: [] };
    for ( let j = 0; j < nodeFieldsLen; j++) {
      nodeFieldsValue = nodes[ nodeFieldsLen * i + j];
      if ( j === 0 ) {
        // Node type
        node[ nodeFields[ j ]] = nodeTypes0[ nodeFieldsValue ]; 
      } else if ( j === 1 ) {
        // Node name
        node[ nodeFields[ j ]] = strings[ nodeFieldsValue ];
      } else {
        node[ nodeFields[ j ]] = nodeFieldsValue;
      }
    }
    node.index = i;
    //Serise number 

    edgeCnt = node.edge_count;
    for ( let k = 0; k < edgeCnt; k++ ) {
      edge = node.edges[k] = {};
      for ( let l = 0; l < edgeFieldsLen; l++) {
        edgeFieldsValue = edges[ edgeIndex ];
        // console.log(edgeFieldsLen * k + l );
        if ( l === 0 ) {
          //Edge Type
          edge[ edgeFields[ l ]] = edgeTypes0[ edgeFieldsValue ];
        } else if ( l === 1 ) {
          edge[ edgeFields[ l ]] = strings[ edgeFieldsValue ]
        } else {
          edge[ edgeFields[ l ]] = edgeFieldsValue;
          edge[ 'nodeIndex' ] = edgeFieldsValue / nodeFields.length;
        }
        edge.index = edgeIndex;
        edgeIndex++;
      }
    }
  }
  return computedNodes;
}

function getWorkerNode( _nodes ) {
  let workerNum = 0;
  let workerNodes = [];
  _nodes.forEach( function ( element, index, array ) {
    if ( element.name === 'Worker' && element.type === 'native') {
      workerNodes.push(element.index)
    } 
  });
  if ( workerNodes.length === 0 ) {
    return -1;
  } 
  return workerNodes;
}

function getContextNode( _nodes ) {
  let contextNodes = [];
  _nodes.forEach( function ( element, index, array ) {
    // name = system / NativeContext - hidden | Window / window.loaction.origin - object;
    // Window / http://www.findglocal.com
    // Window / https://www.dominos.com
    if ( element.name === 'system / NativeContext' && element.type === 'hidden' ) {
    // if ( element.name === 'Window / http://www.findglocal.com' && element.type === 'object' ) {
      element.edges.forEach( ( edge ) => {
        //logger.info( '1. ' + edge.name_or_index);
        if ( edge.name_or_index === 'extension' && edge.type === 'internal')
          // console.log(element.index + ' : ' + nodes[ edge.nodeIndex ].name)
          contextNodes.push(edge.nodeIndex);
      })
    }
  });
  if ( contextNodes.length === 0 ) {
    return -1;
  }
  return contextNodes;
}

function initNode( nodes ) {
  nodes.forEach( ( node ) => {
    node.marked = false;
  })
}

function getUsageData( _processId ) {
  return new Promise( function ( resolve, reject ) {
    usage.lookup( _processId, function( err, result ) {
      if ( result ) {
        resolve( result );
      } else {
        reject( -1 );
      }
    })
  })
}

function detect( startIndex, endIndex, nodes ) {
  initNode( nodes );

  let nodeRegex = RegExp('object|array|native|closure|string','i');
  let edgeRegex = RegExp('property|internal|context|hidden', 'i');
  // console.log( 'context index ' + endNode.index );
  let stack = new Stack();
  let graph = new Graph();
  nodes[startIndex].marked = true;

  stack.push( nodes[startIndex])

  while ( !stack.isEmpty() ) {
    let rootNode = stack.pop();
    graph.addNode( rootNode );

    if( rootNode === nodes[endIndex]){
      return [ true, graph.findPath( startIndex, endIndex) ];
    }

    rootNode.edges.forEach( function ( edge, index ) {
      let node = nodes[edge.nodeIndex];
      // let detect = node.edges.find( (edge ) => ( edge.nodeIndex === 1107583 ))
      // if( detect ) {
      //   console.log( '%o', node )
      //   console.log( '%o', detect )
      // }
      if ( edgeRegex.test(edge.type) && nodeRegex.test(node.type) && node.marked === false ){
        nodes[edge.nodeIndex].marked = true;
        graph.addEdge( rootNode, node, edge );
        stack.push( nodes[ edge.nodeIndex ]);
      }
    })
  }
  return false;
}

async function detector( filename ) {
  // Set config
  
  const result = {
    'type' : 0,
    'worker' : {
      'length' : 0
    },
    'context' : {
      'length' : 0
    },
    'usage' : {},
    'metric' : {},
    'tracing' : {},
    'graph' : {}
  };
  
  const heapFileName = filename;

  const resultFile = `${filename}-${Date.now()}-result.txt`;

  const snapshotData = fs.readFileSync( path.join( __dirname, heapFileName ) );
  const snapshotJson = JSON.parse( snapshotData );
  const nodes = parseSnapShot( snapshotJson );
  const workerNodes = getWorkerNode( nodes );
  const contextNodes = getContextNode( nodes );

  result.worker.length = workerNodes.length;
  result.context.length = contextNodes.length;

  try {
  logger.info( 'Insert threads message tracing function' );

  // [ STEP N ] Memory Heap Graph
  contextNodes.forEach( ( contextNode ) => {
      workerNodes.forEach( ( workerNode ) => {
      const graphResult = detect( contextNode, workerNode, nodes );
      if ( graphResult.length === 2 ) {
          result.graph[ workerNode ] = { 
          'path' : graphResult[1],
          'context' : {
              'index' : nodes[contextNode].index,
              'name' : nodes[contextNode].name
          },
          'worker' : {
              'index' : nodes[workerNode].index,
              'name' : nodes[workerNode].name
          }
          }
      }
      })
  })

  } catch ( err ) { 
  return -1;
  }

  try {
    
  } catch ( err ) {
    return -1;
  }

  try {
    logger.info( 'beforefilewrite' );
    fs.writeFileSync( path.join( __dirname , resultFile ),
      JSON.stringify( result, null, 2 ) );
    logger.info( 'filewrite' );


  } catch ( err ) {
    logger.error( 'SAVE STEP : ' + err.message );
    return -1;
  }

  logger.info( filename + 'detector finish');
}

const args = process.argv.slice( 2 );
const filename = args[0];
logger.info( args[0] );


async function main() {
  detector( filename );
}

main();