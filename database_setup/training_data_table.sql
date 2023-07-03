CREATE TABLE training_data_template
(
    id               SERIAL PRIMARY KEY,
    upload_time      timestamp NOT NULL,
    file_name        VARCHAR(255),
    title            VARCHAR(255),
    markdown_content TEXT      NOT NULL
);

CREATE TABLE user_feature_view
(
    email     text NOT NULL,
    file_id   integer NOT NULL,
    view_time timestamp NOT NULL,
    PRIMARY KEY (email, file_id)
);