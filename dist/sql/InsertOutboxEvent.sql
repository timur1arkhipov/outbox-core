INSERT INTO :schema.:table (
  entity_uuid,
  entity_type,
  event_date,
  user_d_login,
  status,
  event_type,
  payload_as_json
) VALUES :outbox_events;
