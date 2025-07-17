SELECT m.* FROM 
  (
		SELECT 
			entity_uuid, 
			MAX(event_date) AS max_created_at
		FROM :schema.:table
		WHERE 
			status IN ('SENT', 'ERROR')
			AND 
			entity_uuid IN (:entity_uuids)
		GROUP BY entity_uuid
	) t JOIN :schema.:table m 
		ON t.entity_uuid = m.entity_uuid
		AND t.max_created_at = m.event_date
	ORDER BY event_date DESC;