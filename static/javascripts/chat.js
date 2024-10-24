let errorNotified = false;
let docList = []
let tablesContainer;
let linkList;
let currentSelection = 'relevance'
let currentResponse = "";
let currentFilter = "";

function formatMetadata(metadata) {
    let atring = // metadata['author']+" " +
        metadata['title']+ ", " +
        metadata['publisher']+ ", " + metadata['year']
    return atring;
}

/**
 * for each snippets it puts a link to the exact page
 * @param doc the current document
 * @param snippetList the list of snippets for this document
 * @return {string} teh list to include in teh table
 */
function formatPageContent(doc, snippetList) {
    let finalString = "";
    let length = snippetList.length;
    if (doc['metadata']['page_number'].length !== length) {
        length = Math.min(length, doc['metadata']['page_number'].length)
        console.log(`different length between snippets (${snippetList.length}) and page numbers (${doc['metadata']['page_number'].length}_ `)
    }
    for (let index=0; index<length; index++){
        let pageNumber = doc['metadata']['page_number'][index];
        finalString+=  `<p><a href='#' class='link_button' onclick='openPDFPopup(event, "${doc['metadata']['document_name']}${doc['metadata']['ext']}", ${pageNumber})'>(Page: ${pageNumber})</a>  ${snippetList[index]}</p>`;
        // finalString+=  `<p><a href='#' class='link_button' onclick='openPDFPopup(event, "${doc['metadata']['document_name']}${doc['metadata']['ext']}", ${pageNumber})'>(Page: ${pageNumber})</a>  ${snippetList[index]}</p>`;
        // finalString+= `<p><button class='link_button' onclick='openPDFPopup("${doc['metadata']['document_name']}${doc['metadata']['ext']}", ${pageNumber})'>(Page: ${pageNumber})</button>`
        // finalString+= snippetList[index]+"</p>";
    }
    return finalString
}

/**
 * it turns the text containing tags like <snippet>...</snippet> into a list of strings each representing
 * a snippet
 * @param text the text to split
 * @return a list of strings
 */
function extractSnippets(text) {
    const regex = /<snippet>([\s\S]*?)<\/snippet>/g;

    let snippets = [];
    let match;

    // Use regex to find all matches
    while ((match = regex.exec(text)) !== null) {
        // Add the matched content (without the tags) to the snippets array
        snippets.push(match[1].trim());
    }
    return snippets;
}

// function displayDocList(tablesContainer, docList) {
//
//     docList.forEach((doc, index) => {
//         // Create a new row
//         const newRow = document.createElement('tr');
//         // Create a new cell
//         const newCell = document.createElement('td');
//         // Create the container div
//         const containerDiv = document.createElement('div');
//         containerDiv.className = 'container';
//         // Create the two inner divs
//         const div1 = document.createElement('div');
//         let metadata = doc['metadata'];
//         div1.textContent = formatMetadata(metadata);
//         const div2 = document.createElement('div');
//         div2.innerHTML = formatPageContent(doc['page_content']);
//         // Append the inner divs to the container
//         containerDiv.appendChild(div1);
//         containerDiv.appendChild(div2);
//         // Append the container to the cell
//         newCell.appendChild(containerDiv);
//         // Append the cell to the row
//         newRow.appendChild(newCell);
//         // Append the row to the table
//         tablesContainer.appendChild(newRow);
//     })
// }

/**
 * it generates a new list from the page number list without the duplicates
 */

function removeDuplicatesFromPageNumbers(doc) {
    if (doc.metadata && Array.isArray(doc.metadata.page_number)) {
        // Create a copy of the original list, remove duplicates, and return the new list
        return [...new Set(doc.metadata.page_number)];
    }
    // If page_number is not an array or doesn't exist, return an empty array
    return [];
}

/**
 * it generates the list of links for the entire document without duplicates)
 * @param doc
 * @return {string}
 */
function formatPageLink(doc) {
    let pageNumberList = removeDuplicatesFromPageNumbers(doc);
    let finalLinkSet = ""
    for (let page_number of pageNumberList)
        finalLinkSet+=`<a href='#' class='link_button' onclick='openPDFPopup(event, "${doc['metadata']['document_name']}${doc['metadata']['ext']}", ${page_number})'>(Page: ${page_number})</a>`;
        // finalLinkSet+=`<button class='link_button' onclick='openPDFPopup("${doc['metadata']['document_name']}${doc['metadata']['ext']}", ${page_number})'>(Page: ${page_number})</button>`;
    return finalLinkSet
}

// }


