
CREATE TABLE training_data_template
(
    id            SERIAL PRIMARY KEY,
    upload_time   timestamp NOT NULL,
    file_name      VARCHAR(255),
    title         VARCHAR(255),
    markdown_content TEXT NOT NULL
);
