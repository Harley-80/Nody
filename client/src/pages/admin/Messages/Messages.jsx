import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../../../contexts/NotificationContext';
import axios from 'axios';
import './Messages.scss';

// Composant principal de la page Messages pour l'admin
const Messages = () => {
    const { socket } = useNotifications();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const messagesEndRef = useRef(null);

    // Récupération des conversations au chargement
    useEffect(() => {
        fetchConversations();
    }, []);

    // Écoute des nouveaux messages via WebSocket
    useEffect(() => {
        if (socket) {
            socket.on('nouveau_message', message => {
                // Mettre à jour la conversation si elle est sélectionnée
                if (
                    selectedConversation &&
                    message.conversationId === selectedConversation._id
                ) {
                    setMessages(prev => [...prev, message]);
                    scrollToBottom();
                }
                // Mettre à jour la liste des conversations
                fetchConversations();
            });

            return () => {
                socket.off('nouveau_message');
            };
        }
    }, [socket, selectedConversation]);

    // Auto-scroll vers le dernier message
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Fonction pour récupérer les conversations
    const fetchConversations = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                'http://localhost:5000/api/messages/conversations',
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setConversations(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Erreur chargement conversations:', error);
            setLoading(false);
        }
    };

    // Fonction pour récupérer les messages d'une conversation
    const fetchMessages = async conversationId => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:5000/api/messages/conversation/${conversationId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setMessages(response.data);
        } catch (error) {
            console.error('Erreur chargement messages:', error);
        }
    };

    // Sélection d'une conversation
    const handleSelectConversation = conversation => {
        setSelectedConversation(conversation);
        fetchMessages(conversation._id);
    };

    // Envoi d'un nouveau message
    const handleSendMessage = async e => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        setSending(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:5000/api/messages/send',
                {
                    conversationId: selectedConversation._id,
                    contenu: newMessage,
                    destinataireId: selectedConversation.participant._id,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setMessages(prev => [...prev, response.data]);
            setNewMessage('');
            scrollToBottom();
        } catch (error) {
            console.error('Erreur envoi message:', error);
        } finally {
            setSending(false);
        }
    };

    // Formatage de la date pour l'affichage
    const formatDate = date => {
        const d = new Date(date);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "À l'instant";
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours}h`;
        if (diffDays < 7) return `Il y a ${diffDays}j`;
        return d.toLocaleDateString('fr-FR');
    };

    // Filtrage des conversations selon la recherche
    const filteredConversations = conversations.filter(
        conv =>
            conv.participant?.nom
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            conv.participant?.email
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="messages-page">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Chargement des conversations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="messages-page">
            <div className="messages-header">
                <h1>Messages</h1>
                <p className="subtitle">
                    Gérez vos conversations avec les utilisateurs
                </p>
            </div>

            <div className="messages-container">
                {/* Liste des conversations */}
                <div className="conversations-sidebar">
                    <div className="sidebar-header">
                        <h2>Conversations</h2>
                        <span className="badge">{conversations.length}</span>
                    </div>

                    {/* Zone de recherche */}
                    <div className="search-box">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            placeholder="Rechercher une conversation..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="conversations-list">
                        {filteredConversations.length === 0 ? (
                            <div className="empty-state">
                                <i className="fas fa-inbox"></i>
                                <p>Aucune conversation</p>
                            </div>
                        ) : (
                            filteredConversations.map(conv => (
                                <div
                                    key={conv._id}
                                    className={`conversation-item ${selectedConversation?._id === conv._id ? 'active' : ''}`}
                                    onClick={() =>
                                        handleSelectConversation(conv)
                                    }
                                >
                                    <div className="avatar">
                                        {conv.participant?.avatar ? (
                                            <img
                                                src={conv.participant.avatar}
                                                alt={conv.participant.nom}
                                            />
                                        ) : (
                                            <i className="fas fa-user"></i>
                                        )}
                                        {conv.nonLu > 0 && (
                                            <span className="online-indicator"></span>
                                        )}
                                    </div>
                                    <div className="conv-info">
                                        <div className="conv-header">
                                            <h3>
                                                {conv.participant?.nom ||
                                                    'Utilisateur'}
                                            </h3>
                                            <span className="time">
                                                {formatDate(
                                                    conv.dernierMessage
                                                        ?.createdAt
                                                )}
                                            </span>
                                        </div>
                                        <div className="conv-preview">
                                            <p>
                                                {conv.dernierMessage?.contenu ||
                                                    'Aucun message'}
                                            </p>
                                            {conv.nonLu > 0 && (
                                                <span className="unread-badge">
                                                    {conv.nonLu}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Zone de chat */}
                <div className="chat-area">
                    {!selectedConversation ? (
                        <div className="no-conversation-selected">
                            <i className="fas fa-comments"></i>
                            <h3>Aucune conversation sélectionnée</h3>
                            <p>
                                Sélectionnez une conversation pour commencer à
                                discuter
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="chat-header">
                                <div className="participant-info">
                                    <div className="avatar">
                                        {selectedConversation.participant
                                            ?.avatar ? (
                                            <img
                                                src={
                                                    selectedConversation
                                                        .participant.avatar
                                                }
                                                alt={
                                                    selectedConversation
                                                        .participant.nom
                                                }
                                            />
                                        ) : (
                                            <i className="fas fa-user"></i>
                                        )}
                                    </div>
                                    <div>
                                        <h3>
                                            {selectedConversation.participant
                                                ?.nom || 'Utilisateur'}
                                        </h3>
                                        <p className="email">
                                            {
                                                selectedConversation.participant
                                                    ?.email
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className="chat-actions">
                                    <button
                                        className="btn-icon"
                                        title="Informations"
                                    >
                                        <i className="fas fa-info-circle"></i>
                                    </button>
                                    <button
                                        className="btn-icon"
                                        title="Archiver"
                                    >
                                        <i className="fas fa-archive"></i>
                                    </button>
                                </div>
                            </div>

                            <div className="messages-list">
                                {messages.length === 0 ? (
                                    <div className="empty-messages">
                                        <i className="fas fa-comment-slash"></i>
                                        <p>
                                            Aucun message dans cette
                                            conversation
                                        </p>
                                    </div>
                                ) : (
                                    messages.map((msg, index) => (
                                        <div
                                            key={msg._id || index}
                                            className={`message ${msg.expediteur === selectedConversation.participant._id ? 'received' : 'sent'}`}
                                        >
                                            <div className="message-content">
                                                <p>{msg.contenu}</p>
                                                <span className="message-time">
                                                    {new Date(
                                                        msg.createdAt
                                                    ).toLocaleTimeString(
                                                        'fr-FR',
                                                        {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        }
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <form
                                className="message-input-form"
                                onSubmit={handleSendMessage}
                            >
                                <button
                                    type="button"
                                    className="btn-icon"
                                    title="Joindre un fichier"
                                >
                                    <i className="fas fa-paperclip"></i>
                                </button>
                                <input
                                    type="text"
                                    placeholder="Tapez votre message..."
                                    value={newMessage}
                                    onChange={e =>
                                        setNewMessage(e.target.value)
                                    }
                                    disabled={sending}
                                />
                                <button
                                    type="submit"
                                    className="btn-send"
                                    disabled={!newMessage.trim() || sending}
                                >
                                    {sending ? (
                                        <i className="fas fa-circle-notch fa-spin"></i>
                                    ) : (
                                        <i className="fas fa-paper-plane"></i>
                                    )}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Messages;
