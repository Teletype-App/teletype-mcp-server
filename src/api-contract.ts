import { z } from "zod";

const optionalString = z.string().optional().catch(undefined);
const optionalBoolean = z.boolean().optional().catch(undefined);
const optionalNumber = z.number().optional().catch(undefined);
const idItemSchema = z.looseObject({ id: z.string().min(1) });
const idPageSchema = z.looseObject({ items: z.array(idItemSchema) });
const dateSchema = z.union([
  z.string(),
  z.looseObject({ date: z.string(), timezone: optionalString }),
]);
const optionalDate = dateSchema.optional().catch(undefined);

const tagSchema = idItemSchema.extend({
  tag: z.string(),
  color: optionalString,
  description: optionalString,
});
const channelSchema = idItemSchema.extend({
  name: optionalString,
  channelType: optionalString,
  type: optionalString,
  active: optionalBoolean,
  isActive: optionalBoolean,
  status: z.union([z.number(), z.string()]).optional().catch(undefined),
});
const clientSchema = idItemSchema.extend({
  name: optionalString,
  phone: optionalString,
  email: optionalString,
  url: optionalString,
  tags: z
    .array(
      z.union([
        z.string(),
        z.looseObject({
          id: optionalString,
          tag: optionalString,
          name: optionalString,
        }),
      ]),
    )
    .optional()
    .catch(undefined),
});
const operatorSchema = idItemSchema.extend({
  name: optionalString,
  firstName: optionalString,
  lastName: optionalString,
  last_name: optionalString,
  status: optionalNumber,
});
const categorySchema = idItemSchema.extend({ name: optionalString, title: optionalString });
const dialogSchema = idItemSchema.extend({
  lastSessionId: optionalString,
  appealExternalId: z.union([z.string(), z.number()]).optional().catch(undefined),
  clientId: optionalString,
  channelId: optionalString,
  channel: channelSchema.optional().catch(undefined),
  status: z.union([z.string(), z.number()]).optional().catch(undefined),
  lastMessage: z
    .looseObject({ text: optionalString, createdAt: optionalDate })
    .optional()
    .catch(undefined),
  lastMessageText: optionalString,
  updatedAt: optionalDate,
  lastMessageAt: optionalDate,
  assignedOperatorId: optionalString,
  client: clientSchema.optional().catch(undefined),
  clientName: optionalString,
  isUnanswered: optionalBoolean,
  unanswered: optionalBoolean,
  categoryId: optionalString,
  lastCategoryId: optionalString,
  category: z.looseObject({ id: optionalString }).optional().catch(undefined),
  operator: z.looseObject({ id: optionalString, name: optionalString }).optional().catch(undefined),
});
const dialogDetailsSchema = z.looseObject({
  id: optionalString,
  clientId: optionalString,
  isOpen: optionalBoolean,
  isUnanswered: optionalBoolean,
  sessionId: optionalString,
  channelId: optionalString,
  channel: channelSchema.optional().catch(undefined),
  assignedOperatorId: optionalString,
  operator: z.looseObject({ id: optionalString, name: optionalString }).optional().catch(undefined),
  categoryId: optionalString,
  lastCategoryId: optionalString,
  client: clientSchema.optional().catch(undefined),
  lastSessionId: optionalString,
  appealExternalId: z.union([z.string(), z.number()]).optional().catch(undefined),
});
const attachmentSchema = z.looseObject({
  type: optionalString,
  kind: optionalString,
  url: optionalString,
  path: optionalString,
  name: optionalString,
  filename: optionalString,
  size: optionalNumber,
});
const messageSchema = idItemSchema.extend({
  dialogId: optionalString,
  sessionId: optionalString,
  position: optionalNumber,
  text: optionalString,
  type: optionalNumber,
  status: optionalNumber,
  clientId: optionalString,
  operatorId: optionalString,
  operator: z.looseObject({ id: optionalString, name: optionalString }).optional().catch(undefined),
  client: z.looseObject({ id: optionalString, name: optionalString }).optional().catch(undefined),
  isItClient: optionalBoolean,
  createdAt: optionalDate,
  created_at: optionalString,
  attachments: z.array(attachmentSchema).optional().catch(undefined),
  replied_message_id: optionalString,
  repliedMessageId: optionalString,
  repliedMessage: z.looseObject({ id: optionalString }).nullable().optional().catch(undefined),
});
const templateSchema = z.looseObject({
  id: z.string().optional(),
  name: z.string().optional(),
  key: z.string().optional(),
  text: z.string().optional(),
  message: z.string().optional(),
  forChannel: z.string().nullable().optional(),
  typeName: z.string().optional(),
});
const templateDirectorySchema = z.looseObject({
  name: z.string().optional(),
  templates: z.array(templateSchema).optional(),
});
const templateListSchema = z.looseObject({
  directories: z.array(templateDirectorySchema).optional(),
  withoutDirectories: z.looseObject({ templates: z.array(templateSchema).optional() }).optional(),
});
const sendMessageSchema = z.looseObject({ ids: z.array(z.string()).min(1) });
const channelSendSchema = z.looseObject({
  dialog: z.looseObject({ id: z.string().min(1), url: z.string().optional() }),
  messages: z.array(z.string()),
});
const createdDialogSchema = z.looseObject({
  id: z.string().min(1),
  url: z.string().optional(),
});
const groupViewSchema = z.looseObject({
  id: z.string().min(1),
  name: z.string().optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  operatorIds: z.array(z.string()).optional(),
  supervisorIds: z.array(z.string()).optional(),
  channels: z
    .array(
      z.looseObject({
        channelId: z.string(),
        canViewOtherDialogs: z.boolean().optional(),
      }),
    )
    .optional(),
});
const noteSchema = z.looseObject({
  id: z.string().optional(),
  text: z.string().optional(),
  created_at: z.string().optional(),
  createdAt: z.string().optional(),
  operator: z.looseObject({ name: z.string().optional() }).optional(),
});
const sessionSchema = idItemSchema.extend({
  operator: z.looseObject({ id: z.string().optional(), name: z.string().optional() }).optional(),
  status: z.number().optional(),
  statusName: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  appealCategory: z
    .looseObject({ id: z.string().optional(), name: z.string().optional() })
    .optional(),
  rate: z.number().optional(),
});

