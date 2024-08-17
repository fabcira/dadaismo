var QUERY_A_DOC = 'query_a_doc'
var QUERY_CATALOGUES = 'query_the_catalogues'
var SAVED_QUERIES = 'saved_queries'
var RETRIEVE_DOCUMENTS = 'retrieve_documents'
let current_route = QUERY_A_DOC
let resultsAreAvailable = false;
let currentMessage = "";
let currentCondition = "";

function initChat() {
    const button = document.getElementById('send_button');
    if (button) button.onclick=sendMessageFromHTML

    const chatInput = document.getElementById('chat-input');
    // Add an event listener to handle the Enter key press
    if (chatInput) {
        chatInput.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault(); // Prevent the default action (new line)
                sendMessageFromHTML()
            }
        });
    }
    const textarea = document.getElementById('chat-input');
    if (textarea) {
        const defaultQuestion = "Descrivimi i doni froebelliani citando separatamente \n      l'informazione da ciascun catalogo. Sii preciso ed esaustivo"
        const placeholder = `Inserisci una domanda molto precisa e circostanziata. Per esempio:\n     '${defaultQuestion}\n Se vuoi inserire questa domanda di esempio, usa la freccia a destra.`
        textAreaDefaultBehaviourSet(textarea, defaultQuestion, placeholder)
    }
}


/**
 * it gets the filters from the query menu
 * @return string {string} using the format of conda
 *
 * Filter Argument Specifications
 * Basic Structure:
 *
 * The filter argument is usually a string.
 * It often follows a key-value pair structure with an operator that specifies the type of comparison (e.g., eq for equality).
 * Common Operators:
 *
 * eq(field, value): Equal to. Checks if the field is equal to the specified value.
 * neq(field, value): Not equal to. Checks if the field is not equal to the specified value.
 * gt(field, value): Greater than. Checks if the field is greater than the specified value.
 * lt(field, value): Less than. Checks if the field is less than the specified value.
 * gte(field, value): Greater than or equal to. Checks if the field is greater than or equal to the specified value.
 * lte(field, value): Less than or equal to. Checks if the field is less than or equal to the specified value.
 * in(field, [values]): In. Checks if the field is within the list of specified values.
 * not_in(field, [values]): Not in. Checks if the field is not within the list of specified values.
 * Logical Operators:
 *
 * and(filter1, filter2, ...): Logical AND. Combines multiple filters with a logical AND.
 * or(filter1, filter2, ...): Logical OR. Combines multiple filters with a logical OR.
 * not(filter): Logical NOT. Negates the specified filter.
 * Example Filters:
 *
 * eq("document_name", "1982_Paravia_fisica"): Checks if the document name is "1982_Paravia_fisica".
 * and(eq("author", "John Doe"), gte("year", 2000)): Checks if the author is "John Doe" and the year is greater than or equal to 2000.
 * or(in("status", ["published", "reviewed"]), eq("editor", "Jane Smith")): Checks if the status is either "published" or "reviewed", or if the editor is "Jane Smith".
 *
 * example:
 * {
 *     "query": "lingua",
 *     "filter": "eq(\"title\", \"1982 Paravia fisica\")"
 * }
 * the metadata for the catalogues is:
 * "1979_Paravia_sussidi audiovisivi.pdf": {
 *       "ext": ".pdf",
 *       "author": "tbd",
 *       "title": "Sussidi audiovisivi",
 *       "publisher": "Paravia",
 *       "year": "1979 - 1980"
 *   },
 */

function getFilterConditions() {
    currentCondition = document.getElementById('final-logical-formula').textContent
    return currentCondition;
}

function sendMessageFromHTML() {
    const chatInput = document.getElementById('chat-input');
    currentMessage = chatInput.value.trim();
    filter = getFilterConditions();
    sendMessage(current_route, currentMessage, filter).then(r => r);
    document.getElementById('save_button').style.display = 'block';
    document.getElementById('button-container').style.gridTemplateRows = 'auto auto';
    // hide the pdf in cvase it is showing
    let doc_viewer = document.getElementById("limited_pdf_viewer_container");
    doc_viewer.style.display='none';

}

async function init_async() {
    resultsAreAvailable = false;
    const id_response = await fetch('/get_user_id');
    const user_and_session_id = await id_response.json();
    window.user_id = user_and_session_id['user_id']
    window.session_id = user_and_session_id['session_id']

    // document.getElementById('query_a_doc').addEventListener('click',
    //     function (event) {
    //         event.preventDefault();
    //         displayTab('front-page', QUERY_A_DOC);
    //     });
    //
    // document.getElementById('query_the_catalogue').addEventListener('click',
    //     function (event) {
    //         event.preventDefault();
    //         displayTab('document_retriever_container', QUERY_CATALOGUES);
    //         // document.getElementById('viewer_container').style.display = 'none';
    //         document.getElementById('limited_pdf_viewer_container').style.display = 'block';
    //     });
    document.getElementById('list_saved_queries').addEventListener('click',
        function (event) {
            event.preventDefault();
            displayTab('saved_queries_div', SAVED_QUERIES);
            let gra= document.getElementById('document_retriever_container');
            if (gra) {
                // without important it does not work
                gra.style.setProperty('display', 'none', 'important');
                console.log('Display style set to '+ gra.style.display); // Confirm the style change

            }
            fetchSavedQueries();
        });

    initChat();
    try{
        await fetchPdfs();
    } catch (e){
        
    }

}function hideSavedSearches(){
    const navItem= document.getElementById('list_saved_queries')
    if (navItem)
        navItem.style.display='none'
}

function showSavedSearches(){
    const navItem= document.getElementById('list_saved_queries')
    if (navItem)
        navItem.style.display='block'
}

/**
 * it hides all panels except the one in input - used to switch tab
 * @param tab
 */
function displayTab(tab, route) {
    if (document.getElementById('retrieve_documents'))
        document.getElementById('retrieve_documents').style.display = 'none';
    if (document.getElementById('front-page'))
        document.getElementById('front-page').style.display = 'none';
    // document.getElementById('chat_and_viewer_container').style.display = 'none';
    if (document.getElementById('document_retriever_container'))
        document.getElementById('document_retriever_container').style.display = 'none';
    if (document.getElementById('saved_queries_div'))
        document.getElementById('saved_queries_div').style.display = 'none';
    // document.getElementById('viewer_container').style.display = 'none';
    if (document.getElementById('limited_pdf_viewer_container'))
        document.getElementById('limited_pdf_viewer_container').style.display = 'none';

    if (document.getElementById(tab))
        document.getElementById(tab).style.display = 'block';
    current_route= route;
}

async function regenerate_session_id() {
    const id_response = await fetch('/get_user_id');
    const user_and_session_id = await id_response.json();
    window.session_id = user_and_session_id['session_id']
}

function insertQuestion(question){
    let stringa = "";
    switch (question) {
        case "frobelliani":
            stringa = "Descrivimi i doni froebelliani citando separatamente l'informazione da ciascun catalogo. Sii preciso ed esaustivo";
            break;
        case "alfabetiere":
            stringa = "Descrivimi l'alfabetiere con particolare focus sugli inventori dei diversi oggetti. Cita separatamente l'informazione da ciascun catalogo. Sii preciso ed esaustivo"
            break;
    }
    document.getElementById('chat-input').value = stringa;

}

/**
 * it opens a prompt asking to add a note ans then calls saveDocumentsIntoSession with the note
 */
function promptForNote() {
            const note = prompt("Would you like to add a note?");
            saveDocumentsIntoSession(note).then(r => null);
        }

