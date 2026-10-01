import type { MessageValue } from "../types.js";

export const apiMessages = {
  "api.readApiEnvelope.duringFileUpload": " при загрузке файла",
  "api.readApiEnvelope.teletypeReturnedInvalidJSONHTTP": ({
    action,
    status,
  }: {
    action: MessageValue;
    status: MessageValue;
  }) => `Сервер Teletype вернул невалидный ответ JSON${action} (HTTP ${status}).`,
  "api.readBoundedResponse.teletypeAPIResponseExceedsAllowed":
    "Ответ Teletype API превышает допустимый размер.",
  "api.waitOrAbort.requestCancelled": "Запрос отменён.",
  "api.teletypeRequest.requestWasCancelledWriteBegan":
    "Запрос отменён после начала записи. Результат неизвестен. Проверьте состояние перед повтором.",
  "api.teletypeRequest.unknownNetworkError": "неизвестная сетевая ошибка",
  "api.teletypeRequest.networkErrorWhenRequestingTeletype": ({
    path,
    msg,
  }: {
    path: MessageValue;
    msg: MessageValue;
  }) => `Сетевая ошибка при запросе к Teletype (${path}): ${msg}. Повторите запрос позже.`,
  "api.teletypeRequest.communicationTeletypeWasInterruptedWhile": ({
    path,
  }: {
    path: MessageValue;
  }) =>
    `Связь с Teletype прервалась при выполнении действия (${path}). Результат неизвестен. Проверьте состояние перед повтором.`,
  "api.teletypeRequest.teletypeAPIUnauthorizedHTTP401": ({ path }: { path: MessageValue }) =>
    `Teletype API отклонил токен (HTTP 401, путь ${path}). Проверьте, что TELETYPE_API_TOKEN валиден и не истёк, выпустите новый токен Public API в админке Teletype. Это постоянная ошибка, повтор не поможет.`,
  "api.teletypeRequest.teletypeAPIForbiddenHTTP403": ({ path }: { path: MessageValue }) =>
    `Teletype API запретил это действие (HTTP 403, путь ${path}). Токен работает, но у него нет прав на этот ресурс, проверьте токен и настройки проекта в админке Teletype. Повтор не поможет.`,
  "api.teletypeRequest.resourceNotFoundTeletypeHTTP": ({ path }: { path: MessageValue }) =>
    `Ресурс не найден в Teletype (HTTP 404, путь ${path}). Проверьте корректность ID. Возможно, объект был удалён.`,
  "api.teletypeRequest.teletypeRateLimitReachedHTTP": ({ waitSec }: { waitSec: MessageValue }) =>
    `Превышен лимит запросов к Teletype (HTTP 429). Подождите ${waitSec} с и повторите. Это временная ошибка.`,
  "api.teletypeRequest.teletypeServerInternalErrorHTTP": ({ status }: { status: MessageValue }) =>
    `Внутренняя ошибка сервера Teletype (HTTP ${status}). Это временная ошибка, повторите запрос через 10–30 секунд.`,
  "api.teletypeRequest.teletypeRateLimitReachedTooManyRequestsException": ({
    waitSec,
  }: {
    waitSec: MessageValue;
  }) =>
    `Превышен лимит запросов к Teletype (TooManyRequestsException). Подождите ${waitSec} с и повторите. Это временная ошибка.`,
  "api.teletypeRequest.noDescription": "без описания",
  "api.teletypeRequest.teletypeAPIReturnedErrorCheck": ({ details }: { details: MessageValue }) =>
    `Teletype API вернул ошибку: ${details}. Проверьте корректность параметров запроса.`,
  "api.teletypeRequest.teletypeAPIReturnedUnexpectedData": ({ path }: { path: MessageValue }) =>
    `Teletype API вернул неожиданный формат данных (${path}).`,
  "api.teletypeRequest.requestFailedRepeatedAttempts":
    "Не удалось выполнить запрос после повторных попыток.",
  "api.teletypeUploadRequest.attachmentPathIsDisabledUse":
    "attachment_path отключён. Используйте attachment_url либо явно включите локальные загрузки в доверенном stdio-режиме.",
  "api.teletypeUploadRequest.fileIsOutsideTELETYPEALLOWED": ({
    filePath,
  }: {
    filePath: MessageValue;
  }) => `Файл '${filePath}' находится вне TELETYPE_ALLOWED_FILE_ROOTS или недоступен.`,
  "api.teletypeUploadRequest.fileWasNotFoundOr": ({ filePath }: { filePath: MessageValue }) =>
    `Файл '${filePath}' не найден или не является обычным файлом.`,
  "api.teletypeUploadRequest.fileExceedsLocalLimitBytes": ({
    maxUploadBytes,
  }: {
    maxUploadBytes: MessageValue;
  }) => `Файл превышает локальный лимит ${maxUploadBytes} байт.`,
  "api.teletypeUploadRequest.readingError": "ошибка чтения",
  "api.teletypeUploadRequest.couldNotReadFileCheck": ({
    filePath,
    msg,
  }: {
    filePath: MessageValue;
    msg: MessageValue;
  }) =>
    `Не удалось прочитать файл по пути '${filePath}': ${msg}. Проверьте, что путь абсолютный и файл доступен на чтение. Это постоянная ошибка, повтор не поможет.`,
  "api.teletypeUploadRequest.uploadCancelledTransferBeganOutcome":
    "Загрузка отменена после начала отправки. Результат неизвестен. Проверьте состояние перед повтором.",
  "api.teletypeUploadRequest.connectionTeletypeFailedDuringFile": ({
    path,
    msg,
  }: {
    path: MessageValue;
    msg: MessageValue;
  }) =>
    `Связь с Teletype прервалась при загрузке файла (${path}): ${msg}. Результат неизвестен. Проверьте состояние перед повтором.`,
  "api.teletypeUploadRequest.accessTeletypeAPIIsDenied": ({ status }: { status: MessageValue }) =>
    `Доступ к Teletype API запрещён при загрузке файла (HTTP ${status}). Проверьте TELETYPE_API_TOKEN. Постоянная ошибка.`,
  "api.teletypeUploadRequest.endpointNotFoundHTTP404": ({ path }: { path: MessageValue }) =>
    `Эндпоинт не найден (HTTP 404, путь ${path}). Проверьте корректность ID диалога/канала.`,
  "api.teletypeUploadRequest.fileIsTooLargeChannel": ({ filename }: { filename: MessageValue }) =>
    `Файл '${filename}' слишком большой для канала (HTTP 413). Уменьшите размер или используйте другой канал. Постоянная ошибка.`,
  "api.teletypeUploadRequest.fileTypeIsNotSupported": ({ mimeType }: { mimeType: MessageValue }) =>
    `Тип файла '${mimeType}' не поддерживается каналом (HTTP 415). Постоянная ошибка.`,
  "api.teletypeUploadRequest.requestLimitTeletypeHTTP429": ({
    waitSec,
  }: {
    waitSec: MessageValue;
  }) => `Превышен лимит запросов к Teletype (HTTP 429). Подождите ${waitSec} с. Временная ошибка.`,
  "api.teletypeUploadRequest.teletypeServerErrorDuringFile": ({
    status,
  }: {
    status: MessageValue;
  }) =>
    `Внутренняя ошибка сервера Teletype при загрузке файла (HTTP ${status}). Временная, повторите через 10–30 секунд.`,
  "api.teletypeUploadRequest.teletypeRateLimitReachedDuring": ({
    waitSec,
  }: {
    waitSec: MessageValue;
  }) =>
    `Превышен лимит запросов к Teletype при загрузке файла (TooManyRequestsException). Подождите ${waitSec} с. Временная ошибка.`,
  "api.teletypeUploadRequest.teletypeAPIReturnedErrorWhile": ({
    filename,
    messages,
  }: {
    filename: MessageValue;
    messages: MessageValue;
  }) => `Teletype API вернул ошибку при загрузке файла '${filename}': ${messages}.`,
} as const;
