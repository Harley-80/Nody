import React, { useState, useEffect, useRef } from 'react';
import { vendeurService } from '../../services/vendeurService';
import { notificationService } from '../../services/notificationService';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { websocketService } from '../../services/websocketService';
import './Messages.scss';

const Messages = () => {
    const { addToast } = useToast();
    const { user } = useAuth();
    const messagesEndRef = useRef(null);

    const [messages, setMessages] = useState([]);
    const [conversations, setConversations] = useState([
        {
            id: 'admin-1',
            type: 'admin',
            nom: 'Support Administratif',
            avatar: '👨‍💼',
            lastMessage: 'Votre produit a été approuvé avec succès',
            unread: 2,
            online: true,
            lastActive: '2 min',
        },
        {
            id: 'mod-1',
            type: 'moderateur',
            nom: 'Équipe Modération',
            avatar: '👮‍♂️',
            lastMessage: 'Documentation supplémentaire requise',
            unread: 1,
            online: true,
            lastActive: '5 min',
        },
        {
            id: 'client-1',
            type: 'client',
            nom: 'Ethan',
            avatar: '👩',
            lastMessage: 'Livraison arrivée, merci !',
            unread: 0,
            online: false,
            lastActive: '2h',
        },
        {
            id: 'client-2',
            type: 'client',
            nom: 'Kevin',
            avatar: '👨',
            lastMessage: 'Question sur la taille',
            unread: 3,
            online: true,
            lastActive: 'maintenant',
        },
    ]);

    const [activeConversation, setActiveConversation] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [showNotifications, setShowNotifications] = useState(true);
    const [typing, setTyping] = useState(false);
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        // Initialiser la connexion WebSocket
        websocketService.connect();

        // S'abonner aux messages
        websocketService.on('message:new', handleNewMessage);
        websocketService.on('message:typing', handleTyping);

        // Charger les conversations
        chargerConversations();

        return () => {
            websocketService.off('message:new', handleNewMessage);
            websocketService.off('message:typing', handleTyping);
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const chargerConversations = async () => {
        try {
            setLoading(true);
            // Simuler le chargement des conversations
            setTimeout(() => {
                setLoading(false);
            }, 1000);
        } catch (error) {
            addToast({
                type: 'error',
                title: 'Erreur',
                message: 'Impossible de charger les conversations',
            });
        }
    };

    const chargerMessages = conversationId => {
        const mockMessages = [
            {
                id: 1,
                sender: conversationId,
                content:
                    'Bonjour, je souhaite avoir des informations sur vos produits.',
                timestamp: '10:30',
                read: true,
                type: 'received',
            },
            {
                id: 2,
                sender: user?.id,
                content:
                    'Bonjour ! Avec plaisir. De quel produit parlez-vous ?',
                timestamp: '10:32',
                read: true,
                type: 'sent',
            },
            {
                id: 3,
                sender: conversationId,
                content:
                    'Je suis intéressé par le T-Shirt Premium. Est-il disponible en taille L ?',
                timestamp: '10:33',
                read: true,
                type: 'received',
            },
            {
                id: 4,
                sender: user?.id,
                content:
                    'Oui, nous avons la taille L en stock. Il reste 5 unités.',
                timestamp: '10:35',
                read: true,
                type: 'sent',
            },
            {
                id: 5,
                sender: conversationId,
                content:
                    'Parfait ! Je vais passer commande. Quel est le délai de livraison ?',
                timestamp: '10:36',
                read: false,
                type: 'received',
            },
        ];

        setMessages(mockMessages);
        setActiveConversation(conversationId);

        // Marquer comme lu
        setConversations(prev =>
            prev.map(conv =>
                conv.id === conversationId ? { ...conv, unread: 0 } : conv
            )
        );
    };

    const handleNewMessage = messageData => {
        if (messageData.conversationId === activeConversation) {
            setMessages(prev => [
                ...prev,
                {
                    id: Date.now(),
                    sender: messageData.senderId,
                    content: messageData.content,
                    timestamp: new Date().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                    }),
                    read: false,
                    type: 'received',
                },
            ]);
        } else {
            // Mettre à jour le compteur de messages non lus
            setConversations(prev =>
                prev.map(conv =>
                    conv.id === messageData.conversationId
                        ? {
                              ...conv,
                              unread: conv.unread + 1,
                              lastMessage: messageData.content,
                          }
                        : conv
                )
            );

            // Afficher une notification toast
            const conversation = conversations.find(
                c => c.id === messageData.conversationId
            );
            if (conversation) {
                addToast({
                    type: 'info',
                    title: `Nouveau message de ${conversation.nom}`,
                    message: messageData.content.substring(0, 50) + '...',
                });
            }
        }
    };

    const handleTyping = data => {
        if (data.conversationId === activeConversation) {
            setTyping(true);
            setTimeout(() => setTyping(false), 2000);
        }
    };

    const envoyerMessage = () => {
        if (!newMessage.trim() || !activeConversation) return;

        const message = {
            id: Date.now(),
            sender: user?.id,
            content: newMessage,
            timestamp: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
            }),
            read: true,
            type: 'sent',
        };

        setMessages(prev => [...prev, message]);
        setNewMessage('');

        // Simuler l'envoi via WebSocket
        websocketService.emit('message:send', {
            conversationId: activeConversation,
            content: newMessage,
            senderId: user?.id,
            timestamp: new Date().toISOString(),
        });

        // Mettre à jour la dernière conversation
        setConversations(prev =>
            prev.map(conv =>
                conv.id === activeConversation
                    ? { ...conv, lastMessage: newMessage }
                    : conv
            )
        );

        // Simuler une réponse automatique après 2 secondes
        setTimeout(() => {
            const autoResponses = [
                'Merci pour votre message !',
                'Nous traitons votre demande.',
                'Je reviens vers vous sous peu.',
                'Informations bien reçues.',
                'Pouvez-vous préciser votre demande ?',
            ];

            const response = {
                id: Date.now() + 1,
                sender: activeConversation,
                content:
                    autoResponses[
                        Math.floor(Math.random() * autoResponses.length)
                    ],
                timestamp: new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                }),
                read: false,
                type: 'received',
            };

            setMessages(prev => [...prev, response]);
        }, 2000);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const filteredConversations = conversations
        .filter(conv => {
            if (filterType === 'all') return true;
            if (filterType === 'unread') return conv.unread > 0;
            if (filterType === 'online') return conv.online;
            return conv.type === filterType;
        })
        .filter(
            conv =>
                conv.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
                conv.lastMessage
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())
        );

    const getConversationAvatar = (type, avatar) => {
        if (avatar) return avatar;

        switch (type) {
            case 'admin':
                return '👨‍💼';
            case 'moderateur':
                return '👮‍♂️';
            case 'client':
                return '👤';
            default:
                return '💬';
        }
    };

    const formatDate = dateString => {
        const date = new Date(dateString);
        const now = new Date();
        const diffHours = Math.floor((now - date) / 3600000);

        if (diffHours < 24) {
            return date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
            });
        } else if (diffHours < 48) {
            return 'Hier';
        } else {
            return date.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
            });
        }
    };

    const renderMessageContent = message => {
        // Détecter les URLs
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = message.content.split(urlRegex);

        return parts.map((part, index) => {
            if (urlRegex.test(part)) {
                return (
                    <a
                        key={index}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="message-link"
                    >
                        {part}
                    </a>
                );
            }
            return part;
        });
    };

    return (
        <div className="messages-vendeur">
            {/* Notifications urgentes */}
            {showNotifications && (
                <div className="urgent-notifications">
                    <div className="notification-banner">
                        <div className="notification-icon">🔔</div>
                        <div className="notification-content">
                            <strong>
                                2 messages nécessitent votre attention
                            </strong>
                            <span>Clients en attente de réponse</span>
                        </div>
                        <button
                            className="btn-close-notif"
                            onClick={() => setShowNotifications(false)}
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            <div className="messages-container">
                {/* Sidebar des conversations */}
                <div className="conversations-sidebar">
                    <div className="sidebar-header">
                        <h2>Messages</h2>
                        <button className="btn-new-chat">
                            <span className="icon">✏️</span>
                            Nouveau
                        </button>
                    </div>

                    {/* Barre de recherche */}
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="Rechercher une conversation..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                        <span className="search-icon">🔍</span>
                    </div>

                    {/* Filtres */}
                    <div className="conversation-filters">
                        <button
                            className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                            onClick={() => setFilterType('all')}
                        >
                            Tous
                        </button>
                        <button
                            className={`filter-btn ${filterType === 'unread' ? 'active' : ''}`}
                            onClick={() => setFilterType('unread')}
                        >
                            Non lus
                        </button>
                        <button
                            className={`filter-btn ${filterType === 'online' ? 'active' : ''}`}
                            onClick={() => setFilterType('online')}
                        >
                            En ligne
                        </button>
                    </div>

                    {/* Liste des conversations */}
                    <div className="conversations-list">
                        {loading ? (
                            <div className="loading-conversations">
                                <div className="spinner"></div>
                                <p>Chargement des conversations...</p>
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="empty-conversations">
                                <span className="icon">💬</span>
                                <p>Aucune conversation</p>
                                <p className="subtext">
                                    Commencez une nouvelle discussion
                                </p>
                            </div>
                        ) : (
                            filteredConversations.map(conv => (
                                <div
                                    key={conv.id}
                                    className={`conversation-item ${activeConversation === conv.id ? 'active' : ''} ${conv.unread > 0 ? 'unread' : ''}`}
                                    onClick={() => chargerMessages(conv.id)}
                                >
                                    <div className="conversation-avatar">
                                        <span className="avatar-icon">
                                            {getConversationAvatar(
                                                conv.type,
                                                conv.avatar
                                            )}
                                        </span>
                                        {conv.online && (
                                            <span className="online-indicator"></span>
                                        )}
                                        {conv.unread > 0 && (
                                            <span className="unread-badge">
                                                {conv.unread}
                                            </span>
                                        )}
                                    </div>

                                    <div className="conversation-info">
                                        <div className="conversation-header">
                                            <h4>{conv.nom}</h4>
                                            <span className="conversation-time">
                                                {conv.lastActive}
                                            </span>
                                        </div>
                                        <p className="conversation-preview">
                                            {conv.lastMessage}
                                        </p>
                                        <div className="conversation-meta">
                                            <span className="conversation-type">
                                                {conv.type}
                                            </span>
                                            {conv.unread > 0 && (
                                                <span className="new-indicator"></span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Statistiques de messages */}
                    <div className="messages-stats">
                        <div className="stat-item">
                            <span className="stat-value">
                                {conversations.length}
                            </span>
                            <span className="stat-label">Conversations</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">
                                {conversations.reduce(
                                    (sum, conv) => sum + conv.unread,
                                    0
                                )}
                            </span>
                            <span className="stat-label">Non lus</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">
                                {conversations.filter(c => c.online).length}
                            </span>
                            <span className="stat-label">En ligne</span>
                        </div>
                    </div>
                </div>

                {/* Zone de conversation principale */}
                <div className="chat-main">
                    {activeConversation ? (
                        <>
                            {/* Header de la conversation */}
                            <div className="chat-header">
                                <div className="chat-user-info">
                                    <div className="user-avatar">
                                        <span className="avatar-icon">
                                            {getConversationAvatar(
                                                conversations.find(
                                                    c =>
                                                        c.id ===
                                                        activeConversation
                                                )?.type,
                                                conversations.find(
                                                    c =>
                                                        c.id ===
                                                        activeConversation
                                                )?.avatar
                                            )}
                                        </span>
                                        <span
                                            className={`status-dot ${conversations.find(c => c.id === activeConversation)?.online ? 'online' : 'offline'}`}
                                        ></span>
                                    </div>
                                    <div className="user-details">
                                        <h3>
                                            {
                                                conversations.find(
                                                    c =>
                                                        c.id ===
                                                        activeConversation
                                                )?.nom
                                            }
                                        </h3>
                                        <p className="user-status">
                                            {conversations.find(
                                                c => c.id === activeConversation
                                            )?.online
                                                ? 'En ligne'
                                                : `Hors ligne - ${conversations.find(c => c.id === activeConversation)?.lastActive}`}
                                        </p>
                                    </div>
                                </div>

                                <div className="chat-actions">
                                    <button
                                        className="chat-action-btn"
                                        title="Appel vidéo"
                                    >
                                        <span className="icon">📹</span>
                                    </button>
                                    <button
                                        className="chat-action-btn"
                                        title="Appel vocal"
                                    >
                                        <span className="icon">📞</span>
                                    </button>
                                    <button
                                        className="chat-action-btn"
                                        title="Plus d'options"
                                    >
                                        <span className="icon">⋯</span>
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="messages-area">
                                <div className="messages-list">
                                    {messages.map(message => (
                                        <div
                                            key={message.id}
                                            className={`message-bubble ${message.type}`}
                                        >
                                            <div className="message-content">
                                                {renderMessageContent(message)}
                                            </div>
                                            <div className="message-meta">
                                                <span className="message-time">
                                                    {message.timestamp}
                                                </span>
                                                {message.type === 'sent' && (
                                                    <span className="message-status">
                                                        {message.read
                                                            ? '✓✓'
                                                            : '✓'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {typing && (
                                        <div className="typing-indicator">
                                            <div className="typing-dots">
                                                <div></div>
                                                <div></div>
                                                <div></div>
                                            </div>
                                            <span>écrit...</span>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            {/* Zone de saisie */}
                            <div className="message-input-area">
                                <div className="input-tools">
                                    <button
                                        className="input-tool-btn"
                                        title="Ajouter une pièce jointe"
                                    >
                                        <span className="icon">📎</span>
                                    </button>
                                    <button
                                        className="input-tool-btn"
                                        title="Ajouter une image"
                                    >
                                        <span className="icon">🖼️</span>
                                    </button>
                                    <button
                                        className="input-tool-btn"
                                        title="Émojis"
                                    >
                                        <span className="icon">😊</span>
                                    </button>
                                </div>

                                <div className="message-input-wrapper">
                                    <textarea
                                        value={newMessage}
                                        onChange={e =>
                                            setNewMessage(e.target.value)
                                        }
                                        onKeyDown={e => {
                                            if (
                                                e.key === 'Enter' &&
                                                !e.shiftKey
                                            ) {
                                                e.preventDefault();
                                                envoyerMessage();
                                            }
                                        }}
                                        placeholder="Écrivez votre message..."
                                        className="message-input"
                                        rows="1"
                                    />
                                    <button
                                        className="btn-send"
                                        onClick={envoyerMessage}
                                        disabled={!newMessage.trim()}
                                    >
                                        <span className="icon">✈️</span>
                                    </button>
                                </div>

                                <div className="quick-replies">
                                    <button
                                        className="quick-reply-btn"
                                        onClick={() =>
                                            setNewMessage(
                                                'Merci pour votre message !'
                                            )
                                        }
                                    >
                                        Merci !
                                    </button>
                                    <button
                                        className="quick-reply-btn"
                                        onClick={() =>
                                            setNewMessage(
                                                'Je reviens vers vous dans quelques instants.'
                                            )
                                        }
                                    >
                                        À suivre
                                    </button>
                                    <button
                                        className="quick-reply-btn"
                                        onClick={() =>
                                            setNewMessage(
                                                'Pouvez-vous me donner plus de détails ?'
                                            )
                                        }
                                    >
                                        Plus d'infos
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="no-conversation-selected">
                            <div className="empty-state">
                                <div className="empty-icon">💬</div>
                                <h3>Sélectionnez une conversation</h3>
                                <p>
                                    Choisissez une conversation existante ou
                                    commencez-en une nouvelle
                                </p>
                                <button className="btn-start-chat">
                                    <span className="icon">✏️</span>
                                    Commencer une discussion
                                </button>
                            </div>

                            <div className="help-tips">
                                <h4>Astuces de communication</h4>
                                <ul>
                                    <li>
                                        ✅ Répondez dans les 24 heures maximum
                                    </li>
                                    <li>
                                        ✅ Soyez clair et précis dans vos
                                        réponses
                                    </li>
                                    <li>
                                        ✅ Utilisez les modèles pour les
                                        questions fréquentes
                                    </li>
                                    <li>
                                        ✅ Archivez les conversations terminées
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar des infos de conversation */}
                {activeConversation && (
                    <div className="chat-info-sidebar">
                        <div className="info-header">
                            <h3>Détails</h3>
                            <button className="btn-close-info">×</button>
                        </div>

                        <div className="user-profile">
                            <div className="profile-avatar-large">
                                <span className="avatar-icon-large">
                                    {getConversationAvatar(
                                        conversations.find(
                                            c => c.id === activeConversation
                                        )?.type,
                                        conversations.find(
                                            c => c.id === activeConversation
                                        )?.avatar
                                    )}
                                </span>
                            </div>
                            <h4>
                                {
                                    conversations.find(
                                        c => c.id === activeConversation
                                    )?.nom
                                }
                            </h4>
                            <p className="profile-role">
                                {conversations.find(
                                    c => c.id === activeConversation
                                )?.type === 'client'
                                    ? 'Client'
                                    : conversations.find(
                                            c => c.id === activeConversation
                                        )?.type === 'admin'
                                        ? 'Administrateur'
                                        : 'Modérateur'}
                            </p>
                        </div>

                        <div className="conversation-details">
                            <h5>Informations</h5>
                            <div className="detail-item">
                                <span className="detail-label">Statut:</span>
                                <span
                                    className={`detail-value ${conversations.find(c => c.id === activeConversation)?.online ? 'online' : 'offline'}`}
                                >
                                    {conversations.find(
                                        c => c.id === activeConversation
                                    )?.online
                                        ? 'En ligne'
                                        : 'Hors ligne'}
                                </span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Messages:</span>
                                <span className="detail-value">
                                    {messages.length}
                                </span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">
                                    Dernier message:
                                </span>
                                <span className="detail-value">
                                    {messages.length > 0
                                        ? formatDate(new Date())
                                        : 'Aucun'}
                                </span>
                            </div>
                        </div>

                        <div className="shared-files">
                            <h5>Fichiers partagés</h5>
                            <div className="files-list">
                                <div className="file-item">
                                    <span className="file-icon">📄</span>
                                    <span className="file-name">
                                        facture.pdf
                                    </span>
                                    <span className="file-size">2.4 MB</span>
                                </div>
                                <div className="file-item">
                                    <span className="file-icon">🖼️</span>
                                    <span className="file-name">
                                        image_produit.jpg
                                    </span>
                                    <span className="file-size">1.8 MB</span>
                                </div>
                            </div>
                        </div>

                        <div className="conversation-actions">
                            <button className="action-btn danger">
                                <span className="icon">🚫</span>
                                Bloquer
                            </button>
                            <button className="action-btn">
                                <span className="icon">📁</span>
                                Archiver
                            </button>
                            <button className="action-btn">
                                <span className="icon">🔄</span>
                                Transférer
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Widget de chat rapide */}
            <div className="quick-chat-widget">
                <div className="widget-header">
                    <h4>Chat Rapide</h4>
                    <span className="widget-badge">3</span>
                </div>

                <div className="quick-contacts">
                    {conversations.slice(0, 3).map(conv => (
                        <button
                            key={conv.id}
                            className="quick-contact-btn"
                            onClick={() => chargerMessages(conv.id)}
                        >
                            <span className="contact-avatar">
                                {getConversationAvatar(conv.type, conv.avatar)}
                                {conv.unread > 0 && (
                                    <span className="quick-badge">
                                        {conv.unread}
                                    </span>
                                )}
                            </span>
                            <span className="contact-name">
                                {conv.nom.split(' ')[0]}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Messages;