
import networkx as nx
import sys
import re
import os
import json

BASE_DIR = os.path.dirname( os.path.abspath( __file__ ) )

DATA_DIR_NAME = """WORKER"""
DATA_DIR_PATH = os.path.join( BASE_DIR, DATA_DIR_NAME )

RESULT_DIR_NAME = "result"
RESULT_DIR_PATH = os.path.join( BASE_DIR, RESULT_DIR_NAME )


verbose = True

def pathlist(path):
    path1 = re.sub('\[NODE.*?\]', '', path, flags=re.MULTILINE)
    path2 = re.sub(' -- .*? ->', '', path1, flags=re.MULTILINE)
    path3 = re.sub('\(object elements\).*?Object ', '', path2)
    path4 = re.sub('system / Context', 'system/Context', path3)

    path_list = re.split(' ', path4)

    graph = []
    idx=path_list.index("Window")
    for i in range(1, idx):
        edge = path_list[i], path_list[i + 1]
        graph.append(edge)
    return graph


def similaritycheck(a,b):
    g1 = nx.DiGraph()
    g1.add_edges_from(a)
    g2 = nx.DiGraph()
    g2.add_edges_from(b)
    return nx.similarity.graph_edit_distance(g1, g2)

def getSignature() :
    with open( os.path.join(BASE_DIR, 'miningSignature.json'),'r',encoding='UTF-8') as json_file1:
        json_data1=json.load(json_file1)
        return json_data1

def init():
    if not os.path.isdir(RESULT_DIR_PATH):
        os.mkdir( RESULT_DIR_PATH )


def main():
    init()
    fileList = {}
    for (path, dir, files) in os.walk(DATA_DIR_PATH):
        for file in files:
            ext = os.path.splitext(file)[-1]
            if ext == '.txt':
                domain = path.split("/")[-1]
                fileList[domain] = os.path.join(path, file)

    signatureData = getSignature()
    for service in signatureData.keys():
        if verbose : i = 0
        print(service)
        result_json = {}
        for domain in fileList.keys():
            if verbose : print(domain)
            path = fileList[domain]
            with open(path, encoding='UTF-8') as  json_file2:
                json_data2 = json.load(json_file2)
                result = {
                    "INDEX": [],
                    "SIM": [],
                    "PATH": []
                }
                for workerNumber in json_data2['graph'].keys():
                    graphPath = json_data2['graph'][workerNumber]['path']
                    result["INDEX"].append(workerNumber)
                    result["PATH"].append(graphPath)
                    path_result = pathlist(graphPath)
                    worker_path = pathlist(signatureData[service]["path"])
                    if verbose : print("bef simcheck " + str(i))
                    result["SIM"].append(similaritycheck(path_result, worker_path))
                    if verbose : print("aft simcheck "+ str(i))
                    if verbose : i += 1

                result_json[domain]=result
        print("before file write")
        with open(os.path.join( RESULT_DIR_PATH, service + '.json'), 'w', encoding="utf-8")as make_file:
            json.dump(result_json,make_file,ensure_ascii=False,indent="\t")
        print("after file write")



if __name__ == '__main__':
    main();