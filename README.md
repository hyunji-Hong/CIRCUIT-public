# CIRCUIT-public
CIRCUIT is a precise approach for detecting cryptojacking websites.
Principles and experimental results are discussed in [our paper](https://ieeexplore.ieee.org/document/9878335), which was published at IEEE ACCESS 2022.

※ Exception handling parts may be insufficient due to many modifications in the code refactoring process; we will improve them.

## How to use
### Requirements

#### Software
* ***Linux***: CIRCUIT is designed to work on any of the operating systems. However, currently, this repository only focuses on the Linux environment.
* ***Git***
* ***Python 3***
* ***Others***  
  * How to install prerequisite packages:
    ```
    ./npm_requirements.sh
    ```


#### Hardware
* We recommend 24 GB RAM.
##

### Running CIRCUIT

#### 1. Signature generation

 * To extract heap signatures for each site, execute [eval.sh](https://github.com/hyunji-Hong/CIRCUIT-public/blob/main/src/eval.sh)

 ```
 ./eval.sh
 ```
*  To extract mining signatures for mining sites, execute [signatureGenerator.js](https://github.com/hyunji-Hong/CIRCUIT-public/blob/main/src/signatureGenerator.js) 

 ```
node signatureGenerator.js miningsites_url
 ```

  ※ We provide sample signatures for mining sites: [miningSignature.json](https://github.com/hyunji-Hong/CIRCUIT-public/blob/main/src/miningSignature.json) 

#### 2. Detection

 * To detect mining sites among the general sites, execute [getResult.py](https://github.com/hyunji-Hong/CIRCUIT-public/blob/main/src/getResult.py)



### About
This repository is authored and maintained by Hyunji Hong.
For reporting bugs, you can submit an issue to [the GitHub repository](https://github.com/hyunji-Hong/CIRCUIT-public/) or send me an email (<hyunji_hong@korea.ac.kr>).

