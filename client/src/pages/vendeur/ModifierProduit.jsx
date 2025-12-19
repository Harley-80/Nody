import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    IconButton,
    Alert,
    LinearProgress,
    InputAdornment,
    FormHelperText,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    ArrowBack as BackIcon,
    Save as SaveIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import vendeurService from '../../services/vendeurService';

const ModifierProduit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState([]);
    const [confirmDialog, setConfirmDialog] = useState(false);

    // Formulaire produit
    const [formData, setFormData] = useState({
        nom: '',
        description: '',
        prix: '',
        prixPromo: '',
        stock: '',
        categorie: '',
        sousCategorie: '',
        marque: '',
        caracteristiques: [],
        tags: [],
        dimensions: {
            longueur: '',
            largeur: '',
            hauteur: '',
            poids: '',
        },
        delaiLivraison: '',
        fraisLivraison: '',
        garantie: '',
        statut: 'actif',
    });

    const [imagesExistantes, setImagesExistantes] = useState([]);
    const [imagesToDelete, setImagesToDelete] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [newImagePreviews, setNewImagePreviews] = useState([]);
    const [errors, setErrors] = useState({});
    const [caracteristiqueTemp, setCaracteristiqueTemp] = useState({
        cle: '',
        valeur: '',
    });
    const [tagTemp, setTagTemp] = useState('');

    // Charger les données
    useEffect(() => {
        chargerDonnees();
    }, [id]);

    const chargerDonnees = async () => {
        try {
            setLoading(true);

            // Charger catégories
            const catResponse = await vendeurService.obtenirCategories();
            setCategories(catResponse.data || []);

            // Charger produit
            const produitResponse = await vendeurService.obtenirProduit(id);
            const produit = produitResponse.data;

            // Remplir le formulaire
            setFormData({
                nom: produit.nom || '',
                description: produit.description || '',
                prix: produit.prix || '',
                prixPromo: produit.prixPromo || '',
                stock: produit.stock || '',
                categorie: produit.categorie?._id || produit.categorie || '',
                sousCategorie: produit.sousCategorie || '',
                marque: produit.marque || '',
                caracteristiques: produit.caracteristiques || [],
                tags: produit.tags || [],
                dimensions: produit.dimensions || {
                    longueur: '',
                    largeur: '',
                    hauteur: '',
                    poids: '',
                },
                delaiLivraison: produit.delaiLivraison || '',
                fraisLivraison: produit.fraisLivraison || '',
                garantie: produit.garantie || '',
                statut: produit.statut || 'actif',
            });

            setImagesExistantes(produit.images || []);
        } catch (error) {
            console.error('Erreur chargement produit:', error);
            showToast('Erreur lors du chargement du produit', 'error');
            navigate('/vendeur/mes-produits');
        } finally {
            setLoading(false);
        }
    };

    // Gestion des changements
    const handleChange = e => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleDimensionChange = e => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            dimensions: {
                ...prev.dimensions,
                [name]: value,
            },
        }));
    };

    // Gestion des images existantes
    const marquerImagePourSuppression = imageUrl => {
        setImagesToDelete(prev => [...prev, imageUrl]);
        setImagesExistantes(prev => prev.filter(img => img !== imageUrl));
    };

    // Gestion des nouvelles images
    const handleNewImageChange = e => {
        const files = Array.from(e.target.files);

        const totalImages =
            imagesExistantes.length +
            newImages.length +
            files.length -
            imagesToDelete.length;
        if (totalImages > 6) {
            showToast('Maximum 6 images autorisées', 'warning');
            return;
        }

        const validFiles = files.filter(file => {
            if (!file.type.startsWith('image/')) {
                showToast(`${file.name} n'est pas une image`, 'error');
                return false;
            }
            if (file.size > 5 * 1024 * 1024) {
                showToast(`${file.name} dépasse 5MB`, 'error');
                return false;
            }
            return true;
        });

        setNewImages(prev => [...prev, ...validFiles]);

        // Créer les previews
        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewImagePreviews(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeNewImage = index => {
        setNewImages(prev => prev.filter((_, i) => i !== index));
        setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    // Gestion des caractéristiques
    const ajouterCaracteristique = () => {
        if (caracteristiqueTemp.cle && caracteristiqueTemp.valeur) {
            setFormData(prev => ({
                ...prev,
                caracteristiques: [
                    ...prev.caracteristiques,
                    { ...caracteristiqueTemp },
                ],
            }));
            setCaracteristiqueTemp({ cle: '', valeur: '' });
        }
    };

    const supprimerCaracteristique = index => {
        setFormData(prev => ({
            ...prev,
            caracteristiques: prev.caracteristiques.filter(
                (_, i) => i !== index
            ),
        }));
    };

    // Gestion des tags
    const ajouterTag = () => {
        if (tagTemp && !formData.tags.includes(tagTemp)) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, tagTemp],
            }));
            setTagTemp('');
        }
    };

    const supprimerTag = tag => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(t => t !== tag),
        }));
    };

    // Validation
    const validerFormulaire = () => {
        const newErrors = {};

        if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';
        if (!formData.description.trim())
            newErrors.description = 'La description est requise';
        if (!formData.categorie)
            newErrors.categorie = 'La catégorie est requise';
        if (!formData.prix || parseFloat(formData.prix) <= 0) {
            newErrors.prix = 'Le prix doit être supérieur à 0';
        }
        if (!formData.stock || parseInt(formData.stock) < 0) {
            newErrors.stock = 'Le stock doit être >= 0';
        }
        if (
            formData.prixPromo &&
            parseFloat(formData.prixPromo) >= parseFloat(formData.prix)
        ) {
            newErrors.prixPromo =
                'Le prix promo doit être inférieur au prix normal';
        }

        const totalImages = imagesExistantes.length + newImages.length;
        if (totalImages === 0) {
            newErrors.images = 'Au moins une image est requise';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Soumission
    const handleSubmit = async () => {
        if (!validerFormulaire()) {
            showToast('Veuillez corriger les erreurs', 'error');
            return;
        }

        setSaving(true);
        try {
            const formDataToSend = new FormData();

            // Ajouter toutes les données
            Object.keys(formData).forEach(key => {
                if (
                    key === 'caracteristiques' ||
                    key === 'tags' ||
                    key === 'dimensions'
                ) {
                    formDataToSend.append(key, JSON.stringify(formData[key]));
                } else {
                    formDataToSend.append(key, formData[key]);
                }
            });

            // Ajouter les images existantes à conserver
            formDataToSend.append(
                'imagesExistantes',
                JSON.stringify(imagesExistantes)
            );

            // Ajouter les nouvelles images
            newImages.forEach(image => {
                formDataToSend.append('nouvellesImages', image);
            });

            const response = await vendeurService.modifierProduit(
                id,
                formDataToSend
            );

            showToast('✅ Produit modifié avec succès !', 'success');
            setTimeout(() => navigate('/vendeur/mes-produits'), 1500);
        } catch (error) {
            console.error('Erreur modification produit:', error);
            showToast(
                error.response?.data?.message ||
                    'Erreur lors de la modification',
                'error'
            );
        } finally {
            setSaving(false);
            setConfirmDialog(false);
        }
    };

    const handleSaveClick = () => {
        if (validerFormulaire()) {
            setConfirmDialog(true);
        }
    };

    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '50vh',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton
                    onClick={() => navigate('/vendeur/mes-produits')}
                    sx={{ mr: 2 }}
                >
                    <BackIcon />
                </IconButton>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h4">Modifier le produit</Typography>
                    <Typography variant="body2" color="text.secondary">
                        ID: {id}
                    </Typography>
                </Box>
                <Chip
                    label={formData.statut}
                    color={formData.statut === 'actif' ? 'success' : 'default'}
                />
            </Box>

            {/* Formulaire */}
            <Grid container spacing={3}>
                {/* Informations de base */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Informations de base
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Nom du produit *"
                                        name="nom"
                                        value={formData.nom}
                                        onChange={handleChange}
                                        error={!!errors.nom}
                                        helperText={errors.nom}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={4}
                                        label="Description *"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        error={!!errors.description}
                                        helperText={errors.description}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <FormControl
                                        fullWidth
                                        error={!!errors.categorie}
                                    >
                                        <InputLabel>Catégorie *</InputLabel>
                                        <Select
                                            name="categorie"
                                            value={formData.categorie}
                                            onChange={handleChange}
                                            label="Catégorie *"
                                        >
                                            {categories.map(cat => (
                                                <MenuItem
                                                    key={cat._id}
                                                    value={cat._id}
                                                >
                                                    {cat.nom}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {errors.categorie && (
                                            <FormHelperText>
                                                {errors.categorie}
                                            </FormHelperText>
                                        )}
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Sous-catégorie"
                                        name="sousCategorie"
                                        value={formData.sousCategorie}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Marque"
                                        name="marque"
                                        value={formData.marque}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Statut</InputLabel>
                                        <Select
                                            name="statut"
                                            value={formData.statut}
                                            onChange={handleChange}
                                            label="Statut"
                                        >
                                            <MenuItem value="actif">
                                                Actif
                                            </MenuItem>
                                            <MenuItem value="inactif">
                                                Inactif
                                            </MenuItem>
                                            <MenuItem value="rupture">
                                                Rupture de stock
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Prix et stock */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Prix et stock
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Prix (FCFA) *"
                                        name="prix"
                                        value={formData.prix}
                                        onChange={handleChange}
                                        error={!!errors.prix}
                                        helperText={errors.prix}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    FCFA
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Prix promotionnel"
                                        name="prixPromo"
                                        value={formData.prixPromo}
                                        onChange={handleChange}
                                        error={!!errors.prixPromo}
                                        helperText={errors.prixPromo}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    FCFA
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Stock disponible *"
                                        name="stock"
                                        value={formData.stock}
                                        onChange={handleChange}
                                        error={!!errors.stock}
                                        helperText={errors.stock}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Délai de livraison"
                                        name="delaiLivraison"
                                        value={formData.delaiLivraison}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Frais de livraison (FCFA)"
                                        name="fraisLivraison"
                                        value={formData.fraisLivraison}
                                        onChange={handleChange}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    FCFA
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Garantie"
                                        name="garantie"
                                        value={formData.garantie}
                                        onChange={handleChange}
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Images */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Images du produit
                            </Typography>
                            {errors.images && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {errors.images}
                                </Alert>
                            )}

                            {/* Images existantes */}
                            {imagesExistantes.length > 0 && (
                                <>
                                    <Typography
                                        variant="subtitle2"
                                        gutterBottom
                                    >
                                        Images actuelles
                                    </Typography>
                                    <Grid container spacing={2} sx={{ mb: 3 }}>
                                        {imagesExistantes.map((img, index) => (
                                            <Grid
                                                item
                                                xs={6}
                                                md={3}
                                                key={index}
                                            >
                                                <Card>
                                                    <Box
                                                        sx={{
                                                            position:
                                                                'relative',
                                                        }}
                                                    >
                                                        <img
                                                            src={img}
                                                            alt={`Image ${index + 1}`}
                                                            style={{
                                                                width: '100%',
                                                                height: 150,
                                                                objectFit:
                                                                    'cover',
                                                            }}
                                                        />
                                                        <IconButton
                                                            sx={{
                                                                position:
                                                                    'absolute',
                                                                top: 8,
                                                                right: 8,
                                                                bgcolor:
                                                                    'error.main',
                                                                color: 'white',
                                                                '&:hover': {
                                                                    bgcolor:
                                                                        'error.dark',
                                                                },
                                                            }}
                                                            size="small"
                                                            onClick={() =>
                                                                marquerImagePourSuppression(
                                                                    img
                                                                )
                                                            }
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                        {index === 0 && (
                                                            <Chip
                                                                label="Principale"
                                                                color="primary"
                                                                size="small"
                                                                sx={{
                                                                    position:
                                                                        'absolute',
                                                                    bottom: 8,
                                                                    left: 8,
                                                                }}
                                                            />
                                                        )}
                                                    </Box>
                                                </Card>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </>
                            )}

                            {/* Nouvelles images */}
                            {newImagePreviews.length > 0 && (
                                <>
                                    <Typography
                                        variant="subtitle2"
                                        gutterBottom
                                    >
                                        Nouvelles images
                                    </Typography>
                                    <Grid container spacing={2} sx={{ mb: 3 }}>
                                        {newImagePreviews.map(
                                            (preview, index) => (
                                                <Grid
                                                    item
                                                    xs={6}
                                                    md={3}
                                                    key={index}
                                                >
                                                    <Card>
                                                        <Box
                                                            sx={{
                                                                position:
                                                                    'relative',
                                                            }}
                                                        >
                                                            <img
                                                                src={preview}
                                                                alt={`Nouvelle ${index + 1}`}
                                                                style={{
                                                                    width: '100%',
                                                                    height: 150,
                                                                    objectFit:
                                                                        'cover',
                                                                }}
                                                            />
                                                            <IconButton
                                                                sx={{
                                                                    position:
                                                                        'absolute',
                                                                    top: 8,
                                                                    right: 8,
                                                                    bgcolor:
                                                                        'error.main',
                                                                    color: 'white',
                                                                    '&:hover': {
                                                                        bgcolor:
                                                                            'error.dark',
                                                                    },
                                                                }}
                                                                size="small"
                                                                onClick={() =>
                                                                    removeNewImage(
                                                                        index
                                                                    )
                                                                }
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                            <Chip
                                                                label="Nouveau"
                                                                color="success"
                                                                size="small"
                                                                sx={{
                                                                    position:
                                                                        'absolute',
                                                                    bottom: 8,
                                                                    left: 8,
                                                                }}
                                                            />
                                                        </Box>
                                                    </Card>
                                                </Grid>
                                            )
                                        )}
                                    </Grid>
                                </>
                            )}

                            <Button
                                variant="contained"
                                component="label"
                                startIcon={<UploadIcon />}
                                disabled={
                                    imagesExistantes.length +
                                        newImages.length >=
                                    6
                                }
                            >
                                Ajouter des images
                                <input
                                    type="file"
                                    hidden
                                    multiple
                                    accept="image/*"
                                    onChange={handleNewImageChange}
                                />
                            </Button>
                            <Typography
                                variant="caption"
                                display="block"
                                sx={{ mt: 1 }}
                            >
                                Total:{' '}
                                {imagesExistantes.length + newImages.length}/6
                                images
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Caractéristiques et tags */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Caractéristiques et tags
                            </Typography>

                            {/* Caractéristiques */}
                            <Typography
                                variant="subtitle2"
                                gutterBottom
                                sx={{ mt: 2 }}
                            >
                                Caractéristiques
                            </Typography>
                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={12} md={5}>
                                    <TextField
                                        fullWidth
                                        label="Nom"
                                        value={caracteristiqueTemp.cle}
                                        onChange={e =>
                                            setCaracteristiqueTemp(prev => ({
                                                ...prev,
                                                cle: e.target.value,
                                            }))
                                        }
                                    />
                                </Grid>
                                <Grid item xs={12} md={5}>
                                    <TextField
                                        fullWidth
                                        label="Valeur"
                                        value={caracteristiqueTemp.valeur}
                                        onChange={e =>
                                            setCaracteristiqueTemp(prev => ({
                                                ...prev,
                                                valeur: e.target.value,
                                            }))
                                        }
                                    />
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<AddIcon />}
                                        onClick={ajouterCaracteristique}
                                        sx={{ height: '56px' }}
                                    >
                                        Ajouter
                                    </Button>
                                </Grid>
                            </Grid>
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 1,
                                    mb: 3,
                                }}
                            >
                                {formData.caracteristiques.map((car, index) => (
                                    <Chip
                                        key={index}
                                        label={`${car.cle}: ${car.valeur}`}
                                        onDelete={() =>
                                            supprimerCaracteristique(index)
                                        }
                                    />
                                ))}
                            </Box>

                            {/* Tags */}
                            <Typography variant="subtitle2" gutterBottom>
                                Tags
                            </Typography>
                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={12} md={10}>
                                    <TextField
                                        fullWidth
                                        label="Tag"
                                        value={tagTemp}
                                        onChange={e =>
                                            setTagTemp(e.target.value)
                                        }
                                        onKeyPress={e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                ajouterTag();
                                            }
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<AddIcon />}
                                        onClick={ajouterTag}
                                        sx={{ height: '56px' }}
                                    >
                                        Ajouter
                                    </Button>
                                </Grid>
                            </Grid>
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 1,
                                }}
                            >
                                {formData.tags.map((tag, index) => (
                                    <Chip
                                        key={index}
                                        label={tag}
                                        onDelete={() => supprimerTag(tag)}
                                        color="primary"
                                    />
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Actions */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mt: 3,
                    mb: 3,
                }}
            >
                <Button
                    variant="outlined"
                    onClick={() => navigate('/vendeur/mes-produits')}
                    disabled={saving}
                >
                    Annuler
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSaveClick}
                    disabled={saving}
                    startIcon={
                        saving ? <CircularProgress size={20} /> : <SaveIcon />
                    }
                >
                    {saving
                        ? 'Enregistrement...'
                        : 'Enregistrer les modifications'}
                </Button>
            </Box>

            {/* Dialog de confirmation */}
            <Dialog
                open={confirmDialog}
                onClose={() => setConfirmDialog(false)}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WarningIcon color="warning" />
                        Confirmer les modifications
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Êtes-vous sûr de vouloir enregistrer ces modifications ?
                    </Typography>
                    {imagesToDelete.length > 0 && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            {imagesToDelete.length} image(s) seront supprimées
                            définitivement
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialog(false)}>
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        color="primary"
                    >
                        Confirmer
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ModifierProduit;
