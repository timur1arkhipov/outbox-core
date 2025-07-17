UPDATE :schema.:table
SET
  retry_count = CASE
    WHEN (:status = 'ERROR') THEN COALESCE(retry_count, 0) + 1
    ELSE retry_count
  END,
  status = :status
WHERE event_s_uuid IN (:event_uuids);