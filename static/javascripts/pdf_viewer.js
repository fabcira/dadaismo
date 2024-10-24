function init() {
    const urlParams = new URLSearchParams(window.location.search);
    const pdfDoc = urlParams.get('pdfDoc');
    const pageNum = parseInt(urlParams.get('pageNum'), 10);
    openPDFAtPage(pdfDoc, pageNum)
}


function openPDFAtPage(pdfDoc, pageNum) {
    let doc_viewer = document.getElementById("limited_pdf_viewer_container");
    if (doc_viewer)
        doc_viewer.style.display='block';
    const url = 'pdf/' + pdfDoc;

    let pageIsRendering = false,
        pageNumPending = null;

    const canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d');

    let viewer = document.getElementById('limited_pdf_viewer');
    viewer.innerHTML = "";
    viewer.appendChild(canvas);

    // Render the page
    const renderPage = (pdfDoc, num) => {
        pageIsRendering = true;

        // Get page
        pdfDoc.getPage(num).then(page => {
            const container = document.getElementById('limited_pdf_viewer');
            const viewport = page.getViewport({scale: 1.0});
            const scaleX = container.clientWidth / viewport.width;
            const scaleY = container.clientHeight / viewport.height;
            const scale = Math.min(scaleX, scaleY);
            const scaledViewport = page.getViewport({scale});

            canvas.height = scaledViewport.height;
            canvas.width = scaledViewport.width;

            const renderCtx = {
                canvasContext: ctx,
                viewport: scaledViewport
            };

            page.render(renderCtx).promise.then(() => {
                pageIsRendering = false;

                if (pageNumPending !== null) {
                    renderPage(pdfDoc, pageNumPending);
                    pageNumPending = null;
                }
            });

            // Output current page
            document.getElementById('page-number').textContent = num;
        });
    };

    // Check for pages rendering
    const queueRenderPage = num => {
        if (pageIsRendering) {
            pageNumPending = num;
        } else {
            renderPage(pdfDoc, num);
        }
    };

    // Get Document
    pdfjsLib.getDocument(url).promise.then(pdfDoc_ => {
        pdfDoc = pdfDoc_;
        renderPage(pdfDoc, pageNum);
    });

    // Previous page
    document.getElementById('prev-page').addEventListener('click', () => {
        if (pageNum <= 1) {
            return;
        }
        pageNum--;
        queueRenderPage(pageNum);
    });

    // Next page
    document.getElementById('next-page').addEventListener('click', () => {
        if (pageNum >= pdfDoc.numPages) {
            return;
        }
        pageNum++;
        queueRenderPage(pageNum);
    });

    // Handle resizing
    window.addEventListener('resize', () => {
        renderPage(pageNum);
    });
}


function OLDopenPDFAtPage(pdfDoc, pageNum) {

    const url = 'tempPDF/' + pdfDoc;

    let pageIsRendering = false,
        pageNumPending = null;

    const scale = 1.5,
        canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d');

    let viewer = document.getElementById('limited_pdf_viewer');
    viewer.innerHTML = "";
    viewer.appendChild(canvas);


// Render the page
    const renderPage = num => {
        pageIsRendering = true;

        // Get page
        pdfDoc.getPage(num).then(page => {
            const viewport = page.getViewport({scale: 1.5});
            const scale = (document.getElementById('limited_pdf_viewer').clientHeight / viewport.height) * 0.95;
            const scaledViewport = page.getViewport({scale});

            canvas.height = scaledViewport.height;
            canvas.width = scaledViewport.width;

            const renderCtx = {
                canvasContext: ctx,
                viewport: scaledViewport
            };

            page.render(renderCtx).promise.then(() => {
                pageIsRendering = false;

                if (pageNumPending !== null) {
                    renderPage(pageNumPending);
                    pageNumPending = null;
                }
            });

            // Output current page
            document.getElementById('page-number').textContent = num;
        });
    };


// Check for pages rendering
    const queueRenderPage = num => {
        if (pageIsRendering) {
            pageNumPending = num;
        } else {
            renderPage(pdfDoc, num);
        }
    };

// Get Document
    pdfjsLib.getDocument(url).promise.then(pdfDoc_ => {
        pdfDoc = pdfDoc_;

        // document.getElementById('page-count').textContent = pdfDoc.numPages;

        renderPage(pdfDoc, pageNum);
    });

// Previous page
    document.getElementById('prev-page').addEventListener('click', () => {
        if (pageNum <= 1) {
            return;
        }
        pageNum--;
        queueRenderPage(pdfDoc, pageNum);
    });

// Next page
    document.getElementById('next-page').addEventListener('click', () => {
        if (pageNum >= pdfDoc.numPages) {
            return;
        }
        pageNum++;
        queueRenderPage(pdfDoc, pageNum);
    })
}


