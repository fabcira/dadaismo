function retrieveDocuments (event) {
    if (event)
        event.preventDefault();
    let chatInput = document.getElementById('question');
    let question = chatInput.value.trim();
     chatInput.value = '';
    sendMessage(RETRIEVE_DOCUMENTS, question).then(r => r)
}