// Function to open the PDF in a popup
// VERSION THAT OPENS ANOTHER HTML FILE BY PASSING THE PARAMS
// function openPDFPopup(event, docName, pageNum) {
//     event.preventDefault();  // Prevent the default link behavior
//     const url = `popup?pdfDoc=${encodeURIComponent(docName)}&pageNum=${pageNum}`;
//     window.open(url, 'PDF Viewer', 'width=800,height=600');
// }

function openPDFPopup(event, docName, pageNum) {
    // switchToTab('pdf-viewer-tab')
    // resizePDFViewer();
    event.preventDefault()
    openPDFAtPage(docName, pageNum);

}
function sortDocList(currentSelection, docList) {
    if (currentSelection === 'relevance') {
        docList.sort((a, b) => {
            const relA = a.metadata['relevance_counter'] || 1000;
            const relB = b.metadata['relevance_counter'] || 1000;
            return relA - relB;
        });
    } else {
        docList.sort((a, b) => {
            const fieldA = a.metadata[currentSelection] || '';
            const fieldB = b.metadata[currentSelection] || '';
            // Assuming that fieldA and fieldB are numbers or can be compared numerically
            if (typeof fieldA === 'number' && typeof fieldB === 'number') {
                return fieldA - fieldB;  // Numeric comparison
            } else {
                return String(fieldA).localeCompare(String(fieldB));  // Fallback to string comparison
            }
        });
    }
    return docList;
}

function displayDocumentsBy(value){
    currentSelection = value;
    displayDocList(docList)
}

function displayDocList(docList) {
    let cntnr= document.getElementById('summary_container')
    if (cntnr)
        cntnr.style.display= 'block';
    let lwrpnl= document.getElementById('lower_panel')
    if (lwrpnl)
        lwrpnl.style.display= 'block';
    let divider = document.getElementById('separator');
    if (divider)
        divider.style.display= 'block';

    createDocumentDisplayElements()
    tablesContainer.innerHTML = '';
    docList = sortDocList(currentSelection, docList)
    linkList.innerHTML= "";
    docList.forEach((doc, index) => {
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.href = `#doc-${index}`;
        link.textContent = formatMetadata(doc['metadata']);
        listItem.appendChild(link);
        linkList.appendChild(listItem);
    });
    drawLine(tablesContainer);
    docList.forEach((doc, index) => {
        let snippetList = extractSnippets(doc['page_content']);
        // add the title
        let docDiv = document.createElement('div');
        docDiv.classList.add('mt-2');
        tablesContainer.appendChild(docDiv);
        drawLine(docDiv);
        docDiv.innerHTML = `<b><a id="doc-${index}">${formatMetadata(doc['metadata'])}</a></b>`
        // docDiv.innerHTML += `<p>${formatPageLink(doc)}</p>`;
        drawEmptyLine(docDiv);
        docDiv.innerHTML += `<p>${formatPageContent(doc, snippetList)}</p>    `;
        let line = drawLine(docDiv);
        line.classList.add('mt-5');
    });
}

/**
 * it draws a horizontal line in teh container (a div)
 * @param container
 */
function drawLine(container){
    // Create an hr element
        const hr = document.createElement('hr');
        // Optionally add a class for styling
        hr.classList.add('line');
        // Append the hr to the container
        container.appendChild(hr);
        return hr
}
function drawEmptyLine(container){
    // Create an hr element
        const hr = document.createElement('hr');
        // Optionally add a class for styling
        hr.classList.add('empty_line');
        // Append the hr to the container
        container.appendChild(hr);
}
/**
 * it creates the HTML elements needed for displaying the document list
 */
function createDocumentDisplayElements() {
    const documentsContainer = document.getElementById('documents_container');
    const summeryContainer = document.getElementById('summary_container_inner');


    // Create a list of links
    if (!linkList) {
        linkList = document.createElement('ul');
        summeryContainer.appendChild(linkList);
    }

    // Create the table
    if (!tablesContainer) {
        tablesContainer = document.createElement('div');
        tablesContainer.className = "table";
        // Limit the height and introduce scrollbars
        tablesContainer.style.maxHeight = `${window.innerHeight}px`;
        tablesContainer.style.overflowY = 'scroll';
        tablesContainer.style.display = 'block';
        documentsContainer.appendChild(tablesContainer);
    }
}

function showResultsPanel(showAlsoResponse) {
    // show the panels
    document.getElementById('lower_panel').style.display = 'block';
    document.getElementById('summary_container').style.display = 'block';
    document.getElementById('generated_answer_div').style.display = (showAlsoResponse)?'block':'none';
}

