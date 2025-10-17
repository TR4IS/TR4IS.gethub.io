document.addEventListener('DOMContentLoaded', function () {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const filePreview = document.getElementById('file-preview');
    const fileList = document.getElementById('file-list');
    const clearBtn = document.getElementById('clear-btn');
    const uploadForm = document.getElementById('upload-form');

    // Trigger file input click when upload area is clicked
    uploadArea.addEventListener('click', () => fileInput.click());

    // Handle file selection
    fileInput.addEventListener('change', handleFiles);

    // Drag and Drop events
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        fileInput.files = e.dataTransfer.files;
        handleFiles();
    });

    function handleFiles() {
        if (fileInput.files.length === 0) {
            showUploadArea();
            return;
        }
        
        showFilePreview();
        fileList.innerHTML = ''; // Clear previous list

        Array.from(fileInput.files).forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.textContent = file.name;
            fileList.appendChild(fileItem);
        });
    }

    function showUploadArea() {
        uploadArea.style.display = 'block';
        filePreview.style.display = 'none';
    }

    function showFilePreview() {
        uploadArea.style.display = 'none';
        filePreview.style.display = 'block';
    }
    
    // Clear button functionality
    clearBtn.addEventListener('click', () => {
        fileInput.value = ''; // Reset the file input
        showUploadArea();
    });
    
    // Optional: Show loading state on form submit
    uploadForm.addEventListener('submit', () => {
        const convertBtn = document.getElementById('convert-btn');
        convertBtn.textContent = 'Converting...';
        convertBtn.disabled = true;
    });
});