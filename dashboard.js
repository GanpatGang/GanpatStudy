// Simplified viewer configuration
const VIEWER_CONFIG = {
    GOOGLE_DOCS_VIEWER: 'https://docs.google.com/viewer?embedded=true&url=',
    OFFICE_ONLINE_VIEWER: 'https://view.officeapps.live.com/op/embed.aspx?ui=en-US&rs=en-US&wopisrc=',
    OFFICE_FALLBACK_VIEWER: 'https://view.officeapps.live.com/op/view.aspx?src=',
    PDF_VIEWER: 'https://mozilla.github.io/pdf.js/web/viewer.html?file=',
    PDF_JS_CDN: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    PDF_WORKER_CDN: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
    PREVIEW_TIMEOUT: 20000, // 20 seconds
    CLEANUP_TIMEOUT: 300000 // 5 minutes
};

// Add database management constants and functions at the top
const DB_CONFIG = {
    USERS_KEY: 'system_users',
    LOGIN_HISTORY_KEY: 'login_history',
    MAX_LOGIN_HISTORY: 100000 // Maximum number of login records to keep
};

// Check if user is logged in
function checkAuth() {
    const userType = sessionStorage.getItem('userType');
    if (!userType) {
        window.location.href = 'index.html';
    }
}

// Logout function
function logout() {
    sessionStorage.removeItem('userType');
    sessionStorage.removeItem('username');
    window.location.href = 'index.html';
}

// Get file type class
function getFileTypeClass(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    switch (ext) {
        case 'pdf':
            return 'file-pdf';
        case 'doc':
        case 'docx':
        case 'rtf':
        case 'odt':
            return 'file-doc';
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'bmp':
        case 'webp':
            return 'file-image';
        case 'mp4':
        case 'avi':
        case 'mov':
        case 'wmv':
        case 'flv':
        case 'webm':
            return 'file-video';
        case 'mp3':
        case 'wav':
        case 'ogg':
        case 'm4a':
        case 'aac':
            return 'file-audio';
        case 'txt':
        case 'csv':
        case 'json':
        case 'xml':
        case 'md':
        case 'log':
            return 'file-text';
        case 'xls':
        case 'xlsx':
            return 'file-excel';
        case 'ppt':
        case 'pptx':
            return 'file-powerpoint';
        case 'zip':
        case 'rar':
        case '7z':
        case 'tar':
        case 'gz':
            return 'file-archive';
        default:
            return 'file-other';
    }
}

// Get file icon
function getFileIcon(fileType) {
    switch (fileType) {
        case 'file-pdf':
            return '📄';
        case 'file-doc':
            return '📝';
        case 'file-image':
            return '🖼️';
        case 'file-video':
            return '🎥';
        case 'file-audio':
            return '🎵';
        case 'file-text':
            return '📃';
        case 'file-excel':
            return '📊';
        case 'file-powerpoint':
            return '📽️';
        case 'file-archive':
            return '📦';
        case 'file-other':
            return '📎';
        default:
            return '📄';
    }
}

