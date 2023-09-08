import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleDown, faAngleUp, faChartArea, faChartBar, faChartLine, 
         faFlagUsa, faFolderOpen, faGlobeEurope, faPaperclip, faUserPlus,
         faExternalLinkAlt, faLandmark, faBook, faShieldAlt, faEnvelopeOpenText,
         faScroll, faDownload, faSearch } from '@fortawesome/free-solid-svg-icons';
import { Col, Row, Card, Image, Button, ListGroup, ProgressBar, Form, InputGroup, Pagination } from '@themesberg/react-bootstrap';
import Flags from 'country-flag-icons/react/3x2';
import { CircleChart } from "./Charts";
import { faDesktop, faMobileAlt, faTabletAlt } from '@fortawesome/free-solid-svg-icons';
import { Badge } from '@themesberg/react-bootstrap';
import { Table } from '@themesberg/react-bootstrap';
import collapse from "bootstrap/js/src/collapse";
import useGroupedPagination from "./GroupedPagination";
import { chunkArray } from "../utils";
import { BT_ISSUER_PORTAL_SERVER } from '../globals';

const CapitalBreakdownStat = (props) => {
  let link;

  if (props.displayLink) {
    link =
      <Card.Link href="#top" className="text-quaternary fw-bold align-self-center text-center text-md-end">
        <FontAwesomeIcon icon={faExternalLinkAlt} className="ms-2" />
      </Card.Link>;
  } else {
    link =
      <Card.Link href="#top" className="invisible text-quaternary fw-bold align-self-center text-center text-md-end">
        <FontAwesomeIcon icon={faExternalLinkAlt} className="ms-2" />
      </Card.Link>;
  }

  return (
    <div className="d-flex w-75 fixed-stat">
      <div className="d-inline-block align-self-center">
        <FontAwesomeIcon icon={props.statIcon} size="lg"/>
      </div>
      <div className="d-block ms-auto">
        <div className="d-flex flex-column align-items-end">
          <h4 className="mb-0 text-right">{props.statNumber}</h4>
          <label className="mb-0 d-block text-right">{props.statName}</label>
        </div>
      </div>
      {link}
    </div>
  );
};

const PoolStat = (props) => {
  let poolName = props.poolName;
  let value = props.poolShares.toLocaleString("en-US");

  return (
    <div className="d-flex w-75">
      <div className="d-block ms-auto">
        <label className="mb-0">{value} in {poolName} pool</label>
      </div>
      <Card.Link href="#top" className="text-quaternary fw-bold">
        <FontAwesomeIcon icon={faExternalLinkAlt} className="ms-2" />
      </Card.Link>
    </div>
  );
}

// https://stackoverflow.com/questions/44382317/how-can-we-display-backend-data-in-react-js
// Functional component
export const CapitalBreakdownWidget = (props) => {
  let companyName = props.companyName;
  let className = props.class;
  let parValue = props.par;

  let sharesOutstanding = props.sharesOutstanding.toLocaleString("en-US");
  let sharesAtDTC = props.sharesAtDTC.toLocaleString("en-US");
  let treasuryShares = props.treasuryShares.toLocaleString("en-US");
  let restrictedShares = props.restrictedShares.toLocaleString("en-US");
  let reservedShares = props.reservedShares.toLocaleString("en-US");
  let authorizedShares = props.authorizedShares.toLocaleString("en-US");

  let dsppShares = props.dsppShares;
  let pendingIPOShares = props.pendingIPOShares;
  let regAShares = props.regAShares;
  let regCFShares = props.regCFShares;
  let privatePlacementShares = props.privatePlacementShares;
  let shelfShares = props.shelfShares;

  return (
    <Card border="light" className="shadow-sm text-white bg-primary">
      <Card.Header>
        <h4 className="center-block text-center">{companyName} Stock</h4>
        <h5 className="center-block text-center">Class {className}, {parValue} par </h5>
      </Card.Header>

      <Card.Body>
        <div className="d-flex align-items-center flex-column">

          <CapitalBreakdownStat 
            statIcon={faChartLine} 
            statName={"shares outstanding"}
            statNumber={sharesOutstanding}
            displayLink={true}
          ></CapitalBreakdownStat>

          <CapitalBreakdownStat 
            statIcon={faLandmark} 
            statName={"shares at DTC"}
            statNumber={sharesAtDTC}
            displayLink={true}
          ></CapitalBreakdownStat>

          <CapitalBreakdownStat 
            statIcon={faBook} 
            statName={"treasury shares"}
            statNumber={treasuryShares}
            displayLink={true}
          ></CapitalBreakdownStat>

<         CapitalBreakdownStat 
            statIcon={faShieldAlt} 
            statName={"restricted shares"}
            statNumber={restrictedShares}
            displayLink={false}
          ></CapitalBreakdownStat>

<         CapitalBreakdownStat 
            statIcon={faEnvelopeOpenText} 
            statName={"reserved shares"}
            statNumber={reservedShares}
            displayLink={false}
          ></CapitalBreakdownStat>

          { props.dsppShares > 0
            ? <PoolStat poolName="DSPP" poolShares={dsppShares}></PoolStat>
            : <></>
          }

          { props.pendingIPOShares > 0
            ? <PoolStat poolName="pending IPO" poolShares={pendingIPOShares}></PoolStat>
            : <></>
          }

          <PoolStat poolName="Reg A offering" poolShares={regAShares}></PoolStat>
          <PoolStat poolName="Reg CF offering" poolShares={regCFShares}></PoolStat>
          <PoolStat poolName="private placement" poolShares={privatePlacementShares}></PoolStat>
          <PoolStat poolName="shelf registration" poolShares={shelfShares}></PoolStat>
          
          <CapitalBreakdownStat 
            statIcon={faScroll} 
            statName={"authorized shares"}
            statNumber={authorizedShares}
            displayLink={true}
          ></CapitalBreakdownStat>
        </div>
      </Card.Body>
    </Card>
  );
};

