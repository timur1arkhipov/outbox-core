export function replaceTablePlaceholders(
  sql: string,
  schema: string,
  tableName: string,
): string {
  return sql
    .replace(/:schema/g, schema)
    .replace(/:table/g, tableName);
} 