// Format file size
function formatFileSize(bytes) {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

// Save files to localStorage
function saveFiles(files) {
    localStorage.setItem('uploadedFiles', JSON.stringify(files));
}

// Get files from localStorage
function getFiles() {
    return JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
}

// Display files
function displayFiles() {
    const fileContainer = document.getElementById('fileContainer');
    if (fileContainer) {
        const files = getFiles() || [];
        console.log('Displaying files:', files.length);
        
        if (files.length === 0) {
            fileContainer.innerHTML = '<div class="no-files">No files uploaded yet</div>';
            return;
        }

        // Check if user is a teacher
        const isTeacher = sessionStorage.getItem('userType') === 'teacher';

        fileContainer.innerHTML = files.map((file, index) => {
            const fileTypeClass = getFileTypeClass(file.name);
            const fileIcon = getFileIcon(fileTypeClass);
            const fileDesc = getFileTypeDescription(fileTypeClass, file.name);
            
            // Add delete button for teachers
            const deleteButton = isTeacher ? `
                <button class="action-button delete-button" 
                        onclick="event.stopPropagation(); deleteFile('${encodeURIComponent(file.name)}', ${index})">
                    <span class="button-icon">🗑️</span>
                    <span class="button-text">Delete</span>
                </button>` : '';
            
            return `
                <div class="file-item ${fileTypeClass}" data-index="${index}" data-filename="${encodeURIComponent(file.name)}">
                    <div class="file-main-content">
                        <div class="file-icon">${fileIcon}</div>
                        <div class="file-info">
                            <h4>${file.name}</h4>
                            <p>${fileDesc}</p>
                            <p>Size: ${formatFileSize(file.size)}</p>
                            <p>Uploaded by: ${file.uploadedBy}</p>
                            <p>Date: ${file.uploadDate}</p>
                        </div>
                    </div>
                    <div class="file-actions">
                        <button class="action-button preview-button" 
                                onclick="event.stopPropagation(); previewFile('${encodeURIComponent(file.name)}', this)">
                            <span class="button-icon">👁️</span>
                            <span class="button-text">Preview</span>
                        </button>
                        <button class="action-button download-button" 
                                onclick="event.stopPropagation(); downloadFile('${encodeURIComponent(file.name)}')">
                            <span class="button-icon">⬇️</span>
                            <span class="button-text">Download</span>
                        </button>
                        ${deleteButton}
                    </div>
                </div>
            `;
        }).join('');

        // Add styles for the new buttons and layout
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .file-item {
                display: flex;
                padding: 1rem;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                margin-bottom: 0.5rem;
                background: white;
                transition: all 0.2s ease;
                align-items: center;
                justify-content: space-between;
            }

            .file-item:hover {
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                border-color: #adb5bd;
            }

            .file-main-content {
                display: flex;
                align-items: center;
                flex: 1;
                min-width: 0;
            }

            .file-icon {
                font-size: 2rem;
                margin-right: 1rem;
                flex-shrink: 0;
            }

            .file-info {
                min-width: 0;
                flex: 1;
            }

            .file-info h4 {
                margin: 0 0 0.5rem 0;
                color: #212529;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .file-info p {
                margin: 0.2rem 0;
                color: #6c757d;
                font-size: 0.9rem;
            }

            .file-actions {
                display: flex;
                gap: 0.5rem;
                align-items: center;
                flex-shrink: 0;
                margin-left: 1rem;
            }

            .action-button {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem 1rem;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.9rem;
                transition: all 0.2s;
                white-space: nowrap;
            }

            .preview-button {
                background-color: #007bff;
                color: white;
            }

            .preview-button:hover {
                background-color: #0056b3;
            }

            .download-button {
                background-color: #28a745;
                color: white;
            }

            .download-button:hover {
                background-color: #218838;
            }

            .delete-button {
                background-color: #dc3545;
                color: white;
            }

            .delete-button:hover {
                background-color: #c82333;
            }

            .button-icon {
                font-size: 1.1rem;
            }

            @media (max-width: 768px) {
                .file-item {
                    flex-direction: column;
                    align-items: stretch;
                }

                .file-actions {
                    margin-left: 0;
                    margin-top: 1rem;
                    justify-content: flex-end;
                }

                .button-text {
                    display: none;
                }

                .action-button {
                    padding: 0.5rem;
                }

                .file-info h4 {
                    white-space: normal;
                    word-wrap: break-word;
                }
            }
        `;
        document.head.appendChild(styleElement);
    }
}

// Load PDF.js for PDF preview
function loadPDFJS() {
    if (window.pdfjsLib) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        // Load PDF.js main script
        const script = document.createElement('script');
        script.src = VIEWER_CONFIG.PDF_JS_CDN;
        script.onload = () => {
            // Configure PDF.js worker
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = VIEWER_CONFIG.PDF_WORKER_CDN;
            resolve();
        };
        script.onerror = () => reject(new Error('Failed to load PDF.js'));
        document.head.appendChild(script);
    });
}

// Function to show simple error message
function showDocumentError(container, errorMessage) {
    container.innerHTML = `
        <div class="simple-error">
            <div class="error-title">Unable to load document</div>
            <div class="error-message">${errorMessage}</div>
        </div>`;

    // Add minimal styles for error display
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .simple-error {
            text-align: center;
            padding: 40px 20px;
            background: #fff;
            min-height: 200px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }

        .error-title {
            color: #dc3545;
            font-size: 18px;
            margin-bottom: 10px;
        }

        .error-message {
            color: #666;
            font-size: 16px;
        }
    `;
    document.head.appendChild(styleElement);
}

// Function to create document blob
async function createDocumentBlob(file) {
    try {
        const ext = file.name.split('.').pop().toLowerCase();
        const mimeType = ext === 'docx' 
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : 'application/msword';

        // Handle data URL
        if (file.data.startsWith('data:')) {
            const response = await fetch(file.data);
            const blob = await response.blob();
            return new Blob([await blob.arrayBuffer()], { type: mimeType });
        }

        // Handle base64 data
        const byteString = atob(file.data);
        const byteArray = new Uint8Array(byteString.length);
        
        for (let i = 0; i < byteString.length; i++) {
            byteArray[i] = byteString.charCodeAt(i);
        }

        return new Blob([byteArray], { type: mimeType });
    } catch (error) {
        console.error('Error creating document blob:', error);
        throw new Error('Could not process document file');
    }
}

// Function to get precise MIME type from file
function getMimeTypeFromFile(file) {
    // Get extension
    const ext = file.name.split('.').pop().toLowerCase();
    
    // Detailed MIME type mapping
    const mimeTypes = {
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'docm': 'application/vnd.ms-word.document.macroEnabled.12',
        'dotx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
        'dotm': 'application/vnd.ms-word.template.macroEnabled.12',
        'rtf': 'application/rtf',
        'odt': 'application/vnd.oasis.opendocument.text'
    };

    // Return specific MIME type or fallback
    return mimeTypes[ext] || file.type || 'application/octet-stream';
}

// Function to preview in Office Online
function previewInOfficeOnline(blobUrl) {
    const previewWindow = window.open('', '_blank');
    if (!previewWindow) {
        alert('Pop-up blocked. Please allow pop-ups for this site.');
        return;
    }

    previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>Document Preview</title>
                <style>
                    body, html {
                        margin: 0;
                        padding: 0;
                        height: 100%;
                        overflow: hidden;
                    }
                    .preview-frame {
                        width: 100%;
                        height: 100%;
                        border: none;
                    }
                    .loading {
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="loading">Loading preview...</div>
                <iframe class="preview-frame" 
                        src="https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(blobUrl)}"
                        onload="document.querySelector('.loading').style.display='none';">
                </iframe>
            </body>
        </html>
    `);
}

// Update the previewFile function
async function previewFile(fileName, element) {
    try {
        console.log('Starting preview for file:', fileName);
        fileName = decodeURIComponent(fileName);
        
        const files = getFiles() || [];
        const file = files.find(f => f.name === fileName);
        const previewContent = document.getElementById('previewContent');
        
        if (!file || !previewContent) {
            console.error('File or preview container not found');
            if (previewContent) {
                previewContent.innerHTML = `<div class="preview-error">File not found</div>`;
            }
            return;
        }

        // Show loading state
        previewContent.innerHTML = `
            <div class="preview-loading">
                <div class="spinner"></div>
                <p>Loading preview...</p>
            </div>`;

        const fileExt = file.name.split('.').pop().toLowerCase();

        // Handle different file types
        if (fileExt === 'pdf') {
            try {
                await loadPDFJS();
                await renderPDF(file.data, previewContent);
            } catch (error) {
                console.error('PDF preview error:', error);
                showDownloadFallback(file, 'Could not preview PDF file');
            }
        }
        else if (fileExt === 'doc' || fileExt === 'docx') {
            await previewDOCX(file, previewContent);
        }
        else if (fileExt === 'ppt' || fileExt === 'pptx') {
            await previewPPT(file, previewContent);
        }
        else if (file.type.startsWith('image/')) {
            previewContent.innerHTML = `
                <div class="image-preview">
                    <img src="${file.data}" 
                         alt="${file.name}"
                         style="max-width: 100%; max-height: 800px; object-fit: contain;" />
                </div>`;
        }
        else {
            showDownloadFallback(file);
        }

    } catch (error) {
        console.error('Preview error:', error);
        if (previewContent) {
            showErrorMessage(previewContent, error.message, fileName);
        }
    }
}

// Function to render PDF
async function renderPDF(pdfData, container) {
    try {
        // Extract base64 data if needed
        const base64Data = pdfData.split(',')[1] || pdfData;
        
        // Convert to binary data
        const binaryData = atob(base64Data);
        const length = binaryData.length;
        const bytes = new Uint8Array(length);
        
        for (let i = 0; i < length; i++) {
            bytes[i] = binaryData.charCodeAt(i);
        }

        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument({ data: bytes });
        const pdf = await loadingTask.promise;

        // Create viewer container
        container.innerHTML = `
            <div class="pdf-viewer" style="padding: 20px;">
                <div class="pdf-controls" style="margin-bottom: 20px;">
                    <button id="prevPage" class="action-button">Previous</button>
                    <span id="pageInfo" style="margin: 0 10px;">Page: <span id="pageNum">1</span> / ${pdf.numPages}</span>
                    <button id="nextPage" class="action-button">Next</button>
                    <select id="zoomLevel" style="margin-left: 10px;">
                        <option value="0.5">50%</option>
                        <option value="0.75">75%</option>
                        <option value="1" selected>100%</option>
                        <option value="1.25">125%</option>
                        <option value="1.5">150%</option>
                        <option value="2">200%</option>
                    </select>
                </div>
                <canvas id="pdfCanvas" style="border: 1px solid #ddd; margin: 0 auto; display: block;"></canvas>
            </div>`;

        let currentPage = 1;
        let currentZoom = 1;
        const canvas = document.getElementById('pdfCanvas');
        const context = canvas.getContext('2d');

        // Function to render a page
        async function renderPage(pageNum, zoom = 1) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: zoom });
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            document.getElementById('pageNum').textContent = pageNum;
        }

        // Initial render
        await renderPage(currentPage, currentZoom);

        // Add event listeners
        document.getElementById('prevPage').addEventListener('click', async () => {
            if (currentPage > 1) {
                currentPage--;
                await renderPage(currentPage, currentZoom);
            }
        });

        document.getElementById('nextPage').addEventListener('click', async () => {
            if (currentPage < pdf.numPages) {
                currentPage++;
                await renderPage(currentPage, currentZoom);
            }
        });

        document.getElementById('zoomLevel').addEventListener('change', async (e) => {
            currentZoom = parseFloat(e.target.value);
            await renderPage(currentPage, currentZoom);
        });

    } catch (error) {
        console.error('PDF rendering error:', error);
        throw new Error('Could not render PDF');
    }
}

// Function to get text content from data URL
async function getTextContent(dataUrl) {
    try {
        if (dataUrl.startsWith('data:')) {
            const content = dataUrl.split(',')[1];
            return decodeURIComponent(escape(atob(content)));
        }
        return dataUrl;
    } catch (error) {
        console.error('Error getting text content:', error);
        throw new Error('Could not read text content');
    }
}

// Update file upload function
function uploadFiles() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput && fileInput.files.length > 0) {
        Array.from(fileInput.files).forEach(file => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    console.log('File reading completed:', file.name);
                    
                    // Store file data
                    const fileData = {
                        name: file.name,
                        uploadedBy: sessionStorage.getItem('username') || 'Unknown',
                        size: file.size,
                        type: file.type || getMimeType(file.name),
                        uploadDate: new Date().toLocaleString(),
                        data: e.target.result
                    };

                    // Debug log
                    console.log('File upload:', {
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        dataLength: e.target.result.length,
                        dataStart: e.target.result.substring(0, 100)
                    });

                    const files = getFiles() || [];
                    files.push(fileData);
                    saveFiles(files);
                    displayFiles();

                } catch (error) {
                    console.error('Upload error:', error);
                    alert('Error uploading file: ' + file.name + '\n' + error.message);
                }
            };

            reader.onerror = function() {
                console.error('File reading error:', reader.error);
                alert('Error reading file: ' + file.name);
            };

            // Read as data URL
            reader.readAsDataURL(file);
        });
        
        fileInput.value = '';
    }
}

// Upload folder
function uploadFolder() {
    const folderInput = document.getElementById('folderInput');
    if (folderInput && folderInput.files.length > 0) {
        Array.from(folderInput.files).forEach(file => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const files = getFiles();
                    files.push({
                        name: file.name,
                        uploadedBy: sessionStorage.getItem('username'),
                        size: file.size,
                        type: file.type,
                        path: file.webkitRelativePath,
                        folderName: file.webkitRelativePath.split('/')[0],
                        isFolder: true,
                        uploadDate: new Date().toLocaleString(),
                        data: e.target.result
                    });
                    saveFiles(files);
                    displayFiles();
                } catch (error) {
                    console.error('Upload error:', error);
                    alert('Error uploading file: ' + file.name);
                }
            };

            reader.onerror = function() {
                console.error('File reading error:', reader.error);
                alert('Error reading file: ' + file.name);
            };
            
            // Read file based on its type
            if (file.type.startsWith('image/') || 
                file.type === 'application/pdf' || 
                file.type.startsWith('video/') || 
                file.type.startsWith('audio/') ||
                file.type.startsWith('application/')) {
                reader.readAsDataURL(file);
            } else {
                reader.readAsText(file);
            }
        });
        
        folderInput.value = '';
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    displayFiles();
});

// Update styles
document.head.insertAdjacentHTML('beforeend', `
    <style>
        .preview-main {
            background: #f8f9fa;
            border-radius: 4px;
            overflow: hidden;
            min-height: 400px;
            position: relative;
        }

        .unsupported-file {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin: 20px;
        }

        .file-icon-large {
            font-size: 48px;
            margin-bottom: 1rem;
        }

        .file-actions {
            margin: 1.5rem 0;
        }

        .file-info {
            text-align: left;
            max-width: 400px;
            margin: 0 auto;
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 4px;
        }

        .image-viewer {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 400px;
            background: #fff;
            padding: 20px;
        }

        .image-viewer img {
            max-width: 100%;
            max-height: 70vh;
            object-fit: contain;
        }

        .video-viewer,
        .audio-viewer {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 400px;
            background: #fff;
            padding: 20px;
        }

        .text-viewer {
            padding: 20px;
            background: white;
            min-height: 400px;
            overflow: auto;
        }

        .text-viewer pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.5;
            margin: 0;
        }

        .office-viewer {
            width: 100%;
            height: 800px;
            border: none;
        }

        .action-button {
            padding: 8px 16px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s;
        }

        .action-button:hover {
            background: #0056b3;
        }

        .no-files {
            text-align: center;
            padding: 2rem;
            color: #666;
            font-style: italic;
        }

        .file-item {
            display: flex;
            padding: 1rem;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            margin-bottom: 0.5rem;
            cursor: pointer;
            transition: all 0.2s ease;
            background: white;
        }

        .file-item:hover {
            background: #f8f9fa;
            border-color: #adb5bd;
        }

        .file-item.active {
            background: #e9ecef;
            border-color: #007bff;
        }

        .file-icon {
            font-size: 2rem;
            margin-right: 1rem;
            display: flex;
            align-items: center;
        }

        .file-info {
            flex: 1;
        }

        .file-info h4 {
            margin: 0 0 0.5rem 0;
            color: #212529;
        }

        .file-info p {
            margin: 0.2rem 0;
            color: #6c757d;
            font-size: 0.9rem;
        }

        .preview-error {
            text-align: center;
            padding: 2rem;
            background: #fff3cd;
            border: 1px solid #ffeeba;
            border-radius: 4px;
            color: #856404;
            margin: 1rem;
        }

        .preview-loading {
            text-align: center;
            padding: 40px;
        }
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .pdf-controls {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 10px;
        }
        .image-preview {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 400px;
            background: #fff;
            padding: 20px;
        }
        .text-preview {
            background: #fff;
            padding: 20px;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .docx-preview {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin: 20px;
            overflow: hidden;
        }
        .preview-tabs {
            display: flex;
            background: #f8f9fa;
            border-bottom: 1px solid #dee2e6;
            padding: 10px 10px 0;
        }
        .tab-button {
            padding: 10px 20px;
            border: 1px solid transparent;
            border-bottom: none;
            border-radius: 4px 4px 0 0;
            background: none;
            cursor: pointer;
            margin-right: 5px;
            color: #666;
        }
        .tab-button:hover {
            background: #e9ecef;
        }
        .tab-button.active {
            background: white;
            border-color: #dee2e6;
            color: #007bff;
            margin-bottom: -1px;
            padding-bottom: 11px;
        }
        .preview-content {
            position: relative;
            background: white;
        }
        .tab-content {
            display: none;
            padding: 20px;
        }
        .tab-content.active {
            display: block;
        }
        .loading-progress {
            margin-top: 20px;
            text-align: center;
        }
        .progress-steps {
            margin-top: 10px;
        }
        .step {
            color: #666;
            margin: 5px 0;
            padding: 5px;
            font-size: 0.9em;
        }
        .step.done {
            color: #28a745;
        }
        .spinner.small {
            width: 20px;
            height: 20px;
            border-width: 2px;
        }
        .iframe-loading {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1;
        }
        .quick-preview-container {
            min-height: 400px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8f9fa;
            border-radius: 4px;
        }
        .loading-message {
            text-align: center;
        }
        .loading-message .spinner {
            margin-bottom: 10px;
        }
    </style>
`);

// Add function to get file type description
function getFileTypeDescription(fileType, fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    switch (fileType) {
        case 'file-pdf':
            return 'PDF Document';
        case 'file-doc':
            return ext === 'doc' ? 'Word Document' : 
                   ext === 'docx' ? 'Word Document (DOCX)' :
                   ext === 'rtf' ? 'Rich Text Format' :
                   'Text Document';
        case 'file-image':
            return `Image File (${ext.toUpperCase()})`;
        case 'file-video':
            return `Video File (${ext.toUpperCase()})`;
        case 'file-audio':
            return `Audio File (${ext.toUpperCase()})`;
        case 'file-text':
            return ext === 'txt' ? 'Text File' :
                   ext === 'csv' ? 'CSV Spreadsheet' :
                   ext === 'json' ? 'JSON File' :
                   ext === 'xml' ? 'XML File' :
                   ext === 'md' ? 'Markdown File' :
                   'Text Document';
        case 'file-excel':
            return 'Excel Spreadsheet';
        case 'file-powerpoint':
            return 'PowerPoint Presentation';
        case 'file-archive':
            return `Archive File (${ext.toUpperCase()})`;
        default:
            return `${ext.toUpperCase()} File`;
    }
}

// Add function to get MIME type from file extension
function getMimeType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const mimeTypes = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'txt': 'text/plain',
        'csv': 'text/csv',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'bmp': 'image/bmp',
        'webp': 'image/webp',
        'mp4': 'video/mp4',
        'avi': 'video/x-msvideo',
        'mov': 'video/quicktime',
        'wmv': 'video/x-ms-wmv',
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'ogg': 'audio/ogg',
        'm4a': 'audio/mp4',
        'zip': 'application/zip',
        'rar': 'application/x-rar-compressed',
        '7z': 'application/x-7z-compressed'
    };
    return mimeTypes[ext] || 'application/octet-stream';
}

// Add function to check if file data is valid
function isValidFileData(data) {
    if (!data) return false;
    if (data.startsWith('data:')) return true;
    if (data.startsWith('blob:')) return true;
    try {
        atob(data);
        return true;
    } catch (e) {
        return false;
    }
}

// Download file
function downloadFile(fileName) {
    fileName = decodeURIComponent(fileName);
    const files = getFiles();
    const file = files.find(f => f.name === fileName);
    
    if (file && file.data) {
        try {
            // Create blob from the file data
            let blob;
            if (file.data.startsWith('data:')) {
                // Handle base64 data URLs
                const [header, base64Data] = file.data.split(',');
                const byteCharacters = atob(base64Data);
                const byteArrays = [];
                
                for (let offset = 0; offset < byteCharacters.length; offset += 512) {
                    const slice = byteCharacters.slice(offset, offset + 512);
                    const byteNumbers = new Array(slice.length);
                    
                    for (let i = 0; i < slice.length; i++) {
                        byteNumbers[i] = slice.charCodeAt(i);
                    }
                    
                    byteArrays.push(new Uint8Array(byteNumbers));
                }
                
                blob = new Blob(byteArrays, { type: file.type || 'application/octet-stream' });
            } else {
                // Handle text data
                blob = new Blob([file.data], { type: 'text/plain' });
            }

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            
            // Append link, click it, and clean up
            document.body.appendChild(link);
            link.click();
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);
        } catch (error) {
            console.error('Download error:', error);
            alert('Error downloading file. Please try again.');
        }
    } else {
        alert('File content not available for download.');
    }
}

// Delete file (teachers only)
function deleteFile(fileName, fileIndex) {
    // Check if user is a teacher
    if (sessionStorage.getItem('userType') !== 'teacher') {
        console.error('Unauthorized: Only teachers can delete files');
        return;
    }

    fileName = decodeURIComponent(fileName);
    const fileItem = document.querySelector(`[data-index="${fileIndex}"]`);
    
    if (!fileItem) return;

    // Create confirmation dialog
    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'confirm-delete';
    confirmDialog.innerHTML = `
        <h4>Delete File?</h4>
        <p>Are you sure you want to delete "${fileName}"?</p>
        <p>This action cannot be undone.</p>
        <div class="confirm-delete-buttons">
            <button class="confirm-yes" onclick="confirmDelete('${encodeURIComponent(fileName)}')">Yes, Delete</button>
            <button class="confirm-no" onclick="this.closest('.confirm-delete').remove()">Cancel</button>
        </div>
    `;

    fileItem.appendChild(confirmDialog);
}

// Add confirm delete function
function confirmDelete(fileName) {
    try {
        fileName = decodeURIComponent(fileName);
        const files = getFiles();
        const updatedFiles = files.filter(f => f.name !== fileName);
        saveFiles(updatedFiles);
        
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 15px 20px;
            border-radius: 4px;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        successMessage.innerHTML = `✓ File "${fileName}" has been deleted`;
        document.body.appendChild(successMessage);

        // Remove success message after 3 seconds
        setTimeout(() => {
            successMessage.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => successMessage.remove(), 300);
        }, 3000);

        // Refresh file list
        displayFiles();

    } catch (error) {
        console.error('Error deleting file:', error);
        alert('Error deleting file. Please try again.');
    }
}

// Add animation styles
const animationStyles = document.createElement('style');
animationStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(animationStyles);

// Open file in new tab
function openInNewTab(data) {
    try {
        const newTab = window.open('about:blank', '_blank');
        if (!newTab) {
            alert('Pop-up was blocked. Please allow pop-ups for this site to use this feature.');
            return;
        }

        newTab.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>File Preview</title>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body {
                            margin: 0;
                            padding: 20px;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            background: #f8f9fa;
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                        }
                        .viewer-container {
                            width: 100%;
                            max-width: 1200px;
                            height: 90vh;
                            background: white;
                            border-radius: 8px;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                            overflow: hidden;
                        }
                        .viewer-header {
                            padding: 1rem;
                            background: #fff;
                            border-bottom: 1px solid #dee2e6;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        }
                        .viewer-content {
                            height: calc(100% - 60px);
                            overflow: auto;
                        }
                        .download-button {
                            padding: 8px 16px;
                            background: #007bff;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 14px;
                        }
                        .download-button:hover {
                            background: #0056b3;
                        }
                        img, video {
                            max-width: 100%;
                            max-height: calc(90vh - 60px);
                            object-fit: contain;
                        }
                        iframe {
                            width: 100%;
                            height: 100%;
                            border: none;
                        }
                        pre {
                            margin: 0;
                            padding: 20px;
                            white-space: pre-wrap;
                            word-wrap: break-word;
                            font-family: 'Courier New', monospace;
                            font-size: 14px;
                            line-height: 1.5;
                        }
                    </style>
                </head>
                <body>
                    <div class="viewer-container">
                        <div class="viewer-header">
                            <h3>File Preview</h3>
                            <button class="download-button" onclick="window.location.href='${data}' + (document.querySelector('iframe') ? '' : ';attachment')">Download</button>
                        </div>
                        <div class="viewer-content">
                            ${getFullScreenContent(data)}
                        </div>
                    </div>
                </body>
            </html>
        `);
        newTab.document.close();
    } catch (error) {
        console.error('Error opening in new tab:', error);
        alert('Error opening file in new tab. Please try downloading the file instead.');
    }
}

// Add new function to handle full screen content
function getFullScreenContent(data) {
    try {
        if (data.startsWith('data:application/pdf')) {
            return `<iframe 
                src="${VIEWER_CONFIG.PDF_JS_VIEWER}${encodeURIComponent(data)}"
                style="width: 100%; height: 100vh; border: none;"
                allowfullscreen
            ></iframe>`;
        } 
        else if (data.startsWith('data:application/vnd.openxmlformats-officedocument.wordprocessingml.document') ||
                 data.startsWith('data:application/msword')) {
            return `<iframe 
                src="${VIEWER_CONFIG.OFFICE_ONLINE_VIEWER}${encodeURIComponent(data)}"
                style="width: 100%; height: 100vh; border: none;"
                allowfullscreen
            ></iframe>`;
        }
        else if (data.startsWith('data:image')) {
            return `<img src="${data}" alt="Image preview">`;
        }
        else if (data.startsWith('data:video')) {
            return `<video controls><source src="${data}"></video>`;
        }
        else if (data.startsWith('data:audio')) {
            return `<audio controls style="width: 100%;"><source src="${data}"></audio>`;
        }
        else if (data.startsWith('data:text')) {
            return `<pre>${data.split(',')[1]}</pre>`;
        }
        else {
            // For unknown file types, provide download link
            return `
                <div style="text-align: center; padding: 20px;">
                    <p>This file type cannot be previewed directly.</p>
                    <p>Please use the download button above to view the file.</p>
                </div>`;
        }
    } catch (error) {
        console.error('Error generating full screen content:', error);
        return `
            <div style="text-align: center; padding: 20px;">
                <p>Error previewing file.</p>
                <p>Please try downloading the file instead.</p>
            </div>`;
    }
}

// Update the previewDOCX function
async function previewDOCX(file, container) {
    try {
        if (!file || !file.data) {
            throw new Error('Invalid file data');
        }

        // Show loading state
        container.innerHTML = `
            <div class="doc-preview-loading">
                <div class="spinner"></div>
                <p>Preparing document viewer...</p>
                <p class="loading-status" id="loadingStatus">Processing document...</p>
            </div>`;

        const loadingStatus = document.getElementById('loadingStatus');

        try {
            // Create blob and get URL
            loadingStatus.textContent = 'Creating document preview...';
            const blob = await createDocumentBlob(file);
            if (!blob) {
                throw new Error('Could not process document');
            }

            // Create object URL
            const blobUrl = URL.createObjectURL(blob);

            // Create the viewer interface
            container.innerHTML = `
                <div class="doc-preview-container">
                    <div class="doc-toolbar">
                        <div class="doc-info">
                            <span class="doc-icon">📄</span>
                            <span class="doc-name">${file.name}</span>
                            <span class="doc-size">(${formatFileSize(blob.size)})</span>
                        </div>
                        <div class="viewer-controls">
                            <button onclick="window.open('${VIEWER_CONFIG.OFFICE_FALLBACK_VIEWER}${encodeURIComponent(window.location.origin + '/' + blobUrl)}', '_blank')" class="viewer-button">
                                Open in New Window
                            </button>
                            <button onclick="downloadFile('${encodeURIComponent(file.name)}')" class="viewer-button">
                                Download
                            </button>
                        </div>
                    </div>
                    <div class="doc-viewer-container">
                        <div id="viewerLoading" class="viewer-loading">
                            <div class="spinner"></div>
                            <p>Loading document viewer...</p>
                            <p class="loading-status" id="viewerStatus">Initializing viewer...</p>
                        </div>
                        <div class="viewer-tabs">
                            <button class="tab-button active" onclick="switchDocViewer('google', '${encodeURIComponent(blobUrl)}')">
                                Google Docs
                            </button>
                            <button class="tab-button" onclick="switchDocViewer('office', '${encodeURIComponent(blobUrl)}')">
                                Microsoft Office
                            </button>
                        </div>
                        <div class="viewer-frame-container">
                            <iframe id="docViewer" 
                                    class="doc-viewer-frame"
                                    src="${VIEWER_CONFIG.GOOGLE_DOCS_VIEWER}${encodeURIComponent(window.location.origin + '/' + blobUrl)}"
                                    frameborder="0"
                                    allowfullscreen>
                            </iframe>
                        </div>
                    </div>
                </div>`;

            // Add viewer switching functionality
            window.switchDocViewer = function(type, encodedUrl) {
                const viewer = document.getElementById('docViewer');
                const loading = document.getElementById('viewerLoading');
                const viewerStatus = document.getElementById('viewerStatus');
                const tabs = document.querySelectorAll('.tab-button');
                
                // Update tab states
                tabs.forEach(tab => {
                    tab.classList.remove('active');
                    if (tab.textContent.toLowerCase().includes(type)) {
                        tab.classList.add('active');
                    }
                });

                loading.style.display = 'flex';
                const decodedUrl = decodeURIComponent(encodedUrl);
                const fullUrl = window.location.origin + '/' + decodedUrl;

                if (type === 'office') {
                    viewerStatus.textContent = 'Loading Microsoft Office Online...';
                    viewer.src = `${VIEWER_CONFIG.OFFICE_ONLINE_VIEWER}${encodeURIComponent(fullUrl)}`;
                } else {
                    viewerStatus.textContent = 'Loading Google Docs Viewer...';
                    viewer.src = `${VIEWER_CONFIG.GOOGLE_DOCS_VIEWER}${encodeURIComponent(fullUrl)}`;
                }

                // Handle viewer load events
                viewer.onload = function() {
                    loading.style.display = 'none';
                };

                // Set timeout for viewer loading
                setTimeout(() => {
                    if (loading.style.display !== 'none') {
                        const otherType = type === 'office' ? 'google' : 'office';
                        showViewerError(container, 
                            `Viewer timeout - trying ${otherType} viewer...`,
                            () => switchDocViewer(otherType, encodedUrl));
                    }
                }, VIEWER_CONFIG.PREVIEW_TIMEOUT);
            };

            // Add styles for tabs
            const style = document.createElement('style');
            style.textContent = `
                .viewer-tabs {
                    display: flex;
                    gap: 10px;
                    padding: 10px;
                    background: #f8f9fa;
                    border-bottom: 1px solid #dee2e6;
                }
                .tab-button {
                    padding: 8px 16px;
                    border: 1px solid #dee2e6;
                    border-radius: 4px;
                    background: white;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .tab-button.active {
                    background: #007bff;
                    color: white;
                    border-color: #0056b3;
                }
                .viewer-frame-container {
                    flex: 1;
                    position: relative;
                }
                .doc-viewer-frame {
                    width: 100%;
                    height: 100%;
                    border: none;
                }
            `;
            document.head.appendChild(style);

            // Clean up blob URL after timeout
            setTimeout(() => {
                URL.revokeObjectURL(blobUrl);
            }, VIEWER_CONFIG.CLEANUP_TIMEOUT);

        } catch (error) {
            console.error('Preview creation error:', error);
            showViewerError(container, error.message);
        }

    } catch (error) {
        console.error('Document preview error:', error);
        showViewerError(container, error.message);
    }
}

// Function to show viewer error
function showViewerError(container, message, retryCallback = null) {
    const retryButton = retryCallback ? `
        <button onclick="(${retryCallback.toString()})()" class="error-button retry-button">
            Try Again
        </button>
    ` : '';

    container.innerHTML = `
        <div class="preview-error">
            <div class="error-icon">⚠️</div>
            <h3>Preview Error</h3>
            <p>${message}</p>
            <div class="error-actions">
                ${retryButton}
                <button onclick="downloadFile('${encodeURIComponent(file.name)}')" class="error-button">
                    Download File
                </button>
            </div>
        </div>`;
}

// Function to create a public URL for the blob
async function createPublicBlobUrl(blob, fileName) {
    try {
        // Create a FormData object
        const formData = new FormData();
        formData.append('file', blob, fileName);
        
        // Send the file to a temporary file hosting service
        const response = await fetch('https://tempfiles.ninja/api/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Failed to create public URL');
        }
        
        const data = await response.json();
        return data.url;
    } catch (error) {
        console.error('Error creating public URL:', error);
        throw new Error('Could not create preview URL');
    }
}

