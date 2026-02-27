#!/bin/bash

# Fix common TypeScript errors in controllers
find backend/src/controllers -name "*.ts" -type f -exec sed -i '' 's/\.map(async (\([^)]*\)) => {/\.map(async (\1: any) => {/g' {} \;
find backend/src/controllers -name "*.ts" -type f -exec sed -i '' 's/\.filter((\([^)]*\)) =>/\.filter((\1: any) =>/g' {} \;
find backend/src/controllers -name "*.ts" -type f -exec sed -i '' 's/\.reduce((\([^)]*\), \([^)]*\)) =>/\.reduce((\1: number, \2: any) =>/g' {} \;
find backend/src/controllers -name "*.ts" -type f -exec sed -i '' 's/\.find((\([^)]*\)) =>/\.find((\1: any) =>/g' {} \;
find backend/src/controllers -name "*.ts" -type f -exec sed -i '' 's/\.forEach((\([^)]*\)) =>/\.forEach((\1: any) =>/g' {} \;

echo "Fixed common TypeScript errors"
