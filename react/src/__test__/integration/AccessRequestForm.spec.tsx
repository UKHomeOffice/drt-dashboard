import React from 'react';
import {rest} from 'msw'
import {setupServer} from 'msw/node'
import {fireEvent, render, screen, act, waitFor} from '@testing-library/react';
import AccessRequestForm from "../../components/AccessRequestForm";

const server = setupServer(
    rest.post('/api/access-request', (req, res, ctx) => {
        return res(ctx.text('OK'))
    })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())


function submitIsDisabled() {
    expect(screen.getByText('Request access').closest('button')).toHaveAttribute('disabled');
}

function submitIsNotDisabled() {
    expect(screen.getByText('Request access').closest('button')).not.toHaveAttribute('disabled');
}

describe.skip('<AccessRequestForm />', () => {
    it('has a disabled submit button by default, and becomes enabled when a port is selected and the declaration is greed', () => {
        
        act(() => {
            render(<AccessRequestForm regions={[{name: 'Heathrow', ports: ['LHR']}]} teamEmail={"test@test.com"}/>);
        });
        
        submitIsDisabled();

        fireEvent.click(screen.getByText('LHR'));
        fireEvent.click(screen.getByText('I understand and agree with the above declarations'));

        submitIsNotDisabled();
    });

    it('has a disabled submit button when the last selected port becomes de-selected and declaration is agreed', () => {
        act(() => {
            render(<AccessRequestForm regions={[{name: 'Heathrow', ports: ['LHR']}]} teamEmail={"test@test.com"}/>);
        });

        fireEvent.click(screen.getByText('I understand and agree with the above declarations'));
        fireEvent.click(screen.getByText('LHR'));

        submitIsNotDisabled();

        fireEvent.click(screen.getByText('LHR'));

        submitIsDisabled();
    });

    it('enables the submit button when "all ports" is selected and disables it when it is deselected', () => {
        act(() => {
            render(<AccessRequestForm regions={[{name: 'Heathrow', ports: ['LHR']}]} teamEmail={"test@test.com"}/>);
        });

        fireEvent.click(screen.getByText('All ports'));
        fireEvent.click(screen.getByText('I understand and agree with the above declarations'));

        submitIsNotDisabled();
        fireEvent.click(screen.getByText('All ports'));

        submitIsDisabled();
    });

    it('disables the submit button when the declaration is deselected', () => {
        act(() => {
            render(<AccessRequestForm regions={[{name: 'Heathrow', ports: ['LHR']}]} teamEmail={"test@test.com"}/>);
        });

        act(() => {
            fireEvent.click(screen.getByText('All ports'));
        });
        submitIsDisabled();

        act(() => {
            fireEvent.click(screen.getByText('All ports'));
            fireEvent.click(screen.getByText('LHR'));
        });
        submitIsDisabled();
    });


    it('displays a thank you message on submitting the form', async () => {
        act(() => {
            render(<AccessRequestForm regions={[{name: 'Heathrow', ports: ['LHR']}]} teamEmail={"test@test.com"}/>);
        });

        fireEvent.click(screen.getByText('LHR'));
        fireEvent.click(screen.getByText('I understand and agree with the above declarations'));

        submitIsNotDisabled();

        fireEvent.click(screen.getByText('Request access'));

        await waitFor(() => expect(screen.getByText('Thank you')));
    });
});