// Function to preview PowerPoint files
async function previewPPT(file, container) {
    try {
        if (!file || !file.data) {
            throw new Error('Invalid file data');
        }

        // Show loading state
        container.innerHTML = `
            <div class="ppt-preview-loading">
                <div class="spinner"></div>
                <p>Preparing presentation viewer...</p>
                <p class="loading-status" id="loadingStatus">Processing presentation...</p>
            </div>`;

        const loadingStatus = document.getElementById('loadingStatus');
        
        try {
            loadingStatus.textContent = 'Creating presentation preview...';
            
            // Create blob with proper MIME type
            const blob = await createPresentationBlob(file);
            if (!blob) {
                throw new Error('Could not process presentation');
            }

            // Create a public URL for the blob
            loadingStatus.textContent = 'Generating preview URL...';
            const publicUrl = await createPublicBlobUrl(blob, file.name);

            // Create the viewer interface
            container.innerHTML = `
                <div class="ppt-preview-container">
                    <div class="ppt-toolbar">
                        <div class="ppt-info">
                            <span class="ppt-icon">📽️</span>
                            <span class="ppt-name">${file.name}</span>
                            <span class="ppt-size">(${formatFileSize(blob.size)})</span>
                        </div>
                        <div class="viewer-controls">
                            <button onclick="openInNewWindow('${encodeURIComponent(publicUrl)}', '${encodeURIComponent(file.name)}')" class="viewer-button">
                                Open in Full Screen
                            </button>
                            <button onclick="downloadFile('${encodeURIComponent(file.name)}')" class="viewer-button">
                                Download
                            </button>
                        </div>
                    </div>
                    <div class="ppt-viewer-container">
                        <div id="viewerLoading" class="viewer-loading">
                            <div class="spinner"></div>
                            <p>Loading presentation viewer...</p>
                            <p class="loading-status" id="viewerStatus">Initializing viewer...</p>
                        </div>
                        <iframe id="pptViewer" 
                                class="ppt-viewer-frame"
                                src="${VIEWER_CONFIG.OFFICE_ONLINE_VIEWER}${encodeURIComponent(publicUrl)}"
                                frameborder="0"
                                allowfullscreen>
                        </iframe>
                    </div>
                </div>`;

            // Handle viewer load event
            const viewer = document.getElementById('pptViewer');
            const loading = document.getElementById('viewerLoading');
            
            viewer.onload = function() {
                loading.style.display = 'none';
            };

            // Set timeout for viewer loading
            setTimeout(() => {
                if (loading.style.display !== 'none') {
                    showViewerError(container, 'Viewer timeout - Please try opening in full screen');
                }
            }, VIEWER_CONFIG.PREVIEW_TIMEOUT);

        } catch (error) {
            console.error('Preview creation error:', error);
            showViewerError(container, error.message);
        }

    } catch (error) {
        console.error('Presentation preview error:', error);
        showViewerError(container, error.message);
    }
}

