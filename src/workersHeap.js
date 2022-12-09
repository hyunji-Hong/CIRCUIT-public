// const fs = require('fs');
const path = require('path');
const fs = require('fs');
const argv = process.argv.slice(2);
const target = argv[ 0 ];
const heapPath = path.join( __dirname, 'heapData', target );
const logger = require('./config/winston');
const WorkerHeap = {};

function searchBFS( startIndex, endIndex ) {
  initNode();
  
  let nodeRegex = RegExp('object|array|native|closure','i');
  let edgeRegex = RegExp('property|internal|context', 'i');
  // console.log( 'context index ' + endNode.index );

  let queue = new Queue();
  let graph = new Graph();

  queue.enqueue(nodes[startIndex]);
  while( !queue.isEmpty() ) {
    let rootNode = queue.dequeue();
    graph.addNode( rootNode );
    if( rootNode === nodes[endIndex] ) {
      // visitNode( nodes[startIndex]);
      // visitNode( rootNode );
      return true;
    }
    rootNode.edges.forEach( ( edge ) => {
      let node = nodes[edge.nodeIndex];
      if ( edgeRegex.test( edge.type ) && nodeRegex.test( node.type ) && node.marked === false ) {
        nodes[edge.nodeIndex].marked = true;
        graph.addEdge( rootNode, node, edge );
        queue.enqueue(nodes[edge.nodeIndex])
      }
    })
  }

  return false;
}

