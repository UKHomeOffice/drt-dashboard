CREATE TABLE user_feedback
(
    email  text NOT NULL,
    actioned_at timestamp NOT NULL,
    feedback_at timestamp,
    close_banner boolean,
    feedback_type text,
    bf_role     text,
    drt_quality text,
    drt_likes   text,
    drt_improvements text,
    participation_interest text,
    a_or_b_test text,
    PRIMARY KEY (email, actioned_at)
);