function hideResultsPanel() {
    // show the panels
    if (document.getElementById('lower_panel'))
        document.getElementById('lower_panel').style.display = 'none';
    if (document.getElementById('summary_container'))
        document.getElementById('summary_container').style.display = 'none';
}

/**
 * given the system settings (if the generated answer is expected or not, it will tell teh system if to ask the server
 * to generate the answer
 * @return {boolean}
 */
function getGenerateAnswer() {
    let generate_answer = false;
    let generate_answer_id = document.getElementById('generated_answer_div')
    if (generate_answer_id)
        generate_answer = generate_answer_id.style.display === 'block'
    return generate_answer
}

async function sendMessage(route, message, filter) {
    if (message === '') return;
    hideResultsPanel();
    let generate_answer = getGenerateAnswer()
    let data = {
        // raw_text: window.raw_text,
        user_id: window.user_id,
        session_id: window.session_id,
        question: message,
        filter: filter,
        generate_answer: generate_answer
    };
    checkActiveTab()
    if (route === QUERY_A_DOC) {
        if (window.getInputFromPdf)
            data.raw_text = window.raw_pdf_text;
        else
            data.raw_text = document.getElementById('chat-input').value
    } else {
        data.raw_text = "";
    }

    if (route === QUERY_A_DOC && (!data.raw_text || data.raw_text === ""))
        alert("Select some PDF pages or insert some text before chatting")
    else {
        // Send the prompt to the server to start the chat
        fetch('/start_chat_on_PDF', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).then(async response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }


            data = {
                user_id: window.user_id,
                session_id: window.session_id,
                filter: getFilterConditions(),
                generate_answer: generate_answer
            };
            errorNotified = false
            const params = new URLSearchParams(data);
            if (route === RETRIEVE_DOCUMENTS) {
                showSpinner()

                let path = '/' + route + '?' + params.toString();
                const response = await fetch(path, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }

                const returned_value = await response.json();
                let responseDiv = document.getElementById('search_engine_response')
                responseDiv.innerText = returned_value['answer'];
                docList = returned_value['docs']
                if (!tablesContainer)
                    tablesContainer = document.querySelector('#resultsTable tbody');
                tablesContainer.innerHTML = '';
                displayDocList(docList);
            } else {
                // Append user message to response
                const remoteMessageDiv = document.getElementById('response');
                remoteMessageDiv.innerHTML='';

                // const chatInput = document.getElementById('chat-input');

                route = "/" + route + '?' + params.toString()
                docList = []
                showSpinner()

                let spinnerVisible = true;
                // Start the EventSource to listen for streamed responses
                const eventSource = new EventSource(route);

                eventSource.addEventListener('error', function(event) {
                    try {
                        // Check the readyState property to understand the connection status
                        switch (eventSource.readyState) {
                            case EventSource.CONNECTING:
                                console.log('EventSource is reconnecting (readyState = 0)...');
                                break;
                            case EventSource.CLOSED:
                                console.log('EventSource connection was closed (readyState = 2).');
                                break;
                            default:
                                const errorData = JSON.parse(event.data);
                                // console.error('Error message:', errorData.error);
                                alert("Errore del sistema remoto: " + errorData.error + "\n\n prova a riscrivere un poco la domanda ")
                                hideSpinner()
                                spinnerVisible = false;
                                errorNotified = true;
                        }
                    }catch (e) {
                        alert("Errore del sistema remoto: " + JSON.stringify(e) + "\n\n  ")
                    }
                });

                eventSource.onmessage = function (event) {
                    let chunk = event.data;
                    try {
                        chunk = JSON.parse(chunk);
                        if (chunk['documents']) {
                            showResultsPanel(generate_answer);
                            docList = chunk['documents'];
                            displayDocList(docList);
                        } else if (chunk['answer'] && chunk['answer'] !== "") {

                            // Use insertAdjacentHTML to directly insert the HTML
                            remoteMessageDiv.insertAdjacentHTML('beforeend', chunk['answer']);
                            remoteMessageDiv.scrollTop = remoteMessageDiv.scrollHeight;
                        }
                    } catch (error) {
                        // Use insertAdjacentHTML to directly insert the HTML
                        remoteMessageDiv.insertAdjacentHTML('beforeend', chunk['answer']);
                        remoteMessageDiv.scrollTop = remoteMessageDiv.scrollHeight;
                        hideSpinner()
                        spinnerVisible = false;

                    }

                };

                // called also when the stream is ended
                eventSource.onerror = function (event) {
                    // console.error('Error occurred:', event.type);
                    eventSource.close();
                    // removed the following because it appears that the interaction is always ended with an error
                    // without exaplantion
                    // @todo check why
                    // if (!errorNotified)
                    //     alert("Errore del sistema remoto: prova a riscrivere un poco la domanda " + JSON.stringify(event))
                    // else
                        errorNotified = false;
                    // let tablesContainer = document.createElement('table');
                    // tablesContainer.className= "table";
                    // tablesContainer.innerHTML = '';
                    // remoteMessageDiv.appendChild(tablesContainer)
                    // displayDocList(tablesContainer, docList);
                    currentResponse = remoteMessageDiv.innerText;
                    hideSpinner();
                    spinnerVisible = false;

                };
                eventSource.onopen = function () {
                    console.log('Connection to server opened.');
                };
                // Optional: handle the stream ending event
                eventSource.onend = function (event) {
                    console.log('Stream ended:', event);
                    currentResponse = remoteMessageDiv.innerText
                    eventSource.close();
                    hideSpinner();
                    spinnerVisible = false;

                };
            }
        }).catch(error => {
            console.error('Fetch error:', error);
        });
    }
}

