#!/bin/bash

# Fix syntax errors created by previous script
find backend/src/controllers -name "*.ts" -type f -exec sed -i '' 's/: any: any/: any/g' {} \;
find backend/src/controllers -name "*.ts" -type f -exec sed -i '' 's/: number: number/: number/g' {} \;

echo "Fixed syntax errors"
