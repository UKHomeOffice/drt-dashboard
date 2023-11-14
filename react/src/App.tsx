import React, {useEffect} from 'react';
import './App.css';
import {Home} from './components/Home';
import Alerts from './components/alerts/Alerts';
import AccessRequests from './components/accessrequests/AccessRequests';
import UsersList from './components/users/UsersList';
import {Route, Routes} from "react-router-dom";
import Loading from "./components/Loading";
import Navigation from "./components/Navigation";
import {useConfig} from "./store/config";
import {Container} from "@mui/material";
import {styled} from "@mui/material/styles";
import {RegionPage} from "./components/RegionPage";
import axios from "axios";
import ApiClient from "./services/ApiClient";
import {HealthCheckEditor} from "./components/healthcheckpauseseditor/HealthCheckPausesEditor";
import {useUser} from "./store/user";
import {DropInSessionsList} from "./components/dropins/DropInSessionsList";
import {AddOrEditDropInSession} from "./components/dropins/AddOrEditDropInSession";
import {DropInSessionRegistrations} from "./components/dropins/DropInSessionRegistrations";
import {SnackbarProvider} from 'notistack';
import Link from "@mui/material/Link";
import {FeatureGuidesList} from "./components/featureguides/FeatureGuidesList";
import {AddOrEditFeatureGuide} from "./components/featureguides/AddOrEditFeatureGuide";
import {CreateFeedback} from "./components/feedback/CreateFeedback";

const StyledDiv = styled('div')(() => ({
  textAlign: 'center',
}));

const StyledContainer = styled(Container)(() => ({
  margin: 5,
  padding: 15,
  textAlign: 'left',
  minHeight: 500,
  display: 'inline-block',
}));

export const App = () => {
  const {user} = useUser()
  const {config} = useConfig()

  const currentLocation = window.document.location;
  const logoutLink = "/oauth/logout?redirect=" + currentLocation.toString()

  useEffect(() => {
    const trackUser = async () =>
      axios
        .get(ApiClient.userTrackingEndPoint)
        .catch(reason => {
          console.log('Unable to user tracking' + reason);
        })

    trackUser();
  }, []);

  return (user.kind === "SignedInUser" && config.kind === "LoadedConfig") ?
    <StyledDiv>
      <header role="banner" id="global-header" className=" with-proposition">
        <div className="header-wrapper">
          <div className="header-global">
            <div className="header-logo">
              <Link href="https://www.gov.uk" title="Go to the GOV.UK homepage"
                    id="global-header-logo"
                    className="content"
                    sx={{display: 'flex', gap: 1, alignItems: 'center', justifyItems: 'center'}}>
                <img
                  src="/images/gov.uk_logotype_crown.png"
                  width="36" height="32" alt=""/>
                GOV.UK
              </Link>
            </div>
          </div>
          <div className="header-proposition">
            <div className="logout">
              {user.kind === "SignedInUser" &&
                  <Navigation logoutLink={logoutLink} user={user.profile}/>}
            </div>
            <div className="content">
              <a href="/" id="proposition-name">Dynamic Response Tool</a>
            </div>
          </div>
        </div>
      </header>

      <div id="global-header-bar"/>
      <StyledContainer>
        <SnackbarProvider
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center'
          }}
        />
        <Routes>
          <Route path={"/"} element={<Home config={config.values} user={user.profile}/>}/>
          <Route path={"/access-requests"} element={<AccessRequests/>}/>
          <Route path={"/users"} element={<UsersList/>}/>
          <Route path={"/alerts"} element={<Alerts regions={config.values.portsByRegion} user={user.profile}/>}/>
          <Route path={"/region/:regionName"} element={<RegionPage user={user.profile} config={config.values}/>}/>
          <Route path={"/feature-guides"}>
            <Route path={""} element={<FeatureGuidesList/>}/>
            <Route path={"edit"} element={<AddOrEditFeatureGuide/>}/>
            <Route path={"edit/:guideId"} element={<AddOrEditFeatureGuide/>}/>
          </Route>
          <Route path={"/drop-in-sessions"}>
            <Route path={""} element={<DropInSessionsList/>}/>
            <Route path={"list"} element={<DropInSessionsList/>}/>
            <Route path={"edit"} element={<AddOrEditDropInSession/>}/>
            <Route path={"edit/:dropInId"} element={<AddOrEditDropInSession/>}/>
            <Route path={"list/registered-users/:dropInId"} element={<DropInSessionRegistrations/>}/>
          </Route>
          <Route path={"/health-checks"} element={<HealthCheckEditor/>}/>
          <Route path={"/feedback"} element={<CreateFeedback/>}/>
        </Routes>
      </StyledContainer>
      <footer className="group js-footer" id="footer" role="contentinfo">
        <div className="footer-wrapper">
          <div className="footer-meta">
            <div className="footer-meta-inner">
            </div>
          </div>
        </div>
      </footer>
    </StyledDiv> : <Loading/>
}