// Public API may add fields. Validate identifiers and consumed fields, then keep additions intact.
export const decodeIdList = (value: unknown): z.infer<typeof idItemSchema>[] =>
  z.array(idItemSchema).parse(value);
export const decodeIdPage = (value: unknown): z.infer<typeof idPageSchema> =>
  idPageSchema.parse(value);
export const decodeTagList = (value: unknown): z.infer<typeof tagSchema>[] =>
  z.array(tagSchema).parse(value);
export const decodeChannelPage = (value: unknown): { items: z.infer<typeof channelSchema>[] } =>
  z.looseObject({ items: z.array(channelSchema) }).parse(value);
export const decodeClientPage = (value: unknown) =>
  z
    .looseObject({
      items: z.array(clientSchema),
      totalItems: optionalNumber,
      totalPages: optionalNumber,
      currentPage: optionalNumber,
    })
    .parse(value);
export const decodeClientLookup = (
  value: unknown,
): z.infer<typeof clientSchema> | { items: z.infer<typeof clientSchema>[] } =>
  z.union([clientSchema, z.looseObject({ items: z.array(clientSchema) })]).parse(value);
export const decodeClientDetails = (value: unknown): z.infer<typeof clientSchema> =>
  clientSchema.parse(value);
export const decodeOperatorList = (value: unknown): z.infer<typeof operatorSchema>[] =>
  z.array(operatorSchema).parse(value);
export const decodeCategoryList = (value: unknown): z.infer<typeof categorySchema>[] =>
  z.array(categorySchema).parse(value);
