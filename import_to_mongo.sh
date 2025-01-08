for file in  /home/laurentiu_matteo/vdc1/home/llm-project/fabcira-env/ICOS/Catalogues\ Client/Final_Objects_CSVs/*.csv; do
    collection_name="oggetti_didattici"
    mongoimport --port 27019 --username admin --password password --authenticationDatabase admin  --db oggetti_didattici --collection "$collection_name" --type csv --headerline --file "$file"
done
