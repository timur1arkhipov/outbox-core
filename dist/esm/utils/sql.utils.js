export function replaceTablePlaceholders(sql, schema, tableName) {
    return sql
        .replace(/:schema/g, schema)
        .replace(/:table/g, tableName);
}
//# sourceMappingURL=sql.utils.js.map