import axios from 'axios';

export const api = axios.create({
    baseURL: 'http://localhost:5000/api', // URL backend à adapter
    withCredentials: true, // pour cookie JWT si backend le fait
    headers: {
        'Content-Type': 'application/json'
    }
});