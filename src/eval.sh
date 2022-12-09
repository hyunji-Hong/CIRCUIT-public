#! /bin/bash
# 윗 줄은 이 프로그램은 bash를 기반으로 실행된다는 뜻입니다.

# 실행된 쉘 스크립트의 절대 경로를 가져옵니다.
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
DATALIST="$BASEDIR/TOPSITES.txt"

cat $DATALIST | while read line
do
	node temp2.js $line
done

