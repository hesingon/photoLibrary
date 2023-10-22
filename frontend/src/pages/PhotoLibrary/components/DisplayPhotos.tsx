import { useEffect, useState } from 'react';
import {
  getPhotoList,
  deletePhoto,
  updatePhotoAccess,
} from 'api/photos'; // Import the API functions
import { S3_URL } from 'api/connections';
import { checkIsAdmin } from 'pages/PhotoLibrary/components/util';

interface PhotoItem{
  key: string,
  isPublic: boolean
}

function DisplayPhotos() {
  const [isAdmin, setIsAdmin] = useState<Boolean>(false);
  const [photoKeys, setPhotoKeys] = useState<string[]>([]);
  const [photoAccess, setPhotoAccess] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    // Fetch the list of photo keys and their access states from the server
    getPhotoList()
      .then((response) => {
        const keysWithAccess = response.data;
        setPhotoKeys(keysWithAccess.map((item: PhotoItem) => item.key));
        const accessStates = keysWithAccess.reduce((acc: any, item: any) => {
          acc[item.key] = item.isPublic;
          return acc;
        }, {});
        setPhotoAccess(accessStates);
        // setIsAdmin(checkIsAdmin());
      })
      .catch((error) => console.error(error));
  }, []);

  const handleDeletePhoto = (key: string) => {
    // Send an API request to delete the photo
    deletePhoto(key)
      .then((response) => {
        if (response.status === 200) {
          // Photo deleted successfully, remove it from the state
          setPhotoKeys((prevKeys) => prevKeys.filter((k) => k !== key));
        } else {
          console.error('Failed to delete the photo.');
        }
      })
      .catch((error) => console.error(error));
  };

  const handleToggleAccess = (key: string) => {
    // Send an API request to update photo access
    const newAccessState = !photoAccess[key];
    updatePhotoAccess(key, newAccessState) // Toggle the access state
      .then((response) => {
        if (response.status === 200) {
          // Photo access updated successfully
          setPhotoAccess((prevAccess) => ({
            ...prevAccess,
            [key]: newAccessState, // Update the access state in the state
          }));
        } else {
          console.error('Failed to update photo access.');
        }
      })
      .catch((error) => console.error(error));
  };

  // const adminList = ['e0007888@u.nus.edu']

  // function checkIsAdmin() {
  //     return adminList.includes(localStorage.getItem('username') || '');
  // }
  return (
    <div>
      {photoKeys.map((key) => {
        if (checkIsAdmin()) {
          return (
            <div key={key} style={{ display: 'flex', flexDirection: 'row' }}>
              <img
                src={`${S3_URL}${key}`}
                alt={key}
                style={{ width: '400px', height: '400px', margin: '0 0 30px 0' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label>
                  <input
                    type="checkbox"
                    checked={photoAccess[key] || false}
                    onChange={() => handleToggleAccess(key)}
                  />
                  Public
                </label>
                <button onClick={() => handleDeletePhoto(key)}>Delete</button>
              </div>
            </div>
          );
        } else if (photoAccess[key]) {
          return (
            <div key={key}>
              <img
                src={`${S3_URL}${key}`}
                alt={key}
                style={{ width: '400px', height: '400px', margin: '0 0 30px 0' }}
              />
            </div>
          );
        }
  
        return null; // No render when not admin and photo is not public
      })}
    </div>
  );
  
  
}

export default DisplayPhotos;
