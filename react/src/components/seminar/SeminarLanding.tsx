import {CreateSeminar} from "./CreateSeminar";
import React, {useState} from "react";
import {ListSeminars, SeminarData} from "./ListSeminars";
import {RegisteredUsers} from "./RegisteredUsers";
import {EditSeminar} from "./EditSeminar";

export function SeminarLanding() {
    const [viewSeminars, setViewSeminars] = useState(false);
    const [listAll, setListAll] = useState(false);
    const [showRegisteredUser, setShowRegisteredUser] = React.useState(false)
    const [rowDetails, setRowDetails] = React.useState({} as SeminarData);
    const [showEdit, setShowEdit] = React.useState(false)

    return (
        viewSeminars ?
            <div>
                <h1>Seminar List | <a href="#" style={{marginTop: '20px'}}
                                      onClick={() => setListAll(!listAll)}>{listAll ? "Ahead Only" : "View all"}</a>
                </h1>
                <ListSeminars listAll={listAll}
                              setListAll={setListAll}
                              setViewSeminars={setViewSeminars}
                              setRowDetails={setRowDetails}
                              rowDetails={rowDetails}
                              showRegisteredUser={showRegisteredUser}
                              setShowRegisteredUser={setShowRegisteredUser}
                              showEdit={showEdit}
                              setShowEdit={setShowEdit}
                />
            </div> :
            showEdit ?
                <div><h1>Edit Seminar | <a href="#" style={{marginTop: '20px'}}
                                           onClick={() => setViewSeminars(true)}>View Seminars</a></h1>
                    <EditSeminar id={rowDetails?.id} title={rowDetails?.title}
                                 startTime={rowDetails?.startTime}
                                 endTime={rowDetails?.endTime}
                                 meetingLink={rowDetails?.meetingLink}
                                 showEdit={showEdit} setShowEdit={setShowEdit}
                    /> :
                </div> :
                showRegisteredUser ?
                    <div>
                        <RegisteredUsers seminarId={rowDetails?.id}
                                         seminarTitle={rowDetails?.title}
                                         showRegisteredUser={showRegisteredUser}
                                         setShowRegisteredUser={setShowRegisteredUser}/>
                    </div>
                    :
                    <div>
                        <h1>Create Seminar | <a href="#" style={{marginTop: '20px'}}
                                                onClick={() => setViewSeminars(true)}>View Seminars</a></h1>
                        <CreateSeminar/>
                    </div>

    )
}
