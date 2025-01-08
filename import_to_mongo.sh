for file in ~/Downloads/Final_Objects_CSVs/*.csv; do
    collection_name="oggetti_didattici"
    mongoimport --db oggetti_didattici --collection "$collection_name" --type csv --headerline --file "$file"
done