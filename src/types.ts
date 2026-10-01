// The Public API returns different field subsets; model only fields consumed here.

export interface ApiDate {
  date: string;
  timezone?: string;
}

export interface Tag {
  id: string;
  tag: string;
  color?: string;
  description?: string;
}

export interface ChannelItem {
  id: string;
  name?: string;
  channelType?: string;
  type?: string;
  /** The channel list exposes activity through this field, not `status`. */
  active?: boolean;
  status?: number | string;
  isActive?: boolean;
}

export interface CategoryItem {
  id: string;
  name?: string;
  title?: string;
}

export interface OperatorItem {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  last_name?: string;
  status?: number;
}

export interface ClientItem {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  url?: string;
  tags?: ({ id?: string; tag?: string; name?: string } | string)[];
}

export interface DialogItem {
  id: string;
  /** Preferred `appealId` value for admin-panel links. */
  lastSessionId?: string;
  /** Legacy public appeal ID used when `lastSessionId` is absent. */
  appealExternalId?: string | number;
  clientId?: string;
  channelId?: string;
  channel?: ChannelItem;
  status?: number | string;
  lastMessage?: { text?: string; createdAt?: string | ApiDate };
  lastMessageText?: string;
  updatedAt?: string | ApiDate;
  lastMessageAt?: string | ApiDate;
  assignedOperatorId?: string;
  client?: ClientItem;
  clientName?: string;
  isUnanswered?: boolean;
  unanswered?: boolean;
  categoryId?: string;
  lastCategoryId?: string;
  category?: { id?: string };
  operator?: { id?: string; name?: string };
}

export interface MessageItem {
  id: string;
  dialogId?: string;
  sessionId?: string;
  /** Message position used by admin-panel deep links. */
  position?: number;
  text?: string;
  type?: number;
  status?: number;
  clientId?: string;
  operatorId?: string;
  operator?: { id?: string; name?: string };
  client?: { id?: string; name?: string };
  isItClient?: boolean;
  createdAt?: string | ApiDate;
  created_at?: string;
  attachments?: {
    type?: string;
    kind?: string;
    url?: string;
    path?: string;
    name?: string;
    filename?: string;
    size?: number;
  }[];
  replied_message_id?: string;
  repliedMessageId?: string;
  repliedMessage?: { id?: string } | null;
}

export interface ChannelListResponse {
  items: ChannelItem[];
}

export interface ClientListResponse {
  items: ClientItem[];
  totalItems?: number;
  totalPages?: number;
  currentPage?: number;
}

export interface DialogListResponse {
  items: DialogItem[];
  totalUnanswered?: number;
}

export interface MessageListResponse {
  items: MessageItem[];
  totalItems?: number;
  totalPages?: number;
  currentPage?: number;
}

type ToolContent = { type: "text"; text: string; [x: string]: unknown }[];

export interface ToolResult {
  content: ToolContent;
  isError?: boolean;
  // The SDK's passthrough CallToolResult type requires an index signature.
  [x: string]: unknown;
}
