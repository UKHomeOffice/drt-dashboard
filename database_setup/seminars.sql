CREATE TABLE seminar
(
    id                 SERIAL PRIMARY KEY,
    latest_update_time timestamp NOT NULL,
    title              VARCHAR(255),
    description        VARCHAR(255),
    start_time         timestamp NOT NULL,
    end_time           timestamp NOT NULL,
    meeting_link        VARCHAR(500),
    published          BOOLEAN   NOT NULL DEFAULT FALSE
);

CREATE TABLE seminar_registration
(
    email         text      NOT NULL,
    seminar_id    integer   NOT NULL,
    register_time timestamp NOT NULL,
    email_sent    timestamp,
    PRIMARY KEY (email, seminar_id)
);
