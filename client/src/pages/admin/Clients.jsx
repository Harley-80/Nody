// src/pages/admin/Clients.jsx
import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    CircularProgress,
    Box,
    IconButton,
    TextField,
    InputAdornment
} 
from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';

const mockClients = [
    { id: 1, name: 'Jean Dupont', email: 'jean.dupont@example.com', phone: '0123456789', address: '123 Rue de Paris' },
    { id: 2, name: 'Marie Martin', email: 'marie.martin@example.com', phone: '0987654321', address: '456 Avenue des Champs' },
    // Ajout d'autres clients fictifs ici
];

export default function Clients() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Simuler un chargement de données
        const timer = setTimeout(() => {
            setClients(mockClients);
            setLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddClient = () => {
        navigate('/admin/clients/add');
    };

    const handleEditClient = (clientId) => {
        navigate(`/admin/clients/edit/${clientId}`);
    };

    const handleDeleteClient = (clientId) => {
        // Logique pour supprimer un client
        console.log(`Suppression du client avec l'ID: ${clientId}`);
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 4 }}>
                <Typography variant="h4" component="h1">
                    Gestion des Clients
                </Typography>
                <IconButton color="primary" onClick={handleAddClient}>
                    <AddIcon />
                </IconButton>
            </Box>

            <TextField
                label="Rechercher"
                variant="outlined"
                fullWidth
                margin="normal"
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                }}
            />

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    <TableContainer component={Paper} sx={{ my: 2 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Nom</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Téléphone</TableCell>
                                    <TableCell>Adresse</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredClients.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((client) => (
                                    <TableRow key={client.id}>
                                        <TableCell>{client.name}</TableCell>
                                        <TableCell>{client.email}</TableCell>
                                        <TableCell>{client.phone}</TableCell>
                                        <TableCell>{client.address}</TableCell>
                                        <TableCell>
                                            <IconButton color="primary" onClick={() => handleEditClient(client.id)}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton color="error" onClick={() => handleDeleteClient(client.id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={filteredClients.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </>
            )}
        </Container>
    );


    // return ( mon premier code
    //     <div className="container py-4">
    //         <h2>Gestion des Clients</h2>
    //         <p>Cette section sera développée ultérieurement.</p>
    //     </div>
    // );
}

