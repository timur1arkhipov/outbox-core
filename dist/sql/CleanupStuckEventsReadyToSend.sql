UPDATE :schema.:table
SET 
  status = 'READY_TO_SEND',
  retry_count = COALESCE(retry_count, 0) + 1
WHERE 
  status = 'PROCESSING' 
  AND event_date < NOW() - (:timeout_minutes || ' minutes')::INTERVAL
  AND retry_count < :max_retries;