/**
 * if the filename does not have a ".pdf" extension, it adds it
 * @param {*} filename
 * @returns the modified filename
 */
function ensurePDFExtension(filename) {
  // Check if the string ends with ".pdf" (case-insensitive)
  if (!filename.toLowerCase().endsWith(".pdf")) {
    filename += ".pdf";
  }
  return filename;
}

/**
 * it fills the values of the select  with id "documento" by fetching the names of the
 * files from teh server
 */
async function fetchPdfs_for_mongo() {
  const response = await fetch("/pdfs");
  const pdfs = await response.json();

  const documentoSelect = document.getElementById("documento");
  documentoSelect.innerHTML = ""; // Clear any existing options

  // Add a placeholder option
  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.innerText = "Select a PDF";
  placeholderOption.disabled = true;
  placeholderOption.selected = true;
  documentoSelect.appendChild(placeholderOption);

  // Populate the select field with PDF options
  pdfs.forEach((pdf) => {
    const option = document.createElement("option");
    option.value = pdf;
    option.innerText = pdf;
    documentoSelect.appendChild(option);
  });

  // Set the value of the field based on user selection
  documentoSelect.onchange = () => {
    const selectedPdf = documentoSelect.value;
    console.log(`Selected PDF: ${selectedPdf}`);
  };
}

/**
 *
 * it writes the resulta of the axios call into the field with id "results"
 * @param results: the results of the axios query, i.e. a list of database records with fields:
 * oggetto, descrizione, premi_o_raccomandazioni, pagina, documento
 */
function writeResults(results) {
  // Handle and display the results
  const resultsContainer = document.getElementById("results");
  results = results.data.results;

  if (results && results.length > 0) {
    // Clear the results container
    resultsContainer.innerHTML = "";

    // Iterate over each document and display only the specified fields
    results.forEach((doc) => {
      const docElement = document.createElement("div");
      docElement.classList.add("mb-2", "p-2", "border", "rounded");
      docElement.innerHTML = `
                            <p><strong>Nome dell'Oggetto Didattico:</strong> ${
                              doc.oggetto || "N/A"
                            }</p>
                            <p><strong>Testo Descrittivo:</strong> ${
                              doc.descrizione || "N/A"
                            }</p>
                            <p><strong>Premi o Raccomandazioni:</strong> ${
                              doc.premi_o_raccomandazioni || "N/A"
                            }</p>
                            <p><strong>Pagina:</strong> ${
                              doc.pagina || "N/A"
                            }</p>
                            <p><strong>Documento:</strong> <a href="#" onclick="openPDFAtPage('${ensurePDFExtension(
                              doc.documento
                            )}', ${doc.pagina || 1})">${
        doc.documento || "N/A"
      }</a></p>
                        `;
      resultsContainer.appendChild(docElement);
    });
  } else {
    resultsContainer.innerHTML =
      "<p>No documents found matching the query.</p>";
  }
}
/**
 * used to query across the fields in the records
 * @returns it writes a list of records onto the "results" div
 */
async function submit_free_mongo_query() {
  // Get the form element by name
  const form = document.forms["free_queryForm"];

  // Get the value of the "free_text" field
  const freeTextValue = form["free_text"].value;

  if (!freeTextValue) {
    // Alert the user if all fields are empty
    alert("Non c'è nulal da cercare.");
    return false; // Prevent the submit action
  }
  const queryData = {'search_string': freeTextValue}
  try {
    const response = await axios.post("/free_query_mongo", queryData);
    writeResults(response);
  } catch (error) {
    console.error("Error fetching data:", error);
    // Display error message to the user
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = `<p class="text-danger">An error occurred: ${error.message}</p>`;
  }
}

/**
 * used to query each field in the records individually
 * @returns it writes a list of records onto the "results" div
 */
async function submit_mongo_query() {
  const form = document.getElementById("queryForm");
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
    const response = await axios.post("/query_mongo", queryData);
    writeResults(response);
  } catch (error) {
    console.error("Error fetching data:", error);
    // Display error message to the user
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = `<p class="text-danger">An error occurred: ${error.message}</p>`;
  }
}
