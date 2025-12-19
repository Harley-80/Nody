import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import logger from '../utils/logger.js';
import Utilisateur from '../models/utilisateurModel.js';
import vendeurWebSocketService from './vendeurWebSocketService.js';

// Instance Socket.io
let io;
const utilisateursConnectes = new Map();

/**
 * Initialisation du service WebSocket avec logging renforcé
 */
export const initialiserWebSocket = server => {
    try {
        io = new Server(server, {
            cors: {
                origin:
                    process.env.NODE_ENV === 'development'
                        ? [
                              'http://localhost:5173',
                              'http://127.0.0.1:5173',
                              'http://localhost:5000',
                          ]
                        : config.clientUrl,
                credentials: true,
                methods: ['GET', 'POST', 'PUT', 'DELETE'],
            },
            transports: ['websocket', 'polling'],
            allowEIO3: true,
            pingTimeout: 60000,
            pingInterval: 25000,
            connectTimeout: 45000,
        });

        console.log('🚀 WebSocket Server initialisé sur le serveur HTTP');
        logger.info('WebSocket Server créé');

        // 🎯 INITIALISER LE SERVICE VENDEUR
        vendeurWebSocketService.initialiser(io);

        // Middleware d'authentification JWT
        io.use(async (socket, next) => {
            try {
                const token =
                    socket.handshake.auth?.token ||
                    socket.handshake.headers?.authorization?.replace(
                        'Bearer ',
                        ''
                    );

                if (!token) {
                    logger.debug('Connexion WebSocket sans token (guest mode)');
                    socket.utilisateur = { role: 'guest' };
                    return next();
                }

                const decoded = jwt.verify(token, config.jwtSecret);
                const utilisateur = await Utilisateur.findById(
                    decoded.id
                ).select('-motDePasse');

                if (!utilisateur) {
                    return next(new Error('Utilisateur non trouvé'));
                }

                socket.utilisateur = utilisateur;
                logger.debug(`WebSocket: ${utilisateur.email} authentifié`);
                next();
            } catch (error) {
                logger.warn(`Erreur auth WebSocket: ${error.message}`);
                socket.utilisateur = { role: 'guest' };
                next();
            }
        });

        // Gestion globale des événements de connexion
        io.on('connection', socket => {
            const utilisateur = socket.utilisateur;
            const clientId = socket.id;

            console.log('🔌 Client WebSocket connecté:', clientId);
            logger.info(`WebSocket connecté: ${clientId}`);

            // Gestion de l'identité utilisateur connectée
            if (utilisateur && utilisateur._id) {
                const userIdStr = utilisateur._id.toString();

                utilisateursConnectes.set(userIdStr, {
                    socketId: clientId,
                    utilisateur: {
                        id: utilisateur._id,
                        nom: `${utilisateur.prenom || ''} ${utilisateur.nom || ''}`.trim(),
                        email: utilisateur.email,
                        role: utilisateur.role,
                    },
                });

                logger.info(
                    `${utilisateur.email} (${utilisateur.role}) connecté [ID: ${userIdStr}]`
                );

                // Rejoindre les rooms par défaut
                socket.join(`user:${userIdStr}`);
                if (utilisateur.role) {
                    socket.join(`role:${utilisateur.role}`);
                }

                // 🏪 Room spécifique VENDEUR
                if (utilisateur.role === 'vendeur') {
                    socket.join(`vendeur_${userIdStr}`);
                    if (utilisateur.boutique?._id) {
                        socket.join(`boutique_${utilisateur.boutique._id}`);
                    }
                    console.log(
                        `🏪 Vendeur ${utilisateur.email} a rejoint ses rooms.`
                    );
                }

                // 🛡️ Room spécifique MODÉRATEUR / ADMIN
                if (
                    utilisateur.role === 'moderateur' ||
                    utilisateur.role === 'admin'
                ) {
                    const room =
                        utilisateur.role === 'admin' ? 'admins' : 'moderateurs';
                    socket.join(room);
                    console.log(
                        `🛡️ Staff (${utilisateur.role}) connecté à la room: ${room}`
                    );
                }

                socket.emit('connection:established', {
                    message: 'Connexion WebSocket établie avec succès',
                    userId: utilisateur._id,
                    timestamp: new Date().toISOString(),
                });
            } else {
                console.log(`👤 Connexion anonyme: ${clientId}`);
                socket.emit('connection:established', {
                    message: 'Connexion WebSocket établie (guest)',
                    timestamp: new Date().toISOString(),
                });
            }

            // --- ÉVÉNEMENTS SOCKET ---

            socket.on('notifications:subscribe', () => {
                socket.join('notifications');
                logger.info(`${clientId} abonné au flux global notifications`);
            });

            socket.on('ping', () => {
                socket.emit('pong', { timestamp: new Date().toISOString() });
            });

            socket.on('disconnect', reason => {
                console.log(
                    '🔌 Client WebSocket déconnecté:',
                    clientId,
                    '| Raison:',
                    reason
                );

                // Nettoyage de la Map
                for (const [userId, data] of utilisateursConnectes.entries()) {
                    if (data.socketId === clientId) {
                        utilisateursConnectes.delete(userId);
                        logger.info(
                            `${data.utilisateur.email} retiré des utilisateurs connectés`
                        );
                        break;
                    }
                }
            });

            socket.on('error', error => {
                logger.error(`Erreur WebSocket sur socket ${clientId}:`, error);
            });
        });

        logger.info('✅ WebSocket Service initialisé avec succès');
        return io;
    } catch (error) {
        console.error('❌ Erreur critique initialisation WebSocket:', error);
        logger.error('Erreur initialisation WebSocket:', error);
        return null;
    }
};

