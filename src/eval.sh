#! /bin/bash.
SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do
  TARGET="$(readlink "$SOURCE")"
  if [[ $SOURCE == /* ]]; then
    SOURCE="$TARGET"
  else
    DIR="$( dirname "$SOURCE" )"
    SOURCE="$DIR/$TARGET"
  fi
done
DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"

BASEDIR=$DIR
DATALIST="$BASEDIR/top_site/TOPSITES_10K.txt"

cat $DATALIST | while read line
do
	node circuit.js $line
done