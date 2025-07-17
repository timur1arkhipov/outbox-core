CREATE TABLE IF NOT EXISTS :schema.:table (
  event_s_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_uuid UUID NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  event_date TIMESTAMP NOT NULL DEFAULT NOW(),
  user_d_login VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'READY_TO_SEND',
  event_type VARCHAR(100) NOT NULL,
  payload_as_json JSONB,
  retry_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_:table_status ON :schema.:table(status);
CREATE INDEX IF NOT EXISTS idx_:table_event_date ON :schema.:table(event_date);
CREATE INDEX IF NOT EXISTS idx_:table_entity_uuid ON :schema.:table(entity_uuid);
CREATE INDEX IF NOT EXISTS idx_:table_entity_type ON :schema.:table(entity_type);
CREATE INDEX IF NOT EXISTS idx_:table_status_event_date ON :schema.:table(status, event_date); 