// https://stackoverflow.com/questions/65681881/react-dynamic-use-of-country-flag-icons-library
const HolderWidget = (props) => {
  const Flag = Flags[props.nationCode];

  return (
    <div className="d-flex w-90 fixed-stat" style={{ overflow: 'auto' }}>
      <div className="align-self-end mb-2 ms-5">
        <Flag title={props.nationCode} className="... flag"/>
      </div>
      <div className="d-block ms-auto">
        <label className="mb-0 d-block text-right bold-name">{props.name}</label>
        <label className="mb-0 d-block text-right">{Math.round(props.numShares).toString()} shares</label>
        <label className="mb-0 d-block text-right">({(props.percent * 100).toFixed(3)}%)</label>
      </div>
    </div>
  );
};

export const TopRegisteredHoldersWidget = (props) => {
  const investors = props.investors;
  const maxVisibleInvestors = 10;

  const visibleInvestors = investors.slice(0, maxVisibleInvestors);
  const remainingInvestors = investors.slice(maxVisibleInvestors);

  const investorsByRow = chunkArray(visibleInvestors, 2);

  return (
    <Card border="light" className="shadow-sm shadow-sm">
      <Card.Header>
        <h4 className="center-block text-center">Class {props.class} Registered Holders</h4>
      </Card.Header>

      <Card.Body>
        <div className="d-block">
          {investorsByRow.map((row, i) => (
            <Row className="mt-1 mb-1" key={i}>
              {row.map(investor => (
                <Col id="holder-col" col="d-flex justify-content-center align-items-center" key={investor.account_id}>
                  <HolderWidget name={investor.legalName} numShares={investor.balance}
                                percent={(investor.balance / props.sharesOutstanding)} 
                                nationCode={investor.citizen}></HolderWidget>
                </Col>
              ))}
            </Row>
          ))}

          { remainingInvestors.length > 0 && (
            <div className="collapse" id="collapsedShareholders">
              { chunkArray(remainingInvestors, 2).map((row, i) => (
                <Row className="mt-1 mb-1">
                  {row.map(investor => (
                    <Col id="holder-col" col="d-flex justify-content-center align-items-center" key={investor.account_id}>
                      <HolderWidget name={investor.legalName} numShares={investor.balance}
                        percent={(investor.balance / props.sharesOutstanding)} 
                        nationCode={investor.citizen}></HolderWidget>
                    </Col>
                  ))}
                </Row>
              ))}
            </div>
          )}

          {remainingInvestors.length > 0 && (
            <button className="btn btn-secondary centered-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapsedShareholders" aria-expanded="false" aria-controls="collapsedShareholders">
              View All
            </button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}

const HolderDetailsWidget = (props) => {
  const Flag = Flags[props.nationCode];

  return (
    <>
      <div className="d-flex w-90 fixed-stat my-2">
        <Flag title={props.nationCode} className="... flag align-self-center"/>
        <h5 class="align-self-center m-0 p-0 ms-4">{props.holderName}</h5>
        <div className="d-block ms-auto">
          <Row className="text-right">
            <Col>
              <label>{props.quantityAndUnits}</label>
              <label class="ms-3 bold-name">{(props.percentOwned * 100).toFixed(3)}%</label>
              <button type="button" class="btn px-1 py-0">
                <FontAwesomeIcon icon={faExternalLinkAlt}/>
              </button>
            </Col>
          </Row>

          <Row className="text-right">
            <label>{props.holderAddress}</label>
          </Row>
        </div>
      </div>
    </>
  );
};

export const HolderListWidget = (props) => {
  let investors = props.investors;

  const { activeItem, onPrevItem, onNextItem, groupedItems, paginationItems } = useGroupedPagination(investors, 9);

  const size = "md";
  const disablePrev = false;

  return (
    <>
      <Card border="light" className="shadow-sm shadow-sm">
        <Card.Header>
          <div class="d-flex holder-header">
            <div className="d-flex align-items-center left-search-bar">
              <Form className="form-inline">
                <Form.Control type="text" placeholder="Name" />
              </Form>
            </div>

            <div class="center-holder-title">
              <h4 className="center-block text-center p-0 m-0">Class {props.class} Stockholders</h4>
            </div>

            <div class="right-download">
              <button type="button" class="btn d-flex justify-content-end align-items-center">
                <FontAwesomeIcon icon={faDownload} />
              </button>
            </div>

          </div>
        </Card.Header>

        <Card.Body>
          <div className="d-block">
            {
              groupedItems.map((item, index) => (
                <HolderDetailsWidget
                  key={index}
                  nationCode={item.citizen ? item.citizen : "US"}
                  holderName={item.legalName || "undefined"}
                  quantityAndUnits={item.balance || "undefined"}
                  percentOwned={item.balance && props.sharesOutstanding ? (item.balance / props.sharesOutstanding) : "undefined"}
                  holderAddress={item.address && item.address.street1 ? item.address.street1 : "undefined"}
                />
              ))
            }

            <Pagination size={size} className="mt-3 pagination justify-content-center">
              <Pagination.Prev disabled={disablePrev} onClick={onPrevItem}>Previous</Pagination.Prev>
              {paginationItems}
              <Pagination.Next onClick={onNextItem}>Next</Pagination.Next>
            </Pagination>
          </div>
        </Card.Body>
      </Card>
    </>
  );
}

export const CircleChartWidget = (props) => {
  const { title, data = [] } = props;
  const labels = data.map(d => d.label);
  const series = data.map(d => d.value);

  return (
    <Col>
      <div class="d-flex align-items-center flex-row justify-content-center">
        <CircleChart series={series} labels={labels}/>
      </div>

      <div class="d-flex align-items-center flex-row justify-content-center">
        <div>
          <h5 className="mt-2 text-center">{title}</h5>

          {data.map(d => (
            <h6 key={`circle-element-${d.id}`} className="fw-normal text-white">
              { (d.icon != null) 
                ? <FontAwesomeIcon icon={d.icon} className={`icon icon-xs text-${d.color} w-20 me-1`} />
                : <></>
              }
              {` ${d.label} `}{`${d.value}%`}
            </h6>
          ))}
        </div>
      </div>
    </Col>
  );
};

export const RegisteredTrendsWidget = (props) => {
  const stateFrequencyMap = {};
  props.investors.forEach((investor) => {
    if (investor.address && investor.address.subdivision) {
      const state = investor.address.subdivision;
      stateFrequencyMap[state] = (stateFrequencyMap[state] || 0) + 1;
    }
  });

  const totalInvestors = props.investors.length;

  const stateData = Object.keys(stateFrequencyMap).map((state) => ({
    id: state,
    label: state,
    value: (stateFrequencyMap[state] / totalInvestors) * 100,
    color: "secondary",
    icon: null,
  }));

  const holderTypeData = [
    { id: 1, label: "US Individual", value: 80, color: "secondary", icon: null },
    { id: 2, label: "US Corporate", value: 10, color: "tertiary", icon: null },
    { id: 3, label: "US Other", value: 10, color: "primary", icon: null }
  ];

  return (
    <Card border="light" className="shadow-sm text-white bg-primary">
      <Card.Header>
        <h4 className="center-block text-center">Registered Trends</h4>
      </Card.Header>

      <Card.Body class="p-0">
        <div className="d-flex align-items-center flex-column justify-content-center chart-container">
          <div>
            <CircleChartWidget
                  title="State"
                  data={stateData} />
          </div>

          {/* <div className="my-4">
            <CircleChartWidget
                  title="Holder Type"
                  data={holderTypeData} />
          </div> */}

        </div>
      </Card.Body>
    </Card>
  );
}

export const ActivityWidget = (props) => {
  let activity = props.activity;
  // let activity = [
  //   {"asset":"DEMO",
  //    "to":"GBXQUJBEDX5TYLJ6D5BGJZFLYF5GZVGXLWA2ZORS5OIA7H6B5O3MHMTP",
  //    "total_base":"88008.3193547",
  //    "total_usd":"55.2974082",
  //    "price_per_share":0.0006283202384212657,
  //    "timestamp":"2023-07-13T20:32:55Z"}
  // ];

  return (
    <>
      <Card border="light" className="shadow-sm shadow-sm">
        <Card.Header>
          <div className="d-flex justify-content-between">
            <div className="align-self-center">
              <h4 className="center-block text-center p-0 m-0">Class A Stock</h4>
            </div>

            <Row className="align-self-center">
              <Col className="d-flex justify-content-center align-items-center">
                <Badge bg="tertiary">Transfers</Badge>
              </Col>
              
              <Col className="d-flex justify-content-center align-items-center">
                <Badge bg="tertiary">Trades</Badge>
              </Col>

              <Col className="d-flex justify-content-center align-items-center">
                <Badge bg="tertiary">Options</Badge>
              </Col>

              <Col className="d-flex justify-content-center align-items-center">
                <Badge bg="tertiary">Conversions</Badge>
              </Col>
            </Row>

          </div>
        </Card.Header>

        <Card.Body>
          <Table responsive>
            <thead className="thead-light">
              <tr>
                <th className="border-0">Date</th>
                <th className="border-0">Activity</th>
                <th className="border-0">Link</th>
              </tr>
            </thead>
            <tbody>

              { activity.map((item, index) => {
                const formattedDate = new Date(item.timestamp).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                });

                return (
                  <tr key={index}>
                    <td className="border-0 fw-bold">
                      {formattedDate}
                    </td>
                    <td className="border-0">
                        {item.type == 'transfer'
                        ? `${item.from} transferred ${item.amount} ${item.asset} to ${item.to}`
                        : `${item.from} sold ${item.total_base} ${item.asset} to ${item.to}`
                            + ` for $${item.total_usd.toFixed(2)} at $${item.price_per_share.toFixed(2)} per share`}
                    </td>
                    <td className="border-0">
                      <button type="button" className="btn px-1 py-0">
                        <FontAwesomeIcon icon={faExternalLinkAlt}/>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </>
  );
}

export const InsightsWidget = (props) => {
  const [insights, setInsights] = useState({});
  const [selectedTimeframe, setSelectedTimeframe] = useState('max');
  const [isLoading, setIsLoading] = useState(true);

  const handleTimeframeChange = (timeframe) => {
    setSelectedTimeframe(timeframe);

    setIsLoading(true);

    return fetch(BT_ISSUER_PORTAL_SERVER + `/get-activity/${props.assetCode}?timeframe=${timeframe}`)
      .then(results => {
          if (!results.ok) {
              throw new Error(results.status);
          }
          return results.json();
      })
      .then(activityAndStats => {
          let stats = activityAndStats.stats;

          setInsights(stats);
          setIsLoading(false);
      })
      .catch(error => {
          console.error(error);

          setInsights(null);
          setIsLoading(false);
      });
  };

  useEffect(() => {
    handleTimeframeChange('max'); // Default timeframe is max
  }, []);

  return (
    <>
      <Card border="light" className="shadow-sm text-white bg-primary">
        <Card.Header>
          <h4 className="center-block text-center">Insights</h4>
          <div className="btn-group d-flex justify-content-center" role="group" aria-label="Timeframes">
            <button
              className={`btn mx-1 ${selectedTimeframe === 'today' ? 'btn-secondary active' : 'btn-tertiary'}`}
              style={{ color: 'white' }}
              onClick={() => handleTimeframeChange('today')}
            >
              Today
            </button>

            <button
              className={`btn mx-1 ${selectedTimeframe === 'week' ? 'btn-secondary active' : 'btn-tertiary'}`}
              style={{ color: 'white' }}
              onClick={() => handleTimeframeChange('week')}
            >
              Week
            </button>

            <button
              className={`btn mx-1 ${selectedTimeframe === 'month' ? 'btn-secondary active' : 'btn-tertiary'}`}
              style={{ color: 'white' }}
              onClick={() => handleTimeframeChange('month')}
            >
              Month
            </button>

            <button
              className={`btn mx-1 ${selectedTimeframe === 'quarter' ? 'btn-secondary active' : 'btn-tertiary'}`}
              style={{ color: 'white' }}
              onClick={() => handleTimeframeChange('quarter')}
            >
              Quarter
            </button>

            <button
              className={`btn mx-1 ${selectedTimeframe === 'year' ? 'btn-secondary active' : 'btn-tertiary'}`}
              style={{ color: 'white' }}
              onClick={() => handleTimeframeChange('year')}
            >
              Year
            </button>

            <button
              className={`btn mx-1 ${selectedTimeframe === 'max' ? 'btn-secondary active' : 'btn-tertiary'}`}
              style={{ color: 'white' }}
              onClick={() => handleTimeframeChange('max')}
            >
              Max
            </button>
          </div>
        </Card.Header>

        <Card.Body className="pt-0">
          <div>
            {isLoading ? (
                <div>Loading...</div>
              ) : (
                <>
                  {/* Display insights data if not loading */}
                  <h5 className="d-block">{insights.totalTransfers} transfers</h5>
                  <h5 className="d-block">{insights.totalTrades} trades</h5>
                </>
              )}
          </div>
        </Card.Body>
      </Card>
    </>
  );
}