function searchDFS( startIndex, endIndex ) {
  initNode();

  let nodeRegex = RegExp('object|array|native|closure','i');
  let edgeRegex = RegExp('property|internal|context', 'i');
  // console.log( 'context index ' + endNode.index );
  let checkList = [];
  let stack = new Stack();
  let graph = new Graph();

  nodes[startIndex].marked = true;
  stack.push( nodes[startIndex])

  while ( !stack.isEmpty() ) {
    let rootNode = stack.pop();
    if( rootNode === nodes[endIndex]){
      // visitNode( nodes[startIndex] )
      // visitNode( rootNode )
      return true;
    }

    rootNode.edges.forEach( function ( edge, index ) {
      let node = nodes[edge.nodeIndex];
      if ( checkList.includes( node.Index ) ) {
        console.log( 'CYCLE' )
      }
      if ( edgeRegex.test(edge.type) && nodeRegex.test(node.type) && node.marked === false ){
        nodes[edge.nodeIndex].marked = true;
        checkList.push( node.index )
        stack.push( nodes[ edge.nodeIndex ]);
      }
    })
  }
  return false;
}

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
        node[ 'marked' ] = false;
      }
    }
    node.index = i;
    //Serise number 

    edgeCnt = node.edge_count;
    for ( let k = 0; k < edgeCnt; k++ ) {
      edge = node.edges[k] = {};
      for ( let = l = 0; l < edgeFieldsLen; l++) {
        edgeFieldsValue = edges[ edgeIndex ];
        // console.log(edgeFieldsLen * k + l );
        if ( l === 0 ) {
          //Edge Type
          edge[ edgeFields[ l ]] = edgeTypes0[ edgeFieldsValue ];
        } else if ( l === 1 ) {
          edge[ edgeFields[ l ]] = strings[ edgeFieldsValue ]
        } else {
          edge[ 'nodeIndex' ] = edgeFieldsValue / 6;
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

function depthFind( depth, index, nodes ) {
  let result = [];
  for (var i = 1 ; i <= depth; i++) {
    let node = nodes[index]
    node.edges.forEach( (edge) => {
      let nextNode = nodes[edge.nodeIndex];
      // console.log('NODE : ' + node.name)
      // console.log('EDGE : ' + edge.name_or_index)
      // console.log('NEXT NODE : ' +  nodes[edge.nodeIndex].name)
      result.push(`${node.name}:${node.index}@@${nextNode.name}:${nextNode.index}@@${edge.name_or_index}`)
    })
  }
  return result;
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

Graph.prototype.findPath = function( startIndex, endIndex, nodes ) {
  // body...
  let currentNode = this.nodes.find( ( node ) => node.index === endIndex );
  let path = "";
  let result = {
    'nodes' : [],
    'edges' : [],
    'graph' : []
  };
  while( !( currentNode.index === startIndex ) ) {
    this.nodes.forEach( ( node ) => {
      let edgeInfo = this.edges[node.index].map( n => n.node.index )
      if ( edgeInfo.includes( currentNode.index ) ) {        
        // console.log( this.edges[currentNode.index])
        edge = this.edges[node.index][edgeInfo.indexOf( currentNode.index )].edge;
        // console.log( 'NODE : ' + currentNode.name )
        // console.log( 'EDGE : ' + edge.name_or_index )
        // console.log( 'PREV NODE : ' + node.name )
        depthFind( 1, currentNode.index, nodes ).forEach( ( path ) => {
          result.graph.push( path )
        })
        result.graph.push( `${currentNode.name}:${currentNode.index}@@${node.name}:${node.index}@@${edge.name_or_index}`)

        path += `
        [NODE]${currentNode.name} -- 
        [EDGE]${this.edges[node.index][edgeInfo.indexOf( currentNode.index )].edge.name_or_index} -> `
        result.nodes.push(currentNode.name);

        result.edges.push(this.edges[node.index][edgeInfo.indexOf( currentNode.index )].edge.name_or_index + ',' + this.edges[node.index][edgeInfo.indexOf( currentNode.index )].edge.nodeIndex + ':' + this.edges[node.index][edgeInfo.indexOf( currentNode.index )].edge.name_or_index);
        currentNode = node;
      }
    })
  }
  result.nodes.push(currentNode.name);
  path += `[NODE]${currentNode.name}`;
  
  return result;
};

function detect( startIndex, endIndex, nodes ) {
  initNode( nodes );

  let nodeRegex = RegExp('object|array|native|closure','i');
  let edgeRegex = RegExp('property|internal|context', 'i');
  // console.log( 'context index ' + endNode.index );
  let checkList = [];
  let queue = new Queue();
  let graph = new Graph();

  nodes[startIndex].marked = true;
  queue.enqueue( nodes[startIndex])

  while ( !queue.isEmpty() ) {
    let rootNode = queue.dequeue();
    graph.addNode( rootNode );

    if( rootNode === nodes[endIndex]){
      // visitNode( nodes[startIndex] )
      // visitNode( rootNode )
      // console.log(graph.findPath( startIndex, endIndex ));
      return [ true, graph.findPath( startIndex, endIndex, nodes) ];
    }

    rootNode.edges.forEach( function ( edge, index ) {
      let node = nodes[edge.nodeIndex];
      
      if ( edgeRegex.test(edge.type) && nodeRegex.test(node.type) && node.marked === false ){
        nodes[edge.nodeIndex].marked = true;
        
        graph.addNode( node );
        graph.addEdge( rootNode, node, edge );
        queue.enqueue( nodes[ edge.nodeIndex ]);
      }
    })
  }
  return false;
}

function getHeapFile( filelist ) {
  let result
  filelist.some( ( file ) => {
    let filename;
    let exp;
    if(file.indexOf('.')>=0) {
      filename = file.substring(0,file.lastIndexOf('.'));
      exp = file.substring(file.lastIndexOf('.')+1,file.length);
    } else {
      filename = file;
      exp = '';
    }

    if ( exp === 'heapsnapshot' ) {
      result = file;
      return true
    }
  })
  return result
}

logger.info(`${target} GRAPHING START`)
filelist = fs.readdirSync( heapPath )
filename = getHeapFile( filelist )  
if ( filename ) {
  const heapData = path.join( heapPath, filename )
  const snapshotData = fs.readFileSync( heapData );
  const snapshotJson = JSON.parse( snapshotData );
  const nodes = parseSnapShot( snapshotJson );
  const resultjson = `${filename}-graph.json`;
  // fs.writeFileSync( path.join( __dirname, 'json', target + 'test.json' ), JSON.stringify(nodes));
  const workerNodes = getWorkerNode( nodes );
  const contextNodes = getContextNode( nodes );
  const graphResult = {};

  logger.info(`[NUMBER OF CONTEXT] : ${contextNodes.length}`)
  logger.info(`[NUMBER OF WORKER] : ${workerNodes.length}`)
  
  contextNodes.forEach( ( contextNode ) => {
    // console.log( '[CONTEXT NODE] : ' + contextNode)
    workerNodes.forEach( ( workerNode ) => {
      // console.log( '[WORKER NODE] : ' + workerNode )
      const result = detect( contextNode, workerNode, nodes )
      if ( result.length === 2 ) {
        logger.info(`${workerNode} : ${contextNode} - DETECT `)
        // console.log( '%o',result[1].graph.length)
        graphResult[ workerNode + '@@' + contextNode ] = {
          'context' : nodes[contextNode],
          'worker' : nodes[workerNode],
          'graph' : result[1].graph
        }
      }
    })
  })
  logger.info(`${target} GRAPH DATA CREATE...`)
  fs.writeFileSync( path.join( heapPath, resultjson ),
        JSON.stringify( graphResult, null, 2 ) );
} else {
  logger.error(`${target} GRAPH DATA CREATE ERROR`)
  return false
}
logger.info(`${target} GRAPH DATA CREATE END`)