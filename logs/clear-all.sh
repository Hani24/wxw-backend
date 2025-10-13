#!/bin/bash

LOGS=$( dirname "${BASH_SOURCE[0]}" );

for type in $( ls $LOGS ); do 

  if [[ -d ${LOGS}/${type} ]]; then
    echo ${LOGS}/${type};
    rm -f ${LOGS}/${type}/*.log
  fi

done

echo "Done ...";
