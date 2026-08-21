import React from 'react';
import {Helmet} from "react-helmet";

const NotFoundPage = () => (
  <div className="govuk-width-container" data-testid="not-found-page">
    <Helmet>
      <title>Page not found - Dynamic Response Tool - Border Force</title>
    </Helmet>
    <main
      className="govuk-main-wrapper govuk-main-wrapper--l"
      id="main-content"
      role="main"
    >
      <div className="govuk-grid-row">
        <div className="govuk-grid-column-two-thirds">
          <h1 className="govuk-heading-l">Page not found</h1>
          <br />
          <br />
          <p className="govuk-body">If you typed the web address, check it is correct.</p>
          <p className="govuk-body">If you pasted the web address, check you copied the entire address.</p>
          <p className="govuk-body">
            If the web address is correct or you selected a link or button, please try again
            <br />
            or email the DRT team at{' '}
            <a
              href="mailto:drtpoiseteam@homeoffice.gov.uk"
              className="govuk-link"
              style={{ textDecoration: 'underline' }}
            >
              drtpoiseteam@homeoffice.gov.uk
            </a>.
          </p>
        </div>
      </div>
    </main>
  </div>
);

export default NotFoundPage;
