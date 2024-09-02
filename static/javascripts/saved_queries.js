async function fetchSavedQueries() {
    const response = await fetch('/get-sessions');

    if (response.ok) {
        const data = await response.json();
        displaySessions(data.sessions);
    } else {
        console.error('Error retrieving sessions');
        alert('Error retrieving sessions');
    }
}

// function getLinkFromSession(session) {
//     return `question: <span style="color: blue;">${session.question}</span>. &nbsp;  Associated Note: ${session.note}`;
// }

function getLinkFromSession(session) {
            return `<div class="session-column">Question: <span style="color: blue;">${session.question}</span></div>
                    <div class="session-filter">Filter: ${session.filter}</div>
                    <div class="session-column">Note: ${session.note}</div>\``;
        }
function displaySessions(sessions) {
    const container = document.getElementById('saved_queries_content');
    container.innerHTML = ''; // Clear previous sessions

    if (!sessions || sessions.length === 0) {
        container.innerHTML = '<p>No sessions found</p>';
        return;
    }

    const ul = document.createElement('ul');
    ul.className = 'session-list';

   sessions.forEach(session => {
                const li = document.createElement('li');
                li.className = 'list-group-item session-item';

                const link = document.createElement('div');
                link.className = 'd-flex flex-grow-1';
                link.innerHTML = getLinkFromSession(session);

                const button = document.createElement('button');
                button.className = 'btn btn-custom btn-sm session-button';
                button.textContent = 'Restore Session';
                button.onclick = () => getSession(session);

                li.appendChild(link);
                li.appendChild(button);
                ul.appendChild(li);
            });

    container.appendChild(ul);
}

async function getSession(session = null) {
    if (!session) {
        alert('Please enter a session ID');
        return;
    }

    const response = await fetch(`/get-session/${session.session_id}`);

    if (response.ok) {
        const data = await response.json();
        displayDocumentsAndQuery(data);
    } else {
        console.log('Error retrieving session');
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
    }
}

/**
 * it receives teh saved session and it shows the content
 * @param response has  form like {
 *                                 'question': currentMessage,
 *                                 'response': currentResponse,
 *                                 'documents_list': docList
 *                                 }
 */
function displayDocumentsAndQuery(response){
    displayTab('document_retriever_container', QUERY_CATALOGUES, response['response']);
    showResultsPanel();
    insertQuery(response['question'])
    insertResponse(response['response'])
    insertFilter(response['filter'])

    // switchToTab('query_the_catalogue');
    docList = response['documents_list'];
    displayDocList(docList);
}

/**
 * it saves the current response in a format like
 *                                  {
 *                                 'question': currentMessage,
 *                                 'response': currentResponse,
 *                                 'documents_list': docList
 *                                 }
 * @return {Promise<void>}
 */
async function saveDocumentsIntoSession(note) {
    if (docList) {
        const response = await fetch(`/save-documents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                {
                    'question': currentMessage,
                    'response': currentResponse,
                    'filter': currentCondition,
                    'documents_list': docList,
                    'note': note
                }
            )
        });

        if (response.ok) {
            console.log('Documents saved successfully');
        } else {
            console.log('Error saving documents');
        }
    } else {
        alert('There are no resultS to save')
    }
}