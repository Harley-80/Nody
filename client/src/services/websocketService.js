import { io } from 'socket.io-client';
import { api } from './api';

// Service de gestion des WebSockets
let socket = null;
const listeners = new Map();

// Connexion au serveur WebSocket
export const websocketService = {
    connect: () => {
        if (socket?.connected) return;

        const token =
            localStorage.getItem('token') || sessionStorage.getItem('token');

        socket = io('http://localhost:5000', {
            auth: { token },
            transports: ['websocket', 'polling'],
        });

        socket.on('connect', () => {
            console.log('WebSocket connecté');
            socket.emit('notifications:subscribe');
        });

        socket.on('disconnect', () => {
            console.log('WebSocket déconnecté');
        });

        socket.on('notification:generique', data => {
            emit('notification:generique', data);
        });

        socket.on('notification:nouveau-produit', data => {
            emit('notification:nouveau-produit', data);
        });

        socket.on('notification:nouveau-vendeur', data => {
            emit('notification:nouveau-vendeur', data);
        });

        socket.on('notification:decision-verification', data => {
            emit('notification:decision-verification', data);
        });

        socket.on('connection:established', data => {
            emit('connection:established', data);
        });

        socket.on('error', error => {
            console.error('Erreur WebSocket:', error);
        });
    },

    // Déconnexion du serveur WebSocket
    disconnect: () => {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
        listeners.clear();
    },

    // Gestion des événements
    on: (event, callback) => {
        if (!listeners.has(event)) {
            listeners.set(event, []);
        }
        listeners.get(event).push(callback);
    },

    // Retrait des écouteurs d'événements
    off: (event, callback) => {
        if (listeners.has(event)) {
            const callbacks = listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    },
    
    emit: (event, data) => {
        if (socket) {
            socket.emit(event, data);
        }
    },
};

// Émission des événements aux écouteurs enregistrés
const emit = (event, data) => {
    if (listeners.has(event)) {
        listeners.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Erreur listener ${event}:`, error);
            }
        });
    }
};