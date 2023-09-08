import React from 'react';

import BlockTransferLogo from "../assets/img/icons/logo-192x192.png";
import { Image, Button, Card } from '@themesberg/react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';

export default function Login() {
    return (
        <main className="vh-100">
            <div className="login-wrapper">
                <div className="login-header">
                    <h5 className="m-0">
                        Authentication
                    </h5>
                </div>

                <div className="bg-primary">
                    <Image className="ms-2 mt-3" src={BlockTransferLogo} height="50px" rounded>

                    </Image>
                </div>

                <div className="bg-primary login-container d-flex">
                    <Card border="light" className="shadow-sm shadow-sm">
                        <Card.Header>
                            <h4 className="center-block text-center">Connect your security key</h4>
                        </Card.Header>

                        <Card.Body>
                            <div className="d-flex align-items-center flex-column">
                                <Button variant="secondary" size="sm" className="me-2">
                                    <FontAwesomeIcon icon={faLock} className="me-1" /> Login
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </main>
    );
}