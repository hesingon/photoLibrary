import { useState, ChangeEvent, FormEvent } from 'react';
import { BACKEND } from 'api/connections';

function UploadPhotos() {
  const [title, setTitle] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);

  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files && event.target.files[0];
    setFile(selectedFile || null);
  };

  const handleUploadSuccess = () => {
    const result = window.confirm('Upload successful. Click OK to refresh the page.');
    if (result) {
      window.location.reload();
    }
    // Perform any image update logic here
    // Example: Call a function to fetch updated images and update state
  };

  const handleUploadFailure = () => {
    alert('Upload failed');
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (file) {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('upl', file);

      const endpoint = `${BACKEND}/upload`;
      fetch(endpoint, {
        method: 'POST',
        body: formData,
      })
        .then((response) => {
          if (response.status === 200) {
            handleUploadSuccess();
          } else {
            handleUploadFailure();
          }
        })
        .catch((error) => {
          handleUploadFailure();
        });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <p>
        <input
          type="file"
          name="upl"
          onChange={handleFileChange}
        />
      </p>

      <p>
        <input type="submit" value="Upload" />
      </p>
    </form>
  );
}

export default UploadPhotos;
