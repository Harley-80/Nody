import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Grid,
    Avatar,
    Chip,
    Alert,
    LinearProgress,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    Edit as EditIcon,
    Save as SaveIcon,
    PhotoCamera as CameraIcon,
    Store as StoreIcon,
    Schedule as ScheduleIcon,
    LocalShipping as ShippingIcon,
    Cancel as CancelIcon,
    Info as InfoIcon,
    Verified as VerifiedIcon,
    Star as StarIcon,
} from '@mui/icons-material';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import vendeurService from '../../services/vendeurService';

const MaBoutique = () => {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [horaireDialog, setHoraireDialog] = useState(false);

    const [boutique, setBoutique] = useState({
        nomBoutique: '',
        description: '',
        logo: '',
        banniere: '',
        adresse: {
            rue: '',
            ville: '',
            region: '',
            codePostal: '',
        },
        telephone: '',
        email: '',
        siteWeb: '',
        horaires: {
            lundi: { ouvert: true, debut: '08:00', fin: '18:00' },
            mardi: { ouvert: true, debut: '08:00', fin: '18:00' },
            mercredi: { ouvert: true, debut: '08:00', fin: '18:00' },
            jeudi: { ouvert: true, debut: '08:00', fin: '18:00' },
            vendredi: { ouvert: true, debut: '08:00', fin: '18:00' },
            samedi: { ouvert: true, debut: '09:00', fin: '17:00' },
            dimanche: { ouvert: false, debut: '', fin: '' },
        },
        politiqueRetour: '',
        delaiLivraisonMoyen: '',
        fraisLivraisonStandard: '',
        livraisonGratuite: false,
        seuilLivraisonGratuite: '',
        modesLivraison: [],
        modesPaiement: [],
        reseauxSociaux: {
            facebook: '',
            instagram: '',
            twitter: '',
            linkedin: '',
        },
    });

    const [stats, setStats] = useState({
        note: 0,
        nombreAvis: 0,
        nombreProduits: 0,
        nombreCommandes: 0,
        tauxReponse: 0,
        certifications: [],
    });

    const [logoPreview, setLogoPreview] = useState(null);
    const [bannierePreview, setBannierePreview] = useState(null);
    const [errors, setErrors] = useState({});

    const modesLivraisonDisponibles = [
        'Livraison à domicile',
        'Point de retrait',
        'Livraison express',
        'Livraison standard',
    ];

    const modesPaiementDisponibles = [
        'Carte bancaire',
        'Mobile Money',
        'Espèces à la livraison',
        'Virement bancaire',
        'Paiement en ligne',
    ];

    useEffect(() => {
        chargerDonneesBoutique();
    }, []);

    const chargerDonneesBoutique = async () => {
        try {
            setLoading(true);
            const response = await vendeurService.obtenirMaBoutique();

            if (response.data) {
                setBoutique(response.data.boutique || boutique);
                setStats(response.data.stats || stats);
            }
        } catch (error) {
            console.error('Erreur chargement boutique:', error);
            showToast('Erreur lors du chargement des informations', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = e => {
        const { name, value } = e.target;
        setBoutique(prev => ({
            ...prev,
            [name]: value,
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleAdresseChange = e => {
        const { name, value } = e.target;
        setBoutique(prev => ({
            ...prev,
            adresse: {
                ...prev.adresse,
                [name]: value,
            },
        }));
    };

    const handleReseauxChange = e => {
        const { name, value } = e.target;
        setBoutique(prev => ({
            ...prev,
            reseauxSociaux: {
                ...prev.reseauxSociaux,
                [name]: value,
            },
        }));
    };

    const handleHoraireChange = (jour, champ, value) => {
        setBoutique(prev => ({
            ...prev,
            horaires: {
                ...prev.horaires,
                [jour]: {
                    ...prev.horaires[jour],
                    [champ]: value,
                },
            },
        }));
    };

    const handleImageChange = type => e => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Veuillez sélectionner une image', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast("L'image ne doit pas dépasser 5MB", 'error');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            if (type === 'logo') {
                setLogoPreview(reader.result);
            } else {
                setBannierePreview(reader.result);
            }
        };
        reader.readAsDataURL(file);

        // Stocker le fichier pour l'upload
        setBoutique(prev => ({
            ...prev,
            [`${type}File`]: file,
        }));
    };

    const validerFormulaire = () => {
        const newErrors = {};

        if (!boutique.nomBoutique.trim()) {
            newErrors.nomBoutique = 'Le nom de la boutique est requis';
        }
        if (!boutique.description.trim()) {
            newErrors.description = 'La description est requise';
        }
        if (!boutique.telephone.trim()) {
            newErrors.telephone = 'Le téléphone est requis';
        }
        if (!boutique.email.trim()) {
            newErrors.email = "L'email est requis";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validerFormulaire()) {
            showToast('Veuillez corriger les erreurs', 'error');
            return;
        }

        setSaving(true);
        try {
            const formData = new FormData();

            // Ajouter les données de base
            Object.keys(boutique).forEach(key => {
                if (
                    key === 'adresse' ||
                    key === 'horaires' ||
                    key === 'reseauxSociaux'
                ) {
                    formData.append(key, JSON.stringify(boutique[key]));
                } else if (
                    key === 'modesLivraison' ||
                    key === 'modesPaiement'
                ) {
                    formData.append(key, JSON.stringify(boutique[key]));
                } else if (key !== 'logoFile' && key !== 'banniereFile') {
                    formData.append(key, boutique[key]);
                }
            });

            // Ajouter les fichiers
            if (boutique.logoFile) {
                formData.append('logo', boutique.logoFile);
            }
            if (boutique.banniereFile) {
                formData.append('banniere', boutique.banniereFile);
            }

            await vendeurService.modifierBoutique(formData);

            showToast('✅ Boutique mise à jour avec succès !', 'success');
            setEditMode(false);
            chargerDonneesBoutique();
        } catch (error) {
            console.error('Erreur modification boutique:', error);
            showToast(
                error.response?.data?.message ||
                    'Erreur lors de la mise à jour',
                'error'
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box>
                <Typography variant="h4" gutterBottom>
                    Ma Boutique
                </Typography>
                <LinearProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                }}
            >
                <Typography variant="h4">Ma Boutique</Typography>
                <Box>
                    {editMode ? (
                        <>
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    setEditMode(false);
                                    chargerDonneesBoutique();
                                }}
                                sx={{ mr: 1 }}
                                disabled={saving}
                            >
                                Annuler
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? 'Enregistrement...' : 'Enregistrer'}
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="contained"
                            startIcon={<EditIcon />}
                            onClick={() => setEditMode(true)}
                        >
                            Modifier
                        </Button>
                    )}
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Bannière et logo */}
                <Grid item xs={12}>
                    <Card>
                        <Box
                            sx={{
                                height: 200,
                                background:
                                    bannierePreview || boutique.banniere
                                        ? `url(${bannierePreview || boutique.banniere}) center/cover`
                                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {editMode && (
                                <IconButton
                                    component="label"
                                    sx={{
                                        position: 'absolute',
                                        top: 16,
                                        right: 16,
                                        bgcolor: 'rgba(255,255,255,0.9)',
                                        '&:hover': { bgcolor: 'white' },
                                    }}
                                >
                                    <CameraIcon />
                                    <input
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onChange={handleImageChange('banniere')}
                                    />
                                </IconButton>
                            )}
                        </Box>
                        <CardContent>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    mt: -8,
                                }}
                            >
                                <Box sx={{ position: 'relative' }}>
                                    <Avatar
                                        src={logoPreview || boutique.logo}
                                        sx={{
                                            width: 120,
                                            height: 120,
                                            border: '4px solid white',
                                            boxShadow: 2,
                                        }}
                                    >
                                        <StoreIcon sx={{ fontSize: 60 }} />
                                    </Avatar>
                                    {editMode && (
                                        <IconButton
                                            component="label"
                                            sx={{
                                                position: 'absolute',
                                                bottom: 0,
                                                right: 0,
                                                bgcolor: 'primary.main',
                                                color: 'white',
                                                '&:hover': {
                                                    bgcolor: 'primary.dark',
                                                },
                                            }}
                                            size="small"
                                        >
                                            <CameraIcon fontSize="small" />
                                            <input
                                                type="file"
                                                hidden
                                                accept="image/*"
                                                onChange={handleImageChange(
                                                    'logo'
                                                )}
                                            />
                                        </IconButton>
                                    )}
                                </Box>

                                <Box sx={{ ml: 3, flex: 1 }}>
                                    {editMode ? (
                                        <TextField
                                            fullWidth
                                            label="Nom de la boutique"
                                            name="nomBoutique"
                                            value={boutique.nomBoutique}
                                            onChange={handleChange}
                                            error={!!errors.nomBoutique}
                                            helperText={errors.nomBoutique}
                                        />
                                    ) : (
                                        <>
                                            <Typography variant="h5">
                                                {boutique.nomBoutique ||
                                                    'Ma boutique'}
                                            </Typography>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    gap: 1,
                                                    mt: 1,
                                                }}
                                            >
                                                <Chip
                                                    icon={<StarIcon />}
                                                    label={`${stats.note}/5 (${stats.nombreAvis} avis)`}
                                                    size="small"
                                                    color="warning"
                                                />
                                                {stats.certifications?.includes(
                                                    'verified'
                                                ) && (
                                                    <Chip
                                                        icon={<VerifiedIcon />}
                                                        label="Vérifié"
                                                        size="small"
                                                        color="success"
                                                    />
                                                )}
                                                <Chip
                                                    label={`${stats.nombreProduits} produits`}
                                                    size="small"
                                                />
                                            </Box>
                                        </>
                                    )}
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Informations générales */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Informations générales
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={4}
                                        label="Description de la boutique"
                                        name="description"
                                        value={boutique.description}
                                        onChange={handleChange}
                                        error={!!errors.description}
                                        helperText={errors.description}
                                        disabled={!editMode}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Téléphone"
                                        name="telephone"
                                        value={boutique.telephone}
                                        onChange={handleChange}
                                        error={!!errors.telephone}
                                        helperText={errors.telephone}
                                        disabled={!editMode}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        name="email"
                                        type="email"
                                        value={boutique.email}
                                        onChange={handleChange}
                                        error={!!errors.email}
                                        helperText={errors.email}
                                        disabled={!editMode}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Site web"
                                        name="siteWeb"
                                        value={boutique.siteWeb}
                                        onChange={handleChange}
                                        disabled={!editMode}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography
                                        variant="subtitle1"
                                        gutterBottom
                                    >
                                        Adresse
                                    </Typography>
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Rue"
                                        name="rue"
                                        value={boutique.adresse?.rue}
                                        onChange={handleAdresseChange}
                                        disabled={!editMode}
                                    />
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Ville"
                                        name="ville"
                                        value={boutique.adresse?.ville}
                                        onChange={handleAdresseChange}
                                        disabled={!editMode}
                                    />
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Région"
                                        name="region"
                                        value={boutique.adresse?.region}
                                        onChange={handleAdresseChange}
                                        disabled={!editMode}
                                    />
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Code postal"
                                        name="codePostal"
                                        value={boutique.adresse?.codePostal}
                                        onChange={handleAdresseChange}
                                        disabled={!editMode}
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Horaires */}
                    <Card sx={{ mt: 3 }}>
                        <CardContent>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    mb: 2,
                                }}
                            >
                                <Typography variant="h6">
                                    Horaires d'ouverture
                                </Typography>
                                {editMode && (
                                    <Button
                                        size="small"
                                        startIcon={<ScheduleIcon />}
                                        onClick={() => setHoraireDialog(true)}
                                    >
                                        Modifier
                                    </Button>
                                )}
                            </Box>
                            <List>
                                {Object.entries(boutique.horaires || {}).map(
                                    ([jour, horaire]) => (
                                        <ListItem key={jour}>
                                            <ListItemText
                                                primary={
                                                    jour
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                    jour.slice(1)
                                                }
                                                secondary={
                                                    horaire.ouvert
                                                        ? `${horaire.debut} - ${horaire.fin}`
                                                        : 'Fermé'
                                                }
                                            />
                                            <ListItemSecondaryAction>
                                                <Chip
                                                    label={
                                                        horaire.ouvert
                                                            ? 'Ouvert'
                                                            : 'Fermé'
                                                    }
                                                    size="small"
                                                    color={
                                                        horaire.ouvert
                                                            ? 'success'
                                                            : 'default'
                                                    }
                                                />
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    )
                                )}
                            </List>
                        </CardContent>
                    </Card>

                    {/* Réseaux sociaux */}
                    <Card sx={{ mt: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Réseaux sociaux
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Facebook"
                                        name="facebook"
                                        value={
                                            boutique.reseauxSociaux?.facebook
                                        }
                                        onChange={handleReseauxChange}
                                        disabled={!editMode}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Instagram"
                                        name="instagram"
                                        value={
                                            boutique.reseauxSociaux?.instagram
                                        }
                                        onChange={handleReseauxChange}
                                        disabled={!editMode}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Twitter"
                                        name="twitter"
                                        value={boutique.reseauxSociaux?.twitter}
                                        onChange={handleReseauxChange}
                                        disabled={!editMode}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="LinkedIn"
                                        name="linkedin"
                                        value={
                                            boutique.reseauxSociaux?.linkedin
                                        }
                                        onChange={handleReseauxChange}
                                        disabled={!editMode}
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Paramètres de livraison et paiement */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                <ShippingIcon
                                    sx={{ mr: 1, verticalAlign: 'middle' }}
                                />
                                Livraison
                            </Typography>

                            <TextField
                                fullWidth
                                label="Délai moyen de livraison"
                                name="delaiLivraisonMoyen"
                                value={boutique.delaiLivraisonMoyen}
                                onChange={handleChange}
                                disabled={!editMode}
                                sx={{ mb: 2 }}
                                placeholder="Ex: 2-5 jours"
                            />

                            <TextField
                                fullWidth
                                type="number"
                                label="Frais standard (FCFA)"
                                name="fraisLivraisonStandard"
                                value={boutique.fraisLivraisonStandard}
                                onChange={handleChange}
                                disabled={!editMode}
                                sx={{ mb: 2 }}
                            />

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={
                                            boutique.livraisonGratuite || false
                                        }
                                        onChange={e =>
                                            handleChange({
                                                target: {
                                                    name: 'livraisonGratuite',
                                                    value: e.target.checked,
                                                },
                                            })
                                        }
                                        disabled={!editMode}
                                    />
                                }
                                label="Livraison gratuite disponible"
                                sx={{ mb: 2 }}
                            />

                            {boutique.livraisonGratuite && (
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Seuil livraison gratuite (FCFA)"
                                    name="seuilLivraisonGratuite"
                                    value={boutique.seuilLivraisonGratuite}
                                    onChange={handleChange}
                                    disabled={!editMode}
                                    sx={{ mb: 2 }}
                                />
                            )}

                            <FormControl
                                fullWidth
                                disabled={!editMode}
                                sx={{ mb: 2 }}
                            >
                                <InputLabel>Modes de livraison</InputLabel>
                                <Select
                                    multiple
                                    value={boutique.modesLivraison || []}
                                    onChange={e =>
                                        handleChange({
                                            target: {
                                                name: 'modesLivraison',
                                                value: e.target.value,
                                            },
                                        })
                                    }
                                    renderValue={selected => (
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: 0.5,
                                            }}
                                        >
                                            {selected.map(value => (
                                                <Chip
                                                    key={value}
                                                    label={value}
                                                    size="small"
                                                />
                                            ))}
                                        </Box>
                                    )}
                                >
                                    {modesLivraisonDisponibles.map(mode => (
                                        <MenuItem key={mode} value={mode}>
                                            {mode}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="h6" gutterBottom>
                                Paiement
                            </Typography>

                            <FormControl fullWidth disabled={!editMode}>
                                <InputLabel>Modes de paiement</InputLabel>
                                <Select
                                    multiple
                                    value={boutique.modesPaiement || []}
                                    onChange={e =>
                                        handleChange({
                                            target: {
                                                name: 'modesPaiement',
                                                value: e.target.value,
                                            },
                                        })
                                    }
                                    renderValue={selected => (
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: 0.5,
                                            }}
                                        >
                                            {selected.map(value => (
                                                <Chip
                                                    key={value}
                                                    label={value}
                                                    size="small"
                                                />
                                            ))}
                                        </Box>
                                    )}
                                >
                                    {modesPaiementDisponibles.map(mode => (
                                        <MenuItem key={mode} value={mode}>
                                            {mode}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="h6" gutterBottom>
                                Politique de retour
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                name="politiqueRetour"
                                value={boutique.politiqueRetour}
                                onChange={handleChange}
                                disabled={!editMode}
                                placeholder="Décrivez votre politique de retour..."
                            />
                        </CardContent>
                    </Card>

                    {/* Stats */}
                    <Card sx={{ mt: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                <InfoIcon
                                    sx={{ mr: 1, verticalAlign: 'middle' }}
                                />
                                Statistiques
                            </Typography>
                            <List>
                                <ListItem>
                                    <ListItemText
                                        primary="Taux de réponse"
                                        secondary={`${stats.tauxReponse}%`}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText
                                        primary="Commandes traitées"
                                        secondary={stats.nombreCommandes}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText
                                        primary="Produits actifs"
                                        secondary={stats.nombreProduits}
                                    />
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Dialog Horaires */}
            <Dialog
                open={horaireDialog}
                onClose={() => setHoraireDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Modifier les horaires</DialogTitle>
                <DialogContent>
                    {Object.entries(boutique.horaires || {}).map(
                        ([jour, horaire]) => (
                            <Box key={jour} sx={{ mb: 2 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={horaire.ouvert}
                                            onChange={e =>
                                                handleHoraireChange(
                                                    jour,
                                                    'ouvert',
                                                    e.target.checked
                                                )
                                            }
                                        />
                                    }
                                    label={
                                        jour.charAt(0).toUpperCase() +
                                        jour.slice(1)
                                    }
                                />
                                {horaire.ouvert && (
                                    <Grid container spacing={2} sx={{ mt: 1 }}>
                                        <Grid item xs={6}>
                                            <TextField
                                                fullWidth
                                                type="time"
                                                label="Ouverture"
                                                value={horaire.debut}
                                                onChange={e =>
                                                    handleHoraireChange(
                                                        jour,
                                                        'debut',
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </Grid>
                                        <Grid item xs={6}>
                                            <TextField
                                                fullWidth
                                                type="time"
                                                label="Fermeture"
                                                value={horaire.fin}
                                                onChange={e =>
                                                    handleHoraireChange(
                                                        jour,
                                                        'fin',
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </Grid>
                                    </Grid>
                                )}
                            </Box>
                        )
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setHoraireDialog(false)}>
                        Annuler
                    </Button>
                    <Button
                        onClick={() => setHoraireDialog(false)}
                        variant="contained"
                    >
                        Valider
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MaBoutique;