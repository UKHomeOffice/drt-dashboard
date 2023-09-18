import {CreateSeminar} from "./CreateSeminar";
import React from "react";
import {ListSeminars} from "./ListSeminars";
import {EditSeminar} from "./EditSeminar";
import {
    BrowserRouter as Router,
    Route,
    Switch,
    Link,
} from "react-router-dom";
import {RegisteredUsers} from "./RegisteredUsers";

export function SeminarLanding() {

    return (
        <div>
            <Router>
                <Link to={`/seminars/list`}>List</Link> | <Link to={`/seminars/new`}>Create</Link>
                <Switch>
                    <Route exact path="/seminars/list/:listAll?">
                        <ListSeminars/>
                    </Route>
                    <Route exact path="/seminars/new">
                        <CreateSeminar/>
                    </Route>
                    <Route exact path="/seminars/edit/:seminarId">
                        <EditSeminar/>
                    </Route>
                    <Route exact path="/seminars/registeredUsers/:seminarId">
                        <RegisteredUsers/>
                    </Route>
                </Switch>
            </Router>
        </div>
    )
}
