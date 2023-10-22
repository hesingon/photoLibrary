import { BACKEND } from "./connections";
import axios from 'axios';

export async function getPhotoList() {
    const url = BACKEND +  '/list-photos'
    return await axios.get(url);
}

export async function getPhoto(key: string) {
    const url = `${BACKEND}/photo/${key}`
    return await axios.get(url);
}

export async function deletePhoto(key: string) {
    const url = `${BACKEND}/photo/${key}`
    return await axios.delete(url);
}

export async function updatePhotoAccess(key: string, isPublic: boolean) {
    const url = `${BACKEND}/photo-access/${key}`;
    const requestBody = {
        photoKey: key,
        isPublic: isPublic,
    };

    return await axios.put(url, requestBody)
        .then(response => response.data)
        .catch(error => {
            console.error('Error updating photo access:', error);
            throw error;
        });
}