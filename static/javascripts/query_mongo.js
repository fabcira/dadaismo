function ensurePDFExtension(filename) {
    // Check if the string ends with ".pdf" (case-insensitive)
    if (!filename.toLowerCase().endsWith(".pdf")) {
        filename += ".pdf";
    }
    return filename;
}


async function submit_mongo_query() {
    const form = document.getElementById('queryForm');
    const formData = new FormData(form);

    const queryData = {};
    formData.forEach((value, key) => {
        queryData[key] = value;
    });

    // Check if all fields are empty
    let allFieldsEmpty = true;
    formData.forEach((value) => {
        if (value.trim() !== "") {
            allFieldsEmpty = false;
        }
    });

    if (allFieldsEmpty) {
        // Alert the user if all fields are empty
        alert("Please fill at least one field before submitting.");
        return false; // Prevent the submit action
    }
    try {
                const response = await axios.post('/query_mongo', queryData);

                // Handle and display the results
                const resultsContainer = document.getElementById('results');
                const results = response.data.results;

                if (results && results.length > 0) {
                    // Clear the results container
                    resultsContainer.innerHTML = "";

                    // Iterate over each document and display only the specified fields
                    results.forEach(doc => {
                        const docElement = document.createElement('div');
                        docElement.classList.add('mb-2', 'p-2', 'border', 'rounded');
                        docElement.innerHTML = `
                            <p><strong>Oggetto:</strong> ${doc.oggetto || "N/A"}</p>
                            <p><strong>Descrizione:</strong> ${doc.descrizione || "N/A"}</p>
                            <p><strong>Premi o Raccomandazioni:</strong> ${doc.premi_o_raccomandazioni || "N/A"}</p>
                            <p><strong>Pagina:</strong> ${doc.pagina || "N/A"}</p>
                            <p><strong>Documento:</strong> <a href="#" onclick="openPDFAtPage('${ensurePDFExtension(doc.documento)}', ${doc.pagina || 1})">${doc.documento || "N/A"}</a></p>
                        `;
                        resultsContainer.appendChild(docElement);
                    });
                } else {
                    resultsContainer.innerHTML = "<p>No documents found matching the query.</p>";
                }
            } catch (error) {
                console.error("Error fetching data:", error);

                // Display error message to the user
                const resultsContainer = document.getElementById('results');
                resultsContainer.innerHTML = `<p class="text-danger">An error occurred: ${error.message}</p>`;
            }
}