#!/bin/bash

# Fix duplicate type annotations like :any:any and :number:number
find backend/src/controllers -name "*.ts" -type f -exec sed -i '' 's/:any:any/:any/g' {} \;
find backend/src/controllers -name "*.ts" -type f -exec sed -i '' 's/:number:number/:number/g' {} \;
find backend/src/controllers -name "*.ts" -type f -exec sed -i '' 's/:string:string/:string/g' {} \;

echo "Fixed duplicate type annotations"