// --- FONCTIONS DE NOTIFICATION ---

export const notifierNouvelleCommande = commande => {
    if (!io) return;
    io.to('role:admin').emit('notification:nouvelle-commande', {
        type: 'nouvelle_commande',
        titre: 'Nouvelle Commande',
        message: `Commande #${commande.numeroCommande || commande._id} reçue`,
        donnees: {
            id: commande._id,
            numero: commande.numeroCommande,
            montant: commande.total,
        },
        timestamp: new Date().toISOString(),
    });
};

export const notifierNouvelleInscription = utilisateur => {
    if (!io) return;
    io.to('role:admin').emit('notification:nouvelle-inscription', {
        type: 'nouvelle_inscription',
        titre: 'Nouvelle Inscription',
        message: `${utilisateur.prenom} ${utilisateur.nom} vient de s'inscrire`,
        donnees: {
            id: utilisateur._id,
            email: utilisateur.email,
            role: utilisateur.role,
        },
        timestamp: new Date().toISOString(),
    });
};

export const notifierDecisionVerification = (
    utilisateurCible,
    statut,
    raison = null
) => {
    if (!io) return;
    io.to(`user:${utilisateurCible._id.toString()}`).emit(
        'notification:decision-verification',
        {
            type: 'decision_verification',
            titre: statut === 'verifie' ? 'Compte Vérifié' : 'Demande Rejetée',
            message:
                statut === 'verifie'
                    ? 'Félicitations, votre compte a été vérifié !'
                    : `Demande rejetée: ${raison}`,
            donnees: { statut, raison },
            timestamp: new Date().toISOString(),
        }
    );
};

export const notifierNouveauProduit = produit => {
    if (!io) return;
    const eventData = {
        type: 'nouveau_produit',
        titre: 'Nouveau Produit à Vérifier',
        message: `Nouveau produit "${produit.nom}" soumis`,
        donnees: { produitId: produit._id, nom: produit.nom },
        timestamp: new Date().toISOString(),
    };
    io.to('role:moderateur')
        .to('role:admin')
        .emit('notification:nouveau-produit', eventData);
};

export const obtenirUtilisateursConnectes = () => {
    return Array.from(utilisateursConnectes.values()).map(u => u.utilisateur);
};

/**
 * Fonction pour envoyer une notification à un channel spécifique
 * Utilisé par moderateurController.js
 */
export const emitNotification = (notification, channel) => {
    if (!io) {
        console.warn(
            'WebSocket non initialisé, notification ignorée:',
            notification.titre
        );
        return;
    }

    console.log(`WebSocket emit: ${notification.titre} → ${channel}`);

    // Si le channel commence par "role:", envoyer à tous les utilisateurs de ce rôle
    if (channel.startsWith('role:')) {
        io.to(channel).emit('notification', notification);
    }
    // Si le channel commence par "user:", envoyer à un utilisateur spécifique
    else if (channel.startsWith('user:')) {
        io.to(channel).emit('notification:user', notification);
    }
    // Sinon, envoyer au channel tel quel
    else {
        io.to(channel).emit('notification', notification);
    }

    logger.info(`Notification envoyée: ${notification.titre} → ${channel}`);
};

// --- EXPORTS ---

export default {
    initialiserWebSocket,
    notifierNouvelleCommande,
    notifierNouvelleInscription,
    notifierDecisionVerification,
    notifierNouveauProduit,
    obtenirUtilisateursConnectes,
    emitNotification,
};
