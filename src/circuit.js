// {"snapshot":{"meta":{"node_fields":["type","name","id","self_size","edge_count","trace_node_id"],"node_types":[["hidden","array","string","object","code","closure","regexp","number","native","synthetic","concatenated string","sliced string","symbol","bigint"],"string","number","number","number","number","number"],"edge_fields":["type","name_or_index","to_node"],"edge_types":[["context","element","property","internal","hidden","shortcut","weak"],"string_or_number","node"],"trace_function_info_fields":["function_id","name","script_name","script_id","line","column"],"trace_node_fields":["id","function_info_index","count","size","children"],"sample_fields":["timestamp_us","last_assigned_id"],"location_fields":["object_index","script_id","line","column"]},"node_count":59111,"edge_count":218163,"trace_function_count":0},
const puppeteer = require('puppeteer-core');
const CDP = require('chrome-remote-interface');
const chromeLauncher = require( 'chrome-launcher');
const util = require( 'util' );
const request = require( 'request' );
const usage = require( 'usage' );
const fs = require('fs');
const path = require( 'path' );
const urlExists = require('url-exists');
const logger = require('./config/winston');

const logSet = path.join( __dirname, 'logs' );
const dataSet = path.join( __dirname, 'data' );
const workerDir = path.join( dataSet, 'workerPage' );
const noWorkerDir = path.join( dataSet, 'noWokerPage' );

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
  }2
  path += `[NODE]${currentNode.name}`;
  return path;
};


