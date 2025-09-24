import React from 'react'
import './Footer.scss'
import logo from '../../../assets/logo/neos-brands-solid.svg'
import appstore from '../../../assets/icons/appstore.png'
import googleplay from '../../../assets/icons/googleplay.png'

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="row">
                    <div className="col-md-3">
                        <img
                            src={logo}
                            alt="Nody logo"
                            width="120"
                            className="mb-2"
                        />
                        <h5>
                            <strong>Nody</strong> dans votre poche !
                        </h5>
                        <p>Téléchargez notre application gratuite</p>
                        <div className="d-flex gap-2">
                            <a href="#">
                                <img
                                    src={appstore}
                                    alt="App Store"
                                    width="120"
                                />
                            </a>
                            <a href="#">
                                <img
                                    src={googleplay}
                                    alt="Google Play"
                                    width="120"
                                />
                            </a>
                        </div>
                    </div>
                    <div className="col-md-2">
                        <h6>BESOIN D’AIDE ?</h6>
                        <ul>
                            <li>
                                <a href="#">Discuter avec nous</a>
                            </li>
                            <li>
                                <a href="#">Centre d’assistance</a>
                            </li>
                            <li>
                                <a href="#">Contactez-nous</a>
                            </li>
                        </ul>
                    </div>
                    <div className="col-md-2">
                        <h6>LIENS UTILES</h6>
                        <ul>
                            <li>
                                <a href="#">Suivre sa commande</a>
                            </li>
                            <li>
                                <a href="#">Expédition et livraison</a>
                            </li>
                            <li>
                                <a href="#">Politique de retour</a>
                            </li>
                            <li>
                                <a href="#">Comment commander ?</a>
                            </li>
                        </ul>
                    </div>
                    <div className="col-md-2">
                        <h6>RETROUVEZ-NOUS SUR</h6>
                        <ul>
                            <li>
                                <a href="#">Facebook</a>
                            </li>
                            <li>
                                <a href="#">Twitter</a>
                            </li>
                            <li>
                                <a href="#">Instagram</a>
                            </li>
                            <li>
                                <a href="#">TikTok</a>
                            </li>
                        </ul>
                        <h6 className="mt-4">SITES NODY</h6>
                        <ul>
                            <li>
                                <a href="#">Sénégal</a>
                            </li>
                            <li>
                                <a href="#">Gabon</a>
                            </li>
                            <li>
                                <a href="#">Côte d'Ivoire</a>
                            </li>
                            <li>
                                <a href="#">Congo</a>
                            </li>
                        </ul>
                    </div>
                    <div className="col-md-3">
                        <h6>À PROPOS</h6>
                        <ul>
                            <li>
                                <a href="#">Qui sommes-nous</a>
                            </li>
                            <li>
                                <a href="#">Conditions générales</a>
                            </li>
                            <li>
                                <a href="#">Politique de retour</a>
                            </li>
                            <li>
                                <a href="#">Paiement sécurisé</a>
                            </li>
                            <li>
                                <a href="#">Confidentialité</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>
    )
}
