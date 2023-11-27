CREATE TABLE ab_feature
(
    presented_at  timestamp NOT NULL,
    function_name text,
    test_type     text,
    PRIMARY KEY (presented_at, function_name)
);