export const decodeDialogPage = (
  value: unknown,
): { items: z.infer<typeof dialogSchema>[]; totalUnanswered?: number } =>
  z.looseObject({ items: z.array(dialogSchema), totalUnanswered: optionalNumber }).parse(value);
export const decodeDialogDetails = (value: unknown): z.infer<typeof dialogDetailsSchema> =>
  dialogDetailsSchema.parse(value);
export const decodeMessagePage = (value: unknown) =>
  z
    .looseObject({
      items: z.array(messageSchema),
      totalItems: optionalNumber,
      totalPages: optionalNumber,
      currentPage: optionalNumber,
    })
    .parse(value);
export const decodeTemplateList = (value: unknown): z.infer<typeof templateListSchema> =>
  templateListSchema.parse(value);
export const decodeTemplateDirectories = (value: unknown): z.infer<typeof idItemSchema>[] =>
  z
    .array(
      idItemSchema.extend({
        name: z.string(),
        description: z.string().optional(),
        projectId: z.string().optional(),
      }),
    )
    .parse(value);
export const decodeSendMessage = (value: unknown): z.infer<typeof sendMessageSchema> =>
  sendMessageSchema.parse(value);
export const decodeChannelSend = (value: unknown): z.infer<typeof channelSendSchema> =>
  channelSendSchema.parse(value);
export const decodeCreatedDialog = (value: unknown): z.infer<typeof createdDialogSchema> =>
  createdDialogSchema.parse(value);
export const decodeGroupView = (value: unknown): z.infer<typeof groupViewSchema> =>
  groupViewSchema.parse(value);
export const decodeCustomFields = (value: unknown): Record<string, unknown> => {
  if (Array.isArray(value) && value.length === 0) return {};
  return z.record(z.string(), z.unknown()).parse(value);
};
export const decodeClientNotes = (value: unknown): z.infer<typeof noteSchema>[] =>
  z.array(noteSchema).parse(value);
export const decodeClientDialog = (value: unknown): { id?: string } | null =>
  z.looseObject({ id: z.string().optional() }).nullable().parse(value);
export const decodeDialogSessions = (value: unknown): { items?: z.infer<typeof sessionSchema>[] } =>
  z.looseObject({ items: z.array(sessionSchema).optional() }).parse(value);
export const decodeSessionDetails = (value: unknown): Record<string, unknown> =>
  z.looseObject({ id: z.string().optional() }).parse(value);
export const decodeGroupClients = (value: unknown): z.infer<typeof idItemSchema>[] =>
  z.array(idItemSchema).parse(value);
export const decodeCreatedNote = (value: unknown): { id: string } => idItemSchema.parse(value);
export const decodeResendResult = (value: unknown): { result?: boolean } =>
  z.looseObject({ result: z.boolean().optional() }).parse(value);
export const decodeProjectDetails = (value: unknown): { name?: string; domain?: string } =>
  z.looseObject({ name: z.string().optional(), domain: z.string().optional() }).parse(value);
export const decodeProjectBalance = (
  value: unknown,
): {
  balance?: number;
  paidUntilDate?: string;
  promoDaysRemain?: number;
  promisedPayment?: number;
} =>
  z
    .looseObject({
      balance: z.number().optional(),
      paidUntilDate: z.string().optional(),
      promoDaysRemain: z.number().optional(),
      promisedPayment: z.number().optional(),
    })
    .parse(value);
export const decodeProjectTariff = (
  value: unknown,
): {
  active?: boolean;
  paid?: boolean;
  dailyPayment?: number;
  dailyPaymentByPrice?: number;
  promoDaysRemain?: number;
} =>
  z
    .looseObject({
      active: z.boolean().optional(),
      paid: z.boolean().optional(),
      dailyPayment: z.number().optional(),
      dailyPaymentByPrice: z.number().optional(),
      promoDaysRemain: z.number().optional(),
    })
    .parse(value);
export const decodeProjectApiStatus = (value: unknown): { webhookErrorsCount?: number } =>
  z.looseObject({ webhookErrorsCount: z.number().optional() }).parse(value);
