async function initOneDoc(){
    hideSavedSearches()
    await fetchPdfs();
}


async function fetchPdfs() {
    const response = await fetch('/pdfs');
    if (document.getElementById('lower_panel'))
        document.getElementById('lower_panel').style.display= 'block';
    if (document.getElementById('summary_container'))
        document.getElementById('summary_container').style.display= 'block';
    const pdfs = await response.json();
    const pdfList = document.getElementById('pdf-list');
    const select = document.createElement('select');
    select.classList.add('pdf-dropdown');

    // Add a dummy item as the first option
    const placeholderOption = document.createElement('option');
    placeholderOption.value = "";
    placeholderOption.innerText = "Seleziona il Catalogo da Esplorare";
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    select.appendChild(placeholderOption);

    pdfs.forEach(pdf => {
        const option = document.createElement('option');
        option.value = pdf;
        option.innerText = pdf;
        select.appendChild(option);
    });

    select.onchange = () => {
        const selectedPdf = select.value;
        viewPdf(selectedPdf);
    };

    if (pdfList)
        pdfList.appendChild(select);
}

async function viewCurrentPdf() {
    await viewPdf(window.selectedPdf)
}

async function viewPdf(filename) {
    // Show the page selection section
    // const pageSelection = document.getElementById('page-selection');
    // pageSelection.style.display = 'block';
    let startPage = parseInt(document.getElementById('start-page').value);
    let endPage = parseInt(document.getElementById('end-page').value);

    const response = await fetch(`/pdf/${filename}`);
    const blob = await response.blob();
    let url = null;

    // if the pages are unspecified, show the entire document
    if (isNaN(startPage) || isNaN(endPage) || startPage > endPage) {
        url = URL.createObjectURL(blob);
        await showPdf(url, null, null, filename)

    } else {
        // the pages must be subtracted by 1 as the pages start from 0
        startPage--;
        endPage--;
        const reader = new FileReader();
        reader.onload = async function (e) {
            const existingPdfBytes = new Uint8Array(e.target.result);
            const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
            const newPdfDoc = await PDFLib.PDFDocument.create();

            for (let i = startPage; i <= endPage; i++) {
                const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
                newPdfDoc.addPage(copiedPage);
            }
            const newPdfBytes = await newPdfDoc.save();
            url = URL.createObjectURL(new Blob([newPdfBytes], {type: 'application/pdf'}));
            await showPdf(url, startPage, endPage, filename)

        }
        reader.readAsArrayBuffer(blob);
        await regenerate_session_id()
    }

    // Store the selected PDF filename
    window.selectedPdf = filename;

    // Hide the PDF list
    const front_page = document.getElementById('catalogue_display');
    front_page.style.display = 'none';
    // document.getElementById('viewer_container').style.display = 'block';

}

function resetPages() {
    document.getElementById('start-page').value = null
    document.getElementById('end-page').value = null
    window.raw_pdf_text = null
    viewPdf(window.selectedPdf).then(null)

}


async function showPdf(url, startPage, endPage, filename) {
    const pdfViewer = document.getElementById('pdf-viewer');
    pdfViewer.innerHTML = `<iframe src="${url}" width="100%" height="100%"></iframe>`;
    document.getElementById('chat_and_viewer_container').style.display = 'block';
    // document.getElementById('viewer_container').style.display = 'block';

    if (startPage && !startPage.isNaN && endPage && !endPage.isNaN) {

        let data = {
            filename: filename,
            start_page: startPage,
            end_page: endPage
        }
        fetch('/get_raw_text_from_pdf',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }).then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            return response.json();  // Return the promise
        }).then(data => {
            window.raw_pdf_text = data;
        }).catch(error => {
            console.error('Fetch error:', error);
        });

    } else {
        // document.getElementById('chat_and_viewer_container').style.display = 'none'
    }
}