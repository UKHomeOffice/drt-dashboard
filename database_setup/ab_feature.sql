CREATE TABLE ab_feature
(
    email         text NOT NULL,
    function_name text,
    presented_at  timestamp NOT NULL,
    test_type     text,
    PRIMARY KEY (email, function_name)
);
