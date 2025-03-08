import  { APIError } from 'encore.dev/api';

export function convertAPIError(error: any): APIError {
	const { status, body } = error;
	const message = body?.message || error.message || "An error occurred";
	const cause = error.cause as Error | undefined;
	const details = body ? { ...body } : undefined;

	// Map HTTP status codes to ErrCode
	switch (status) {
		case 500: // Internal Server Error as a fallback for unknown
			return APIError.unknown(message, cause).withDetails(details || {});
		case "BAD_REQUEST":
		case 400:
			return APIError.invalidArgument(message, cause).withDetails(details || {});
		case "REQUEST_TIMEOUT":
		case 408:
			return APIError.deadlineExceeded(message, cause).withDetails(details || {});
		case "NOT_FOUND":
		case 404:
			return APIError.notFound(message, cause).withDetails(details || {});
		case "CONFLICT":
		case 409:
			return APIError.alreadyExists(message, cause).withDetails(details || {});
		case "FORBIDDEN":
		case 403:
			return APIError.permissionDenied(message, cause).withDetails(details || {});
		case "TOO_MANY_REQUESTS":
		case 429:
			return APIError.resourceExhausted(message, cause).withDetails(details || {});
		case "PRECONDITION_FAILED":
		case 412:
			return APIError.failedPrecondition(message, cause).withDetails(details || {});
		case "CONFLICT": // Could also map to Aborted in some cases
		case 409:
			return APIError.aborted(message, cause).withDetails(details || {});
		case "RANGE_NOT_SATISFIABLE":
		case 416:
			return APIError.outOfRange(message, cause).withDetails(details || {});
		case "NOT_IMPLEMENTED":
		case 501:
			return APIError.unimplemented(message, cause).withDetails(details || {});
		case "INTERNAL_SERVER_ERROR":
		case 500:
			return APIError.internal(message, cause).withDetails(details || {});
		case "SERVICE_UNAVAILABLE":
		case 503:
			return APIError.unavailable(message, cause).withDetails(details || {});
		case "UNAVAILABLE_FOR_LEGAL_REASONS":
		case 451:
			return APIError.dataLoss(message, cause).withDetails(details || {}); // Could be debated, depending on context
		case "UNAUTHORIZED":
		case 401:
			return APIError.unauthenticated(message, cause).withDetails(details || {});
		default:
			// Fallback for unmapped status codes
			return APIError.unknown(`Unhandled status: ${status}`, cause).withDetails(
				details || {}
			);
	}
}