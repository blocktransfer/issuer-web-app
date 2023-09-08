import React, { useState, useEffect } from 'react';
import { Route, Switch, Redirect } from "react-router-dom";
import { Routes } from "../routes";

import Login from './Login';
import Dashboard from './Dashboard';
import Investors from './Investors';
import Activity from './Activity';

// components
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Preloader from "../components/Preloader";

const RouteWithLoader = ({ component: Component, ...rest }) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Route {...rest} render={props => ( <> <Preloader show={loaded ? false : true} /> <Component {...props} /> </> ) } />
  );
};

const RouteWithSidebar = ({ component: Component, navbarTitle: string, ...rest }) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const localStorageIsSettingsVisible = () => {
    return localStorage.getItem('settingsVisible') === 'false' ? false : true
  }

  const [showSettings, setShowSettings] = useState(localStorageIsSettingsVisible);

  const toggleSettings = () => {
    setShowSettings(!showSettings);
    localStorage.setItem('settingsVisible', !showSettings);
  }

  return (
    <Route {...rest} render={props => (
      <>
        <Preloader show={loaded ? false : true} />
        <Sidebar />

        <main className="content">
          <Navbar title={string}/>
          <Component {...props} />
          <Footer toggleSettings={toggleSettings} showSettings={showSettings} />
        </main>
      </>
    )}
    />
  );
};

export default () => {
  const [token, setToken] = useState();

  // if (!token) {
  //   return <Login setToken={setToken}></Login>
  // }

  return (
    <Switch>
      <RouteWithLoader exact path={Routes.Login.path} component={Login}/>
      <RouteWithSidebar exact path={Routes.Dashboard.path} component={Dashboard} navbarTitle="Dashboard"/>
      <RouteWithSidebar exact path={Routes.Investors.path} component={Investors} navbarTitle="Investors"/>
      <RouteWithSidebar exact path={Routes.Activity.path} component={Activity} navbarTitle="Activity"/>

      <Redirect to={Routes.NotFound.path} />
    </Switch>
  );
}