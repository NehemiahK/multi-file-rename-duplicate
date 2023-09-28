document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const loader = document.getElementById('loader');
    const downloadLink = document.getElementById('downloadLink');

    // Initially, hide the loader and download link
    loader.style.display = 'none';
    downloadLink.style.display = 'none';

    uploadForm.addEventListener('submit', (event) => {
        event.preventDefault();

        // Show the loader when the form is submitted
        loader.style.display = 'block';

        // Disable the submit button to prevent multiple submissions
        const submitButton = uploadForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        // Submit the form asynchronously
        const formData = new FormData(uploadForm);
        fetch('/upload', {
            method: 'POST',
            body: formData,
        })
        .then((response) => response.blob())
        .then((blob) => {
            // Hide the loader once the response is received
            loader.style.display = 'none';

            // Enable the submit button again
            submitButton.disabled = false;

            // Show the download link with the generated ZIP file
            downloadLink.style.display = 'block';

            // Create a URL for the blob and set it as the download link href
            const url = window.URL.createObjectURL(blob);
            downloadLink.href = url;
        })
        .catch((error) => {
            console.error('Error:', error);

            // Hide the loader on error
            loader.style.display = 'none';

            // Enable the submit button again
            submitButton.disabled = false;

            // Show an alert indicating the error
            alert('Failed to duplicate PDFs. Please try again.');
        });
    });
});
