#!/bin/bash
# 提交代码
current_time=$(date +"%y%m%d%S")
echo "version.$current_time" 
git add .
git commit -m 'update.'$current_time
git push

# 提交到 github
git push -f https://${ATXPUSH}@github.com/ATXDB/2f.git

