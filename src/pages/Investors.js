import React, { useState, useEffect } from "react";

import { Col, Row } from '@themesberg/react-bootstrap';
import { HolderListWidget, RegisteredTrendsWidget } from '../components/Widgets';
import { BT_ISSUER_PORTAL_SERVER } from '../globals';

export default function Investors() {
    const [ classesInfo, setClassesInfo ] = useState([]);
    const [ investorInfo, setInvestorInfo ] = useState([]);

    const assetCode = 'DEMO';

    useEffect(() => {
        fetch(BT_ISSUER_PORTAL_SERVER + `/asset-class-data/${assetCode}`)
            .then(results => results.json())
            .then(data => {
                // console.log(data);
                setClassesInfo(data);
            })
            .catch(error => {
                console.error(error);
            });
    }, []);

    useEffect(() => {
        const promises = classesInfo.map(assetClass => {
            return fetch(BT_ISSUER_PORTAL_SERVER + `/get-top-investors/${assetClass.code}`)
                .then(results => {
                    if (!results.ok) {
                        throw new Error(results.status);
                    }
                    return results.json();
                })
                .then(investors => {
                    setInvestorInfo(prevInvestorInfo => [...prevInvestorInfo, investors]);
                })
                .catch(error => {
                    console.error(error);
                    setInvestorInfo(prevInvestorInfo => [...prevInvestorInfo, null]);
                });
        });
        
        Promise.all(promises)
            .catch(error => {
                console.error(error);
            });
    }, [classesInfo]);

    return (
        <>
            { classesInfo.map((classInfo, index) => {
                const investorData = investorInfo[index] || [];

                if (investorData) {
                    return (
                            <Row className="mb-3" key={index}>
                                <Col>
                                    <HolderListWidget investors={investorData} 
                                                        class={classInfo.class}
                                                        sharesOutstanding={classInfo.stats.outstandingShares}>
                                    </HolderListWidget>
                                </Col>

                                <Col>
                                    <RegisteredTrendsWidget investors={investorData}>
                                    </RegisteredTrendsWidget>
                                </Col>
                            </Row>
                        );
                } else {
                    return (
                        <>
                        </>
                    );
                }
            })}
        </>
    );
};