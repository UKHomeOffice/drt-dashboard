import React, { ReactElement } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { Provider } from 'react-redux';
import { App } from '../../App';
import { BrowserRouter } from 'react-router-dom';
import ApiClient from '../../services/ApiClient';
import store from '../../store/redux';


describe.skip('Dashboard routing', () => {
    function newServer(userPorts: string[], roles: string[], allPorts: string[]) {
        return setupServer(
            rest.get(ApiClient.userEndPoint, (req, res, ctx) => {
                return res(ctx.json({ports: userPorts, roles: roles.concat(userPorts), email: 'someone@drt'}))
            }),
            rest.get(ApiClient.configEndPoint, (req, res, ctx) => {
                return res(ctx.json({ports: allPorts, domain: 'drt.localhost'}))
            })
        );
    }

    const renderWithRouter = (ui: ReactElement, { route = '/' } = {}) => {
        window.history.pushState({}, 'Test page', route)

        return render(ui, { wrapper: BrowserRouter })
    }

    it('displays the home page for the / route', async () => {

        const server = newServer([],[], ['lhr', 'bhx'])
        server.listen();

        renderWithRouter(<App/>);

        await waitFor(() => {
            expect(screen.getByText("Welcome to DRT"));
        });

        server.close();
    });

    it('displays the alerts page for the /alerts route', async () => {

        const server = newServer([],[], ['lhr', 'bhx'])
        server.listen();

        renderWithRouter(<App/>, {"route" : "/alerts"});

        await waitFor(() => {
            expect(screen.getByText("Add Alert"));
            expect(screen.getByText("View Alerts"));
        });

        server.close();
    });
});

describe('Not found routing - for when invalid URLS/ routes are provided', () => {
    function createNotFoundServer() {

        const configResponse = {
            portsByRegion: [
                { name: 'central', ports: ['LHR-T2'] },
                { name: 'north', ports: ['MAN-T1'] },
            ],
            ports: [
                { iata: 'LHR', terminals: ['T2'] },
                { iata: 'MAN', terminals: ['T1'] },
            ],
            domain: 'drt.localhost',
            teamEmail: 'drtpoiseteam@homeoffice.gov.uk',
        };

        const userResponse = {
            ports: ['LHR', 'MAN'],
            roles: ['rcc:central', 'rcc:north', 'LHR', 'MAN'],
            email: 'someone@drt',
        };

        return setupServer(
            rest.get(ApiClient.userEndPoint, (_req, res, ctx) => res(ctx.status(200), ctx.json(userResponse))),
            rest.get(ApiClient.configEndPoint, (_req, res, ctx) => res(ctx.status(200), ctx.json(configResponse))),
            rest.get(ApiClient.userTrackingEndPoint, (_req, res, ctx) => res(ctx.status(200), ctx.json({ ok: true }))),
            rest.get(`${ApiClient.getDropInSessionEndpoint}/:id`, (_req, res, ctx) => res(ctx.status(404))),
            rest.get(`${ApiClient.dropInSessionRegistrationsEndpoint}/:id`, (_req, res, ctx) => res(ctx.status(404)))
        );
    }

    const renderWithRouter = (ui: ReactElement, { route = '/' } = {}) => {
        window.history.pushState({}, 'Test page', route)

        return render(
            <Provider store={store}>
                <BrowserRouter>
                    {ui}
                </BrowserRouter>
            </Provider>
        )
    }

    const expectNotFound = async () => {
        await waitFor(() => {
            expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
        });
    };

    const expectRouteToShowNotFound = async (route: string) => {
        const server = createNotFoundServer();
        server.listen();

        try {
            renderWithRouter(<App/>, { route });
            await expectNotFound();
        } finally {
            server.close();
        }
    };

    it('shows NotFound for an unknown top-level route', async () => {
        await expectRouteToShowNotFound('/afsd');
    });

    it('shows NotFound for invalid regional dashboard region', async () => {
        await expectRouteToShowNotFound('/national-pressure/fjof');
    });

    it('shows NotFound for invalid region page slug', async () => {
        await expectRouteToShowNotFound('/region/asdfg');
    });

    it('shows NotFound for invalid feedback route params', async () => {
        await expectRouteToShowNotFound('/feedback/unknown/Z');
    });

    it('shows NotFound for invalid drop-in edit id', async () => {
        await expectRouteToShowNotFound('/drop-in-sessions/edit/f');
    });

    it('shows NotFound for invalid drop-in registration id', async () => {
        await expectRouteToShowNotFound('/drop-in-sessions/list/registered-users/f');
    });
});
