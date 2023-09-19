import {CreateSeminar} from "./CreateSeminar";
import React from "react";
import {ListSeminars} from "./ListSeminars";
import {EditSeminar} from "./EditSeminar";
import {
    BrowserRouter as Router,
    Route,
    Switch,
    Link, useLocation,
} from "react-router-dom";
import {RegisteredUsers} from "./RegisteredUsers";
import {Breadcrumbs} from "@mui/material";
import Typography from "@mui/material/Typography";

export function SeminarLanding() {
    const breadcrumbNameMap: { [key: string]: string } = {
        '/seminars': 'Seminars',
        '/seminars/new': 'Create',
        '/seminars/edit/:seminarId': 'Edit',
        '/seminars/list': 'List',
        '/seminars/list/save': 'List',
        '/seminars/list/registeredUsers/:seminarId': 'registrations',
    };

    const SeminarsBreadcrumbs: React.FC = () => {
        const location = useLocation();
        const pathnames = location.pathname.split('/').filter((x) => x);

        return (
            <Breadcrumbs aria-label="breadcrumb">
                {pathnames.map((value, index) => {
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                    let name = breadcrumbNameMap[to];

                    if (!name) {
                        for (const key in breadcrumbNameMap) {
                            const regexPath = '^' + key.split('/').map(segment => {
                                if (segment.startsWith(':')) {
                                    return '[^/]+';
                                } else if (segment === '*') {
                                    return '.*';
                                }
                                return segment;
                            }).join('/') + '$';

                            if (new RegExp(regexPath).test(to)) {
                                name = breadcrumbNameMap[key];
                                break;
                            }
                        }
                    }

                    if (!name) return null;

                    const last = index === pathnames.length - 1;

                    return last ? (
                        <Typography color="textPrimary" key={to}>
                            {name}
                        </Typography>
                    ) : (
                        <Link color="inherit" to={to} key={to}>
                            {name}
                        </Link>
                    );
                })}
            </Breadcrumbs>
        );
    };

    return (
        <div>
            <Router>
                <SeminarsBreadcrumbs/>
                <Switch>
                    <Route exact path="/seminars" component={ListSeminars}/>
                    <Route exact path="/seminars/list/crud/:operations" component={ListSeminars}/>
                    <Route exact path="/seminars/list/:listAll?" component={ListSeminars}/>
                    <Route exact path="/seminars/new" component={CreateSeminar}/>
                    <Route exact path="/seminars/edit/:seminarId" component={EditSeminar}/>
                    <Route exact path="/seminars/list/registeredUsers/:seminarId" component={RegisteredUsers}/>
                </Switch>
            </Router>
        </div>
    )
}
