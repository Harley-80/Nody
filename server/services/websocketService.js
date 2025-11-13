import { Server } from 'socket.io';
import logger from '../utils/logger.js';

// Service WebSocket pour les notifications en temps réel aux administrateurs
class WebSocketService {
    constructor() {
        this.io = null;
        this.connectedAdmins = new Set();
    }

    initialize(server) {
        this.io = new Server(server, {
            cors: {
                origin: process.env.CLIENT_URL || 'http://localhost:3000',
                methods: ['GET', 'POST'],
            },
        });

        this.setupEventHandlers();
        logger.info('🔌 Service WebSocket initialisé');
    }

    // Configuration des gestionnaires d'événements
    setupEventHandlers() {
        this.io.on('connection', socket => {
            logger.info(`Nouvelle connexion WebSocket: ${socket.id}`);

            // Authentification admin
            socket.on('authenticate_admin', adminData => {
                if (adminData.role === 'admin') {
                    this.connectedAdmins.add(socket.id);
                    socket.join('admins');
                    logger.info(
                        `Admin ${adminData.email} connecté via WebSocket`
                    );

                    // Notifier de la connexion
                    socket.emit('authenticated', {
                        message: "Connecté en tant qu'administrateur",
                        socketId: socket.id,
                    });
                }
            });

            // Gestion de la déconnexion
            socket.on('disconnect', () => {
                this.connectedAdmins.delete(socket.id);
                logger.info(`Déconnexion WebSocket: ${socket.id}`);
            });

            // Rejoindre une room spécifique pour les notifications
            socket.on('join_notifications', () => {
                socket.join('notifications');
            });
        });
    }

    // Notifier les admins d'une nouvelle demande
    notifierNouvelleDemande(demande) {
        if (this.io) {
            this.io.to('admins').emit('nouvelle_demande', {
                type: 'nouvelle_demande',
                data: demande,
                timestamp: new Date(),
                message: `Nouvelle demande ${demande.role} de ${demande.prenom} ${demande.nom}`,
            });
            logger.info(
                `Notification nouvelle demande envoyée: ${demande.email}`
            );
        }
    }

    // Notifier de l'approbation d'une demande
    notifierApprobationDemande(demande, admin) {
        if (this.io) {
            this.io.to('admins').emit('demande_approuvee', {
                type: 'demande_approuvee',
                data: demande,
                admin: admin.email,
                timestamp: new Date(),
                message: `Demande de ${demande.prenom} ${demande.nom} approuvée par ${admin.email}`,
            });
        }
    }

    // Notifier du rejet d'une demande
    notifierRejetDemande(demande, admin, raison) {
        if (this.io) {
            this.io.to('admins').emit('demande_rejetee', {
                type: 'demande_rejetee',
                data: demande,
                admin: admin.email,
                raison: raison,
                timestamp: new Date(),
                message: `Demande de ${demande.prenom} ${demande.nom} rejetée par ${admin.email}`,
            });
        }
    }

    // Obtenir le nombre d'admins connectés
    getConnectedAdminsCount() {
        return this.connectedAdmins.size;
    }

    // Envoyer une notification à un admin spécifique
    envoyerNotificationAdmin(adminId, notification) {
        if (this.io) {
            this.io.to(adminId).emit('notification_admin', notification);
        }
    }
}

// Instance singleton
export default new WebSocketService();
