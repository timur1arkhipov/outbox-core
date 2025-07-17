SELECT 
	ev.event_s_uuid,
	ev.entity_uuid,
	ev.entity_type,
	ev.event_date as created_at,
	ev.user_d_login as created_by,
	ev.status,
	ev.event_type,
	ev.payload_as_json,
	ev.retry_count
FROM :schema.:table ev
WHERE
  ((:event_uuids) IS NULL OR ev.event_s_uuid IN (:event_uuids))
	AND
	((:entity_uuids) IS NULL OR ev.entity_uuid IN (:entity_uuids))
	AND
	((:entity_types) IS NULL OR ev.entity_type IN (:entity_types))
	AND
	((:status) IS NULL OR ev.status IN (:status))
	AND
	((:with_lock) IS NULL OR (:with_lock) = false OR ev.status IN ('READY_TO_SEND', 'ERROR'))
ORDER BY ev.event_date ASC
FOR UPDATE SKIP LOCKED
LIMIT :limit;