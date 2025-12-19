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
    Stepper,
    Step,
    StepLabel,
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    ArrowBack as BackIcon,
    Save as SaveIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { categoriesService } from '../../services/categoriesService';
import { vendeurService } from '../../services/vendeurService';
import './AjouterProduit.scss';

const steps = [
    'Informations de base',
    'Détails et prix',
    'Images et médias',
    'Validation',
];

const AjouterProduit = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
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
    });

    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [errors, setErrors] = useState({});
    const [caracteristiqueTemp, setCaracteristiqueTemp] = useState({
        cle: '',
        valeur: '',
    });
    const [tagTemp, setTagTemp] = useState('');

    useEffect(() => {
        chargerCategories();
    }, []);

    const chargerCategories = async () => {
        try {
            const response = await categoriesService.getCategories();
            setCategories(response.data || []);
        } catch (error) {
            console.error('Erreur chargement catégories:', error);
            addToast({
                type: 'error',
                title: 'Erreur',
                message: 'Erreur lors du chargement des catégories',
            });
        }
    };

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

    const handleImageChange = e => {
        const files = Array.from(e.target.files);
        if (images.length + files.length > 6) {
            addToast({
                type: 'warning',
                title: 'Attention',
                message: 'Maximum 6 images autorisées',
            });
            return;
        }

        const validFiles = files.filter(file => {
            if (!file.type.startsWith('image/')) {
                addToast({
                    type: 'error',
                    title: 'Erreur',
                    message: `${file.name} n'est pas une image`,
                });
                return false;
            }
            if (file.size > 5 * 1024 * 1024) {
                addToast({
                    type: 'error',
                    title: 'Erreur',
                    message: `${file.name} dépasse 5MB`,
                });
                return false;
            }
            return true;
        });

        setImages(prev => [...prev, ...validFiles]);
        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviews(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = index => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

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

    const validerEtape = etape => {
        const newErrors = {};
        switch (etape) {
            case 0:
                if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis';
                if (!formData.description.trim())
                    newErrors.description = 'La description est requise';
                if (!formData.categorie)
                    newErrors.categorie = 'La catégorie est requise';
                break;
            case 1:
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
                break;
            case 2:
                if (images.length === 0) {
                    newErrors.images = 'Au moins une image est requise';
                }
                break;
            default:
                break;
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validerEtape(activeStep)) {
            setActiveStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        setActiveStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        if (!validerEtape(activeStep)) return;
        setLoading(true);
        try {
            const formDataToSend = new FormData();

            // Ajoute tous les champs
            formDataToSend.append('nom', formData.nom);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('prix', formData.prix);
            formDataToSend.append('categorie', formData.categorie);
            formDataToSend.append('stock', formData.stock);

            // Champs optionnels
            if (formData.marque)
                formDataToSend.append('marque', formData.marque);
            if (formData.prixPromo)
                formDataToSend.append('prixPromo', formData.prixPromo);
            if (formData.sousCategorie)
                formDataToSend.append('sousCategorie', formData.sousCategorie);
            if (formData.delaiLivraison)
                formDataToSend.append(
                    'delaiLivraison',
                    formData.delaiLivraison
                );
            if (formData.fraisLivraison)
                formDataToSend.append(
                    'fraisLivraison',
                    formData.fraisLivraison
                );
            if (formData.garantie)
                formDataToSend.append('garantie', formData.garantie);
            if (formData.caracteristiques.length > 0)
                formDataToSend.append(
                    'caracteristiques',
                    JSON.stringify(formData.caracteristiques)
                );
            if (formData.tags.length > 0)
                formDataToSend.append('tags', JSON.stringify(formData.tags));
            if (formData.dimensions)
                formDataToSend.append(
                    'dimensions',
                    JSON.stringify(formData.dimensions)
                );

            // Images
            images.forEach((image, index) => {
                formDataToSend.append('images', image);
            });

            // Utilise le service vendeur
            const response =
                await vendeurService.ajouterProduit(formDataToSend);

            addToast({
                type: 'success',
                title: 'Succès',
                message: 'Produit ajouté avec succès !',
            });

            setTimeout(() => navigate('/vendeur/mes-produits'), 1500);
        } catch (error) {
            console.error('Erreur ajout produit:', error);
            addToast({
                type: 'error',
                title: 'Erreur',
                message:
                    error.response?.data?.message ||
                    "Erreur lors de l'ajout du produit",
            });
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = step => {
        switch (step) {
            case 0:
                return (
                    <Grid container spacing={3} className="step-content">
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
                                helperText={
                                    errors.description ||
                                    'Décrivez votre produit en détail'
                                }
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth error={!!errors.categorie}>
                                <InputLabel>Catégorie *</InputLabel>
                                <Select
                                    name="categorie"
                                    value={formData.categorie}
                                    onChange={handleChange}
                                    label="Catégorie *"
                                >
                                    {categories.map(cat => (
                                        <MenuItem key={cat._id} value={cat._id}>
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
                    </Grid>
                );

            case 1:
                return (
                    <Grid container spacing={3} className="step-content step-1">
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
                                placeholder="Ex: 2-5 jours"
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
                                placeholder="Ex: 1 an"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography
                                variant="h6"
                                gutterBottom
                                className="section-title"
                            >
                                Dimensions (optionnel)
                            </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Longueur (cm)"
                                name="longueur"
                                value={formData.dimensions.longueur}
                                onChange={handleDimensionChange}
                            />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Largeur (cm)"
                                name="largeur"
                                value={formData.dimensions.largeur}
                                onChange={handleDimensionChange}
                            />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Hauteur (cm)"
                                name="hauteur"
                                value={formData.dimensions.hauteur}
                                onChange={handleDimensionChange}
                            />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Poids (kg)"
                                name="poids"
                                value={formData.dimensions.poids}
                                onChange={handleDimensionChange}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography
                                variant="h6"
                                gutterBottom
                                className="section-title"
                            >
                                Caractéristiques
                            </Typography>
                        </Grid>
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
                                placeholder="Ex: Couleur"
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
                                placeholder="Ex: Bleu"
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
                        <Grid item xs={12}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 1,
                                }}
                            >
                                {formData.caracteristiques.map((car, index) => (
                                    <Chip
                                        key={index}
                                        label={`${car.cle}: ${car.valeur}`}
                                        onDelete={() =>
                                            supprimerCaracteristique(index)
                                        }
                                        variant="filled"
                                    />
                                ))}
                            </Box>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography
                                variant="h6"
                                gutterBottom
                                className="section-title"
                            >
                                Tags
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={10}>
                            <TextField
                                fullWidth
                                label="Tag"
                                value={tagTemp}
                                onChange={e => setTagTemp(e.target.value)}
                                placeholder="Ex: nouveauté"
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
                        <Grid item xs={12}>
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
                                        variant="outlined"
                                    />
                                ))}
                            </Box>
                        </Grid>
                    </Grid>
                );

            case 2:
                return (
                    <Grid container spacing={3} className="step-content step-2">
                        <Grid item xs={12}>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Ajoutez entre 1 et 6 images (max 5MB chacune).
                                La première image sera l'image principale.
                            </Alert>
                            {errors.images && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {errors.images}
                                </Alert>
                            )}
                        </Grid>

                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                component="label"
                                startIcon={<UploadIcon />}
                                disabled={images.length >= 6}
                            >
                                Choisir des images
                                <input
                                    type="file"
                                    hidden
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                            </Button>
                            <Typography
                                variant="caption"
                                display="block"
                                sx={{ mt: 1 }}
                            >
                                {images.length}/6 images
                            </Typography>
                        </Grid>

                        <Grid item xs={12} className="image-preview-grid">
                            {imagePreviews.map((preview, index) => (
                                <Card key={index} className="image-card">
                                    <Box sx={{ position: 'relative' }}>
                                        <img
                                            src={preview}
                                            alt={`Preview ${index + 1}`}
                                            style={{
                                                width: '100%',
                                                height: 200,
                                                objectFit: 'cover',
                                            }}
                                        />
                                        <IconButton
                                            className="image-actions"
                                            sx={{
                                                bgcolor: 'error.main',
                                                color: 'white',
                                                '&:hover': {
                                                    bgcolor: 'error.dark',
                                                },
                                            }}
                                            size="small"
                                            onClick={() => removeImage(index)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                        {index === 0 && (
                                            <Chip
                                                label="Image principale"
                                                className="main-image-badge"
                                                size="small"
                                            />
                                        )}
                                    </Box>
                                </Card>
                            ))}
                            {images.length < 6 && (
                                <Button
                                    component="label"
                                    variant="outlined"
                                    className="upload-button"
                                >
                                    <UploadIcon />
                                    <span className="upload-text">
                                        Ajouter une image
                                    </span>
                                    <input
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                </Button>
                            )}
                        </Grid>
                    </Grid>
                );

            case 3:
                return (
                    <Grid container spacing={3} className="step-content step-3">
                        <Grid item xs={12}>
                            <Alert severity="success">
                                Vérifiez les informations avant de soumettre
                            </Alert>
                        </Grid>

                        <Grid item xs={12} className="validation-section">
                            <Card className="summary-card">
                                <CardContent>
                                    <Typography
                                        variant="h6"
                                        gutterBottom
                                        className="summary-title"
                                    >
                                        Résumé du produit
                                    </Typography>
                                    <div className="summary-grid">
                                        <div className="summary-item">
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                className="summary-label"
                                            >
                                                Nom
                                            </Typography>
                                            <Typography
                                                variant="body1"
                                                className="summary-value"
                                            >
                                                {formData.nom}
                                            </Typography>
                                        </div>
                                        <div className="summary-item">
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                className="summary-label"
                                            >
                                                Prix
                                            </Typography>
                                            <Typography
                                                variant="body1"
                                                className="summary-value"
                                            >
                                                {parseFloat(
                                                    formData.prix
                                                ).toLocaleString()}{' '}
                                                FCFA
                                                {formData.prixPromo && (
                                                    <Typography
                                                        component="span"
                                                        color="error"
                                                        sx={{ ml: 1 }}
                                                    >
                                                        (Promo:{' '}
                                                        {parseFloat(
                                                            formData.prixPromo
                                                        ).toLocaleString()}{' '}
                                                        FCFA)
                                                    </Typography>
                                                )}
                                            </Typography>
                                        </div>
                                        <div className="summary-item">
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                className="summary-label"
                                            >
                                                Stock
                                            </Typography>
                                            <Typography
                                                variant="body1"
                                                className="summary-value"
                                            >
                                                {formData.stock} unités
                                            </Typography>
                                        </div>
                                        <div className="summary-item">
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                className="summary-label"
                                            >
                                                Images
                                            </Typography>
                                            <Typography
                                                variant="body1"
                                                className="summary-value"
                                            >
                                                {images.length} images
                                            </Typography>
                                        </div>
                                        <div className="summary-item highlighted">
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                className="summary-label"
                                            >
                                                Description
                                            </Typography>
                                            <Typography
                                                variant="body1"
                                                className="summary-value"
                                            >
                                                {formData.description}
                                            </Typography>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                );

            default:
                return null;
        }
    };

    return (
        <Box className="ajouter-produit-container">
            {loading && (
                <div className="loading-overlay">
                    <div className="loader-content">
                        <div className="loader-spinner"></div>
                        <Typography className="loader-text">
                            Publication du produit en cours...
                        </Typography>
                    </div>
                </div>
            )}

            {/* Header */}
            <Box className="page-header">
                <Box className="header-content">
                    <IconButton
                        className="back-button"
                        onClick={() => navigate('/vendeur/mes-produits')}
                    >
                        <BackIcon />
                    </IconButton>
                    <Typography variant="h4" className="page-title">
                        Ajouter un produit
                    </Typography>
                </Box>
            </Box>

            {/* Stepper */}
            <Card className="stepper-container">
                <CardContent>
                    <Stepper activeStep={activeStep}>
                        {steps.map(label => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </CardContent>
            </Card>

            {/* Formulaire */}
            <Card className="form-container">
                <CardContent>
                    {renderStepContent(activeStep)}

                    {loading && <LinearProgress className="loading-progress" />}

                    {/* Navigation */}
                    <Box className="action-buttons">
                        <Button
                            disabled={activeStep === 0 || loading}
                            onClick={handleBack}
                            variant="outlined"
                        >
                            Retour
                        </Button>
                        <Box>
                            {activeStep === steps.length - 1 ? (
                                <Button
                                    variant="contained"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    startIcon={<SaveIcon />}
                                >
                                    Publier le produit
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    onClick={handleNext}
                                >
                                    Suivant
                                </Button>
                            )}
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default AjouterProduit;