// Function to create presentation blob
async function createPresentationBlob(file) {
    try {
        const ext = file.name.split('.').pop().toLowerCase();
        const mimeType = ext === 'pptx' 
            ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            : 'application/vnd.ms-powerpoint';

        if (file.data.startsWith('data:')) {
            const response = await fetch(file.data);
            const blob = await response.blob();
            return new Blob([blob], { type: mimeType });
        }

        // Handle base64 data
        const byteCharacters = atob(file.data);
        const byteArrays = [];
        const sliceSize = 512;

        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);
            const byteNumbers = new Array(slice.length);
            
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            
            byteArrays.push(new Uint8Array(byteNumbers));
        }

        return new Blob(byteArrays, { type: mimeType });
    } catch (error) {
        console.error('Error creating presentation blob:', error);
        throw new Error('Could not process presentation file');
    }
}

// Function to open presentation in new window
function openInNewWindow(blobUrl, fileName) {
    const previewWindow = window.open('', '_blank');
    if (!previewWindow) {
        alert('Pop-up blocked. Please allow pop-ups for this site.');
        return;
    }

    previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>${decodeURIComponent(fileName)} - PowerPoint Online</title>
                <style>
                    body, html {
                        margin: 0;
                        padding: 0;
                        height: 100vh;
                        overflow: hidden;
                    }
                    iframe {
                        width: 100%;
                        height: 100%;
                        border: none;
                    }
                </style>
            </head>
            <body>
                <iframe src="https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(decodeURIComponent(blobUrl))}"
                        frameborder="0"
                        allowfullscreen>
                </iframe>
            </body>
        </html>
    `);
}

// User management functions
function saveUser(userData) {
    try {
        const users = getUsers();
        const existingUserIndex = users.findIndex(u => u.username === userData.username);
        
        if (existingUserIndex >= 0) {
            users[existingUserIndex] = { ...users[existingUserIndex], ...userData };
        } else {
            users.push(userData);
        }
        
        localStorage.setItem(DB_CONFIG.USERS_KEY, JSON.stringify(users));
        return true;
    } catch (error) {
        console.error('Error saving user:', error);
        return false;
    }
}

function getUsers() {
    try {
        return JSON.parse(localStorage.getItem(DB_CONFIG.USERS_KEY) || '[]');
    } catch (error) {
        console.error('Error getting users:', error);
        return [];
    }
}

function deleteUser(username) {
    try {
        const users = getUsers();
        const filteredUsers = users.filter(u => u.username !== username);
        localStorage.setItem(DB_CONFIG.USERS_KEY, JSON.stringify(filteredUsers));
        return true;
    } catch (error) {
        console.error('Error deleting user:', error);
        return false;
    }
}

// Login history functions
function addLoginRecord(username, userType, status) {
    try {
        const loginHistory = getLoginHistory();
        const newRecord = {
            username,
            userType,
            status, // 'success' or 'failed'
            timestamp: new Date().toISOString(),
            ipAddress: 'N/A', // You can implement IP detection if needed
            userAgent: navigator.userAgent
        };
        
        loginHistory.unshift(newRecord); // Add to beginning of array
        
        // Keep only the latest MAX_LOGIN_HISTORY records
        if (loginHistory.length > DB_CONFIG.MAX_LOGIN_HISTORY) {
            loginHistory.length = DB_CONFIG.MAX_LOGIN_HISTORY;
        }
        
        localStorage.setItem(DB_CONFIG.LOGIN_HISTORY_KEY, JSON.stringify(loginHistory));
        return true;
    } catch (error) {
        console.error('Error adding login record:', error);
        return false;
    }
}

function getLoginHistory() {
    try {
        return JSON.parse(localStorage.getItem(DB_CONFIG.LOGIN_HISTORY_KEY) || '[]');
    } catch (error) {
        console.error('Error getting login history:', error);
        return [];
    }
}

// Update the login function
async function login(username, password) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Store user info in session
            sessionStorage.setItem('userType', data.user.role);
            sessionStorage.setItem('username', data.user.username);
            sessionStorage.setItem('userId', data.user.id);

            // Redirect based on role
            switch (data.user.role) {
                case 'admin':
                    window.location.href = 'admin-dashboard.html';
                    break;
                case 'teacher':
                    window.location.href = 'teacher-dashboard.html';
                    break;
                case 'student':
                    window.location.href = 'student-dashboard.html';
                    break;
                default:
                    window.location.href = 'index.html';
            }
            return true;
        } else {
            throw new Error(data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert(error.message || 'Failed to login. Please try again.');
        return false;
    }
}

// Add admin database management interface
function showAdminDashboard() {
    if (sessionStorage.getItem('userType') !== 'admin') {
        alert('Access denied. Admin privileges required.');
        return;
    }

    const container = document.getElementById('adminContainer') || document.createElement('div');
    container.id = 'adminContainer';
    container.innerHTML = `
        <div class="admin-dashboard">
            <div class="admin-section">
                <h2>User Management</h2>
                <button onclick="showAddUserForm()" class="admin-button">Add New User</button>
                <div class="user-list">
                    ${generateUserList()}
                </div>
            </div>
            <div class="admin-section">
                <h2>Login History</h2>
                <div class="login-history">
                    ${generateLoginHistory()}
                </div>
            </div>
        </div>
    `;

    // Add admin dashboard styles
    const style = document.createElement('style');
    style.textContent = `
        .admin-dashboard {
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }
        .admin-section {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .admin-section h2 {
            margin-top: 0;
            color: #333;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 10px;
        }
        .admin-button {
            background: #007bff;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-bottom: 20px;
        }
        .admin-button:hover {
            background: #0056b3;
        }
        .user-list {
            display: grid;
            gap: 10px;
        }
        .user-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 4px;
            border: 1px solid #dee2e6;
        }
        .user-info {
            flex: 1;
        }
        .user-actions {
            display: flex;
            gap: 10px;
        }
        .edit-button {
            background: #28a745;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
        }
        .delete-button {
            background: #dc3545;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
        }
        .login-history {
            max-height: 500px;
            overflow-y: auto;
        }
        .login-record {
            padding: 10px;
            border-bottom: 1px solid #dee2e6;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr auto;
            gap: 10px;
            align-items: center;
        }
        .login-record:nth-child(even) {
            background: #f8f9fa;
        }
        .status-success {
            color: #28a745;
        }
        .status-failed {
            color: #dc3545;
        }
        .user-form {
            background: white;
            padding: 20px;
            border-radius: 8px;
            max-width: 400px;
            margin: 20px auto;
        }
        .form-group {
            margin-bottom: 15px;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            color: #333;
        }
        .form-group input, .form-group select {
            width: 100%;
            padding: 8px;
            border: 1px solid #dee2e6;
            border-radius: 4px;
        }
        .form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 20px;
        }
    `;
    document.head.appendChild(style);

    // Add to page content
    const mainContent = document.getElementById('mainContent') || document.body;
    mainContent.appendChild(container);
}

// Generate user list HTML
function generateUserList() {
    const users = getUsers();
    return users.map(user => `
        <div class="user-item">
            <div class="user-info">
                <strong>${user.username}</strong> (${user.userType})
                <div class="user-details">
                    Last login: ${getLastLogin(user.username)}
                </div>
            </div>
            <div class="user-actions">
                <button onclick="editUser('${user.username}')" class="edit-button">Edit</button>
                <button onclick="confirmDeleteUser('${user.username}')" class="delete-button">Delete</button>
            </div>
        </div>
    `).join('');
}

// Generate login history HTML
function generateLoginHistory() {
    const history = getLoginHistory();
    return history.map(record => `
        <div class="login-record">
            <div>${record.username}</div>
            <div>${record.userType}</div>
            <div class="status-${record.status}">${record.status}</div>
            <div>${new Date(record.timestamp).toLocaleString()}</div>
        </div>
    `).join('');
}

// Get last login time for a user
function getLastLogin(username) {
    const history = getLoginHistory();
    const lastLogin = history.find(record => 
        record.username === username && record.status === 'success'
    );
    return lastLogin ? new Date(lastLogin.timestamp).toLocaleString() : 'Never';
}

// Show add/edit user form
function showAddUserForm(userData = null) {
    const formContainer = document.createElement('div');
    formContainer.className = 'user-form';
    formContainer.innerHTML = `
        <h3>${userData ? 'Edit User' : 'Add New User'}</h3>
        <form onsubmit="saveUserData(event)">
            <div class="form-group">
                <label for="username">Username</label>
                <input type="text" id="username" name="username" required 
                       value="${userData?.username || ''}" 
                       ${userData ? 'readonly' : ''}>
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" 
                       ${userData ? 'placeholder="Leave blank to keep current"' : 'required'}>
            </div>
            <div class="form-group">
                <label for="userType">User Type</label>
                <select id="userType" name="userType" required>
                    <option value="admin" ${userData?.userType === 'admin' ? 'selected' : ''}>Admin</option>
                    <option value="teacher" ${userData?.userType === 'teacher' ? 'selected' : ''}>Teacher</option>
                    <option value="student" ${userData?.userType === 'student' ? 'selected' : ''}>Student</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="button" onclick="this.closest('.user-form').remove()" class="admin-button">Cancel</button>
                <button type="submit" class="admin-button">Save</button>
            </div>
        </form>
    `;
    document.querySelector('.admin-dashboard').appendChild(formContainer);
}

// Save user data
function saveUserData(event) {
    event.preventDefault();
    const form = event.target;
    const userData = {
        username: form.username.value,
        userType: form.userType.value
    };

    if (form.password.value) {
        userData.password = form.password.value;
    }

    if (saveUser(userData)) {
        form.closest('.user-form').remove();
        showAdminDashboard(); // Refresh the dashboard
    } else {
        alert('Error saving user data');
    }
}

// Confirm and delete user
function confirmDeleteUser(username) {
    if (confirm(`Are you sure you want to delete user "${username}"?`)) {
        if (deleteUser(username)) {
            showAdminDashboard(); // Refresh the dashboard
        } else {
            alert('Error deleting user');
        }
    }
}

// Edit user
function editUser(username) {
    const user = getUsers().find(u => u.username === username);
    if (user) {
        showAddUserForm(user);
    }
}

// Add admin section button to the dashboard
document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('userType') === 'admin') {
        const adminButton = document.createElement('button');
        adminButton.className = 'admin-button';
        adminButton.textContent = 'Admin Dashboard';
        adminButton.onclick = showAdminDashboard;
        document.querySelector('.header-controls').appendChild(adminButton);
    }
}); 