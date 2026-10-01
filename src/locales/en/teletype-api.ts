import type { MessageValue } from "../types.js";

export const apiMessages = {
  "api.readApiEnvelope.duringFileUpload": " during file upload",
  "api.readApiEnvelope.teletypeReturnedInvalidJSONHTTP": ({
    action,
    status,
  }: {
    action: MessageValue;
    status: MessageValue;
  }) => `Teletype returned invalid JSON${action} (HTTP ${status}).`,
  "api.readBoundedResponse.teletypeAPIResponseExceedsAllowed":
    "The Teletype API response exceeds the allowed size.",
  "api.waitOrAbort.requestCancelled": "Request cancelled.",
  "api.teletypeRequest.requestWasCancelledWriteBegan":
    "The request was cancelled after the write began. The outcome is unknown. Check the status before retrying.",
  "api.teletypeRequest.unknownNetworkError": "unknown network error",
  "api.teletypeRequest.networkErrorWhenRequestingTeletype": ({
    path,
    msg,
  }: {
    path: MessageValue;
    msg: MessageValue;
  }) => `Network error when requesting Teletype (${path}): ${msg}. Please try again later.`,
  "api.teletypeRequest.communicationTeletypeWasInterruptedWhile": ({
    path,
  }: {
    path: MessageValue;
  }) =>
    `Communication with Teletype was interrupted while performing the action (${path}). The result is unknown. Check the status before retrying.`,
  "api.teletypeRequest.teletypeAPIUnauthorizedHTTP401": ({ path }: { path: MessageValue }) =>
    `Teletype API rejected the token (HTTP 401, path ${path}). Check that TELETYPE_API_TOKEN is valid and not expired. Issue a new Public API token in the Teletype admin panel. Retrying will not help until the token is fixed.`,
  "api.teletypeRequest.teletypeAPIForbiddenHTTP403": ({ path }: { path: MessageValue }) =>
    `Teletype API denied this action (HTTP 403, path ${path}). The token works but lacks permission for this resource - check the token and project settings in the Teletype admin panel. Retrying will not help.`,
  "api.teletypeRequest.resourceNotFoundTeletypeHTTP": ({ path }: { path: MessageValue }) =>
    `Resource not found in Teletype (HTTP 404, path ${path}). Check that the ID is correct. The object may have been deleted.`,
  "api.teletypeRequest.teletypeRateLimitReachedHTTP": ({ waitSec }: { waitSec: MessageValue }) =>
    `Teletype rate limit reached (HTTP 429). Wait ${waitSec} seconds before retrying.`,
  "api.teletypeRequest.teletypeServerInternalErrorHTTP": ({ status }: { status: MessageValue }) =>
    `Teletype server internal error (HTTP ${status}). This is a temporary error - please try again in 10-30 seconds.`,
  "api.teletypeRequest.teletypeRateLimitReachedTooManyRequestsException": ({
    waitSec,
  }: {
    waitSec: MessageValue;
  }) =>
    `Teletype rate limit reached (TooManyRequestsException). Wait ${waitSec} seconds before retrying.`,
  "api.teletypeRequest.noDescription": "no description",
  "api.teletypeRequest.teletypeAPIReturnedErrorCheck": ({ details }: { details: MessageValue }) =>
    `Teletype API returned error: ${details}. Check that the request parameters are correct.`,
  "api.teletypeRequest.teletypeAPIReturnedUnexpectedData": ({ path }: { path: MessageValue }) =>
    `Teletype API returned an unexpected data format (${path}).`,
  "api.teletypeRequest.requestFailedRepeatedAttempts":
    "The request failed after repeated attempts.",
  "api.teletypeUploadRequest.attachmentPathIsDisabledUse":
    "attachment_path is disabled. Use attachment_url or explicitly enable local uploads in trusted stdio mode.",
  "api.teletypeUploadRequest.fileIsOutsideTELETYPEALLOWED": ({
    filePath,
  }: {
    filePath: MessageValue;
  }) => `The file '${filePath}' is outside TELETYPE_ALLOWED_FILE_ROOTS or is not accessible.`,
  "api.teletypeUploadRequest.fileWasNotFoundOr": ({ filePath }: { filePath: MessageValue }) =>
    `File '${filePath}' was not found or is not a regular file.`,
  "api.teletypeUploadRequest.fileExceedsLocalLimitBytes": ({
    maxUploadBytes,
  }: {
    maxUploadBytes: MessageValue;
  }) => `The file exceeds the local limit ${maxUploadBytes} bytes.`,
  "api.teletypeUploadRequest.readingError": "reading error",
  "api.teletypeUploadRequest.couldNotReadFileCheck": ({
    filePath,
    msg,
  }: {
    filePath: MessageValue;
    msg: MessageValue;
  }) =>
    `Could not read file '${filePath}': ${msg}. Check that the path is absolute and readable. Retrying without fixing the path will not help.`,
  "api.teletypeUploadRequest.uploadCancelledTransferBeganOutcome":
    "Upload cancelled after transfer began. The outcome is unknown. Check status before retrying.",
  "api.teletypeUploadRequest.connectionTeletypeFailedDuringFile": ({
    path,
    msg,
  }: {
    path: MessageValue;
    msg: MessageValue;
  }) =>
    `Connection to Teletype failed during file upload (${path}): ${msg}. The outcome is unknown. Check status before retrying.`,
  "api.teletypeUploadRequest.accessTeletypeAPIIsDenied": ({ status }: { status: MessageValue }) =>
    `Access to Teletype API is denied when uploading a file (HTTP ${status}). Check TELETYPE_API_TOKEN. Permanent error.`,
  "api.teletypeUploadRequest.endpointNotFoundHTTP404": ({ path }: { path: MessageValue }) =>
    `Endpoint not found (HTTP 404, path ${path}). Check that the dialog/channel ID is correct.`,
  "api.teletypeUploadRequest.fileIsTooLargeChannel": ({ filename }: { filename: MessageValue }) =>
    `The file '${filename}' is too large for the channel (HTTP 413). Reduce the size or use a different channel. Permanent error.`,
  "api.teletypeUploadRequest.fileTypeIsNotSupported": ({ mimeType }: { mimeType: MessageValue }) =>
    `File type '${mimeType}' is not supported by the channel (HTTP 415). Permanent error.`,
  "api.teletypeUploadRequest.requestLimitTeletypeHTTP429": ({
    waitSec,
  }: {
    waitSec: MessageValue;
  }) =>
    `The request limit for Teletype (HTTP 429) has been exceeded. Wait ${waitSec} s. Temporary error.`,
  "api.teletypeUploadRequest.teletypeServerErrorDuringFile": ({
    status,
  }: {
    status: MessageValue;
  }) => `Teletype server error during file upload (HTTP ${status}). Retry in 10 to 30 seconds.`,
  "api.teletypeUploadRequest.teletypeRateLimitReachedDuring": ({
    waitSec,
  }: {
    waitSec: MessageValue;
  }) =>
    `Teletype rate limit reached during file upload (TooManyRequestsException). Wait ${waitSec} seconds before retrying.`,
  "api.teletypeUploadRequest.teletypeAPIReturnedErrorWhile": ({
    filename,
    messages,
  }: {
    filename: MessageValue;
    messages: MessageValue;
  }) => `Teletype API returned an error while uploading '${filename}': ${messages}.`,
} as const;