// 메모리 데이터를 해석해주는 곳
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
      for ( let = l = 0; l < edgeFieldsLen; l++) {
        edgeFieldsValue = edges[ edgeIndex ];
        // console.log(edgeFieldsLen * k + l );
        if ( l === 0 ) {
          //Edge Type
          edge[ edgeFields[ l ]] = edgeTypes0[ edgeFieldsValue ];
        } else if ( l === 1 ) {
          edge[ edgeFields[ l ]] = strings[ edgeFieldsValue ]
        } else {
          edge[ edgeFields[ l ]] = edgeFieldsValue;
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

function sleep ( ms ) {
  return new Promise( function ( resolve ) {
    setTimeout( resolve, ms );
  })
}

function urlCheck ( _inputUrl ) {
  let httpCheck = /(http:\/\/)|(https:\/\/)/;
  urlExists( _inputUrl, function( err, exists ) {
    if ( !exists ) {
      _inputUrl = 'https://' + _inputUrl;
    }
  })
  return _inputUrl;
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
      // visitNode( nodes[startIndex] )
      // visitNode( rootNode )
      // console.log(graph.findPath( startIndex, endIndex ));
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

async function detector( url) {
  // Set config
  const target = url.replace(/(http:\/\/)|(https:\/\/)/, '');
  const heapFileName = `${target}-${Date.now()}.heapsnapshot`;
  const screenshotFile = `${target}-${Date.now()}-screenshot.png`;
  const resultFile = `${target}-${Date.now()}-result.txt`;
  const totalResult = 'result.txt';

  // Get chrome & start
  const chrome = await chromeLauncher.launch( {
    port : 9222, //기본 포트야 크롬 제어하는 포트
    chromeFlags: [ '--headless', '--disable-gpu']
    // --headless'. 지우면 크롬이 동작하는 거 볼 수 있음
  });

  // Chrome debuger protocol
  // Why? 메모리를 건들 수 있어서 퍼펫티어랑 CDP를 이용한다.

  CDP( async function ( client ) { 
    const { Network, Page, HeapProfiler, Performance } = client; //내가 사용할 데이터 필드 지정

    const resp = await util.promisify(request)(`http://localhost:${chrome.port}/json/version`);
    const {webSocketDebuggerUrl} = JSON.parse(resp.body);
    const browser = await puppeteer.connect({browserWSEndpoint: webSocketDebuggerUrl});
    const [ page ] = await browser.pages();

    //거의 공식 알려면 구글 좀 뒤져ㅕ봐야함
    await page.setViewport( { width : 1980, height : 1080 } );

    // [INIT STEP ]
    // Function setting & Navigate URL
    try{
      await Network.enable();
      await Performance.enable();
      await Page.enable();
      await HeapProfiler.enable();

      if ( await Network.canClearBrowserCache() ) {
        await Network.clearBrowserCache();
      }

      if ( await Network.canClearBrowserCookies() ) {
        await Network.clearBrowserCookies();
      }

      //브라우저 저장된 데이터 클리어
      
      await Promise.all( [
        page.goto( url ),
        page.waitForNavigation( { waitUntil : 'load' } )
        ])
      logger.info('SUCESS Navigate : ' + url )
      await page.waitFor( 2000 );
    } catch ( err ) {
      logger.error( err.message );
      client.close();
      browser.close();
      return -1;
    }

    // [ STEP 1 ]
    //type : 0 - Normal / 1 - Worker Page / 2 - Stealth / 3 - Cryptojacking / 4 - Error page
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

    // Worker Check
    const workers = await page.workers();
    const dirPath = path.join( 
      ( ( workers.length === 0 ) ? noWorkerDir : workerDir ),
      target 
    );

    if( workers.length === 0 ) {
      // Not have Worker Website -> No Memory Heap Collecting 
      logger.info('This webpage does not have WebWorker.')
      if ( !fs.existsSync( dirPath ) ) {
        logger.info( 'It generates' + dirPath + ' because it does not exist.' );

        fs.mkdirSync( dirPath );
      }
    } else {
      //중점적으로 봐야할 곳 핵심

      // Worker Website
      logger.info('This webpage does have WebWorker : ' + workers.length );
      
      // Initially assumed to be stealth webpage
      result.type = 2;

      if ( !fs.existsSync( dirPath ) ) {
        logger.info( 'Directory creation : ' + dirPath);
        fs.mkdirSync( dirPath );
      }

      //메모리 힙을 따는 곳
      logger.info( 'Start MemoryHeap creation : ' + heapFileName );
      await HeapProfiler.addHeapSnapshotChunk((c) => {
        fs.appendFileSync( path.join( dirPath, heapFileName ), c.chunk);
      });

      await HeapProfiler.takeHeapSnapshot();
      logger.info( 'Finish MemoryHeap creation : ' + heapFileName );

      const snapshotData = fs.readFileSync( path.join( dirPath, heapFileName ) );
      const snapshotJson = JSON.parse( snapshotData );
      const nodes = parseSnapShot( snapshotJson );
      const workerNodes = getWorkerNode( nodes );
      const contextNodes = getContextNode( nodes );

      result.worker.length = workerNodes.length;
      result.context.length = contextNodes.length;

      try {
        logger.info( 'Insert threads message tracing function' );

        // [Message tracing function]
        const workerPrototype = await page.evaluateHandle( () => {
          return Worker.prototype;
        })
        const workerInstances = await page.queryObjects( workerPrototype );


        //찾아낸 웹 쓰레드에 대해서 메세지 이벤트를 추적해주는 것 (부가적인 기술)
        await page.evaluate( ( _workerInstances ) => {
          window.msgInfo = new Array();
          eval( _workerInstances ).forEach( ( _worker ) => {
            _worker.addEventListener( 'message', ( event ) => {
              msgInfo.push( event.data );
            })
          })
        }, workerInstances );

        
        //CIRCUIT

        // [ STEP N ] Memory Heap Graph
        contextNodes.forEach( ( contextNode ) => {
          workerNodes.forEach( ( workerNode ) => {
            const graphResult = detect( contextNode, workerNode, nodes );
            if ( graphResult.length === 2 ) {
              result.graph[ workerNode + '@@' + contextNode ] = { 
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
              logger.info('Graphing' + target + ' MemoryHeap')
            }
          })
        })

        await page.waitFor( 5000 );

        const msgTracing = await page.evaluate( () => {
          return window.msgInfo;
        });

        result.tracing = msgTracing;

      } catch ( err ) { 
        logger.error( target + ' ' + err.message );
        browser.close();
        client.close();
        return -1;
      }
    }
    try {
      logger.info('Capture ' + target + ' screenshot' );
      await page.screenshot( { path : path.join( dirPath, screenshotFile ) } )      

      // Usage Data Collecting Step
      logger.info('Get ' + target + ' usage' );
      const usageData = await getUsageData( chrome.pid );
      result.usage = usageData;

      // Get Web Page Performance Metrics
      logger.info('Get ' + target + ' web page performance metrics' );
      const metrics = await Performance.getMetrics();
      result.metrics = metrics;
    } catch ( err ) {
      logger.error( err.message );
      browser.close();
      client.close();
      return -1;
    }

    const simpleResult = {
      'target' : target,
      'type' : result.type,
      'worker' : {
        'length' : result.worker.length
      },
      'usage' : {
        'cpu' : result.usage.cpu,
        'memory' : result.usage.memory
      }
    }
    
    try {
      fs.writeFileSync( path.join( dirPath, resultFile ),
        JSON.stringify( result, null, 2 ) );

      fs.appendFileSync( path.join( __dirname, totalResult ),
        JSON.stringify( simpleResult ) + '\n' );

      logger.info( target + ' SAVE ' );
    } catch ( err ) {
      logger.error( 'SAVE STEP : ' + err.message );
      return -1;
    }

    logger.info( target + 'detector finish');
    browser.close();
    client.close();
  }).on('error', ( err ) => {
    logger.error( err.message );
    return -1;
  });
}

async function saveResultData(flag, data ) {
 
}

function init() {
  if ( !fs.existsSync ( dataSet ) ) {
    logger.info( '[SUCESS]' + dataSet + ' : dictionary for collecting data' );
    fs.mkdirSync( dataSet );

    fs.mkdirSync( workerDir );
    logger.info( '[SUCESS]' + dataSet + ' : dictionary for worker page data' );
    
    fs.mkdirSync( noWorkerDir );
    logger.info( '[SUCESS]' + dataSet + ' : dictionary for no-worker page data' );
  }

  if ( !fs.existsSync ( logSet ) ) {
    logger.info( '[SUCESS]' + logSet + ' : dictionary for log data' );
    fs.mkdirSync( logSet );
  }
}



const args = process.argv.slice( 2 );
const url = urlCheck( args[ 0 ] );
const parseList = 'run.txt';

async function main() {
  logger.info('START CIRCUIT : ' + url );
  init();
  detector( url );
}

main();