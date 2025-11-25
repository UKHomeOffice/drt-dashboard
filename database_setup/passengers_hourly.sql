CREATE TABLE public.passengers_hourly (
  port        VARCHAR(3)        NOT NULL,
  terminal    VARCHAR(3)        NOT NULL,
  queue       VARCHAR(10)       NOT NULL,
  date_utc    VARCHAR(10)       NOT NULL,
  hour        SMALLINT          NOT NULL,
  passengers  SMALLINT          NOT NULL,
  updated_at  TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  PRIMARY KEY (port, terminal, queue, date_utc, hour)
);

CREATE INDEX idx_passengers_hourly_date ON public.passengers_hourly (date_utc);

CREATE INDEX idx_passengers_hourly_port_date ON public.passengers_hourly (port, date_utc);

CREATE INDEX idx_passengers_hourly_port_terminal_date ON public.passengers_hourly (port, terminal, date_utc);

CREATE INDEX idx_passengers_hourly_port_terminal_date_hour ON public.passengers_hourly (port, terminal, date_utc, hour);