// Function to check which tab is active within a specific container
function checkActiveTab() {
    const tabNavigator = document.getElementById('navbarNav');
    const tabs = tabNavigator.getElementsByTagName('a');
    let activeTabId = '';

    for (let tab of tabs) {
        if (tab.classList.contains('active')) {
            activeTabId = tab.id;
            break;
        }
    }

    console.log(`Active Tab ID: ${activeTabId}`);
    // Add your logic here based on the active tab ID
    if (activeTabId === 'pdf-tab') {
        console.log('pdf-tab is active');
        window.getInputFromPdf = true;
    } else if (activeTabId === 'other-tab') {
        console.log('Other tab is active');
        window.getInputFromPdf = false;
    }
}

/**
 * Function to switch to a specific tab
 * @param tabId e.g. 'limited_pdf_viewer_container'
 */
function switchToTab(tabId) {
    // Deactivate all tab links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Deactivate all tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('show', 'active');
    });

    // Activate the selected tab link
    document.getElementById(tabId).classList.add('active');

    // Activate the corresponding tab pane
    document.getElementById(tabId).classList.add('show', 'active');
}

        // Function to show the spinner
function showSpinner() {
    const button = document.getElementById('send_button');
    button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
    button.disabled = true; // Optionally disable the button to prevent multiple clicks
}

        // Function to hide the spinner
function hideSpinner() {
    const button = document.getElementById('send_button');
    button.innerHTML = 'Send';
    button.disabled = false; // Re-enable the button
    spinnerVisible = false;
}


/**
 * it sets the properties of the dialogue chat input text area. For example, it assigns the placeholder and if the right
 * arrow is typed when the area is empty, it inserts th default Question
 * @param textarea
 * @param defaultQuestion
 * @param placeholder
 */
function textAreaDefaultBehaviourSet(textarea, defaultQuestion, placeholder){
    if (!textarea) return;
    // textarea.placeholder = placeholder
    // Insert placeholder text on right arrow key press if textarea is empty
        textarea.addEventListener('keydown', function(event) {
            if (event.key === 'ArrowRight' && textarea.value === '') {
                // Replace multiple spaces with a single space
                let cleaned = defaultQuestion.replace(/\s\s+/g, ' ');
                // Remove newlines
                defaultQuestion = cleaned.replace(/[\r\n]+/g, '');
                textarea.value = defaultQuestion;
                // Move the cursor to the end of the text
                setTimeout(() => {
                    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
                }, 0);
                event.preventDefault();
            }
        });

        // Clear the placeholder text on focus if it matches the placeholder
        // textarea.addEventListener('focus', function() {
        //     if (textarea.value === placeholder) {
        //         textarea.value = '';
        //         textarea.classList.add('placeholder');
        //     }
        // });

        // Restore the placeholder text on blur if textarea is empty
        // textarea.addEventListener('blur', function() {
        //     if (textarea.value === '') {
        //         textarea.value = placeholder;
        //         textarea.classList.remove('placeholder');
        //     }
        // });
}

function insertExample(){
    const textarea = document.getElementById('chat-input');
    const defaultQuestion="Descrivimi l'Alfabetiere Carli citando separatamente l'informazione da ciascun catalogo. Sii preciso ed esaustivo. "
    textarea.value = defaultQuestion
}

function insertResponse(response){
    let responseDiv = document.getElementById('response')
    responseDiv.innerText = response;
}

function insertFilter(filter){
    let filterDiv= document.getElementById('final-logical-formula')
    filterDiv.innerText = filter;
}


function insertQuery(query){
    const chatInput = document.getElementById('chat-input');
    chatInput.value = query;
}