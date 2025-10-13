#!/bin/bash

OUT='routes-tree.list';
tree -d ./src/routes > $OUT;
echo "done: ${OUT}";
