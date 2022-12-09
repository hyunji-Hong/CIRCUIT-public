# # networkx , numpy, scipy, ma

# import networkx as nx
# import numpy as np

import networkx as nx
import matplotlib.pyplot as plt
import json
import sys
import getopt
import os

BASE_DIR = os.path.dirname( os.path.abspath( __file__ ) )

CONFIG_DIR_NAME = """config"""
CONFIG_DIR = os.path.join( BASE_DIR, CONFIG_DIR_NAME )

SINGATURE_JSON = """signature.json"""

def graphing( graphData ):
  result = {
    'node' : [],
    'edge' : []
  }
  for path in graphData:
    data = path.split('@@')
    
    node = ( data[0], data[1] )
    edge = data[2]

    result['node'].append( node )
    result['edge'].append( edge )

  return result

# def getSimilarityGraph( signatureKey, graphData ):
#   signature = signature[signatureKey]

def getSimilarity( signatureKey, graphData ):
  signature = signature[signatureKey]

def getSignatureData( key ):
  with open( os.path.join( CONFIG_DIR, SINGATURE_JSON ) ) as json_file:
    json_data = json.load( json_file )
    result = json_data[ key ]

  return result

def createSignature( key, data ):
  signatureData = {};
  signatureData[key] = data
  with open('signature.json', 'a', encoding="utf-8") as make_file:
    json.dump( signatureData, make_file, ensure_ascii = False, indent = "\t" )
  
def main( argv ):
  signatureKey = argv[1]
  print( signatureKey ) 
  signatureData = getSignatureData( signatureKey)
  
  for( PATH, DIR, FILES ) in os.walk( "/home/miner/Desktop/node_circuit/heapData" ):
    for FILENAME in FILES:
      ext = os.path.splitext(FILENAME)[-1]
      if ext == '.json':
        print( "%s" % FILENAME )
        with open( os.path.join( PATH, FILENAME ) ) as json_file:
          json_data = json.load( json_file )
          workers = json_data.keys()

          for worker in workers:
            graphData = graphing(json_data[worker]['graph'])

            G1 = nx.DiGraph()
            G1.add_edges_from( graphData['node'] )

            G2 = nx.DiGraph()
            G2.add_edges_from( signatureData['node'] )

            print( nx.similarity.graph_edit_distance( G1, G2 ))


if __name__ == "__main__":
  main( sys.argv )
