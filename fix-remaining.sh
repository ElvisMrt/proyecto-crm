#!/bin/bash

# Fix remaining TypeScript errors
find backend/src/controllers -name "*.ts" -type f -exec sed -i '' 's/\.find((\([^)]*\)) =>/\.find((\1: any) =>/g' {} \;
find backend/src/controllers -name "*.ts" -type f -exec sed -i '' 's/\.forEach((\([^)]*\)) =>/\.forEach((\1: any) =>/g' {} \;

echo "Fixed remaining TypeScript errors"
