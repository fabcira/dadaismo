function init_async_multiple(){
    current_route= QUERY_CATALOGUES;
    showSavedSearches();
    init_async().then(r => {
        let div= document.getElementById('document_retriever_container');
        if (div)
            div.style.display='block';
    })

}