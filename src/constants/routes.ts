/** Single path segment without `.` — keeps static files like success.html out of short-id routes. */
export const SHORT_ID_ROUTE = '/:short_id([^./]+)' as const
