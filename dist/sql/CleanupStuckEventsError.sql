UPDATE :schema.:table
SET status = 'ERROR'
WHERE 
  status = 'PROCESSING' 
  AND event_date < NOW() - (:timeout_minutes || ' minutes')::INTERVAL
  AND retry_count >= :max_retries;