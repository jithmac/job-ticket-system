export type Priority = "low" | "medium" | "high" | "critical";

export type TicketStatus = "draft" | "open" | "in_progress" | "on_hold" | "awaiting_signoff" | "completed";

export type SubtaskStatus = "pending" | "in_progress" | "done";

export type EmployeeStatus = "on_site" | "in_transit" | "available" | "remote" | "off_duty";

export type Category =
  | "Mechanical / Calibration"
  | "Electrical / Power"
  | "Controls & SCADA"
  | "Hydraulics & Pneumatics"
  | "HVAC"
  | "Safety & Compliance";

export interface Employee {
  id: string;
  name: string;
  initials: string;
  title: string;
  department: string;
  skillLevel: string;
  email: string;
  phone: string;
  status: EmployeeStatus;
  location: string;
  joinedOn: string;
  avatarUrl?: string;
}

export interface Client {
  id: string;
  name: string;
  facility: string;
  address: string;
  contractRef: string;
  tier: string;
  contactName: string;
  contactRole: string;
  contactEmail: string;
  contactPhone: string;
  accessLevel: string;
  safetyProtocol: string;
}

export interface Subtask {
  id: string;
  title: string;
  description: string;
  assigneeIds: string[];
  estimate: string;
  status: SubtaskStatus;
  /** 0-100, only meaningful while in progress */
  progress: number;
  completedAt?: string;
  dueDate?: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
  kind: "image" | "pdf" | "log" | "doc" | "sheet";
  label: string;
}

export type ActivityKind = "system" | "employee" | "customer-care" | "admin";

export interface ActivityEntry {
  id: string;
  kind: ActivityKind;
  authorId?: string;
  authorName: string;
  authorRole: string;
  at: string;
  text: string;
  /** Customer care notes can be shared with the field crew */
  visibleToEmployees: boolean;
}

export interface PriorityRequest {
  id: string;
  from: Priority;
  to: Priority;
  reason: string;
  requestedBy: string;
  at: string;
  status: "pending" | "approved" | "declined";
}

export interface BillLine {
  description: string;
  qty: number;
  unit: string;
  rate: number;
}

export interface Billing {
  invoiceId: string;
  issuedOn: string;
  dueDate: string;
  taxRate: number;
  lines: BillLine[];
}

export interface Ticket {
  id: string;
  jobId: string;
  title: string;
  assetTag: string;
  clientId: string;
  /** Employee who created the ticket */
  createdById: string;
  /** Employee currently holding the ticket (can be passed along) */
  ownerId: string;
  /** Other employees participating in the job */
  participantIds: string[];
  startDate: string;
  endDate: string;
  description: string;
  priority: Priority;
  category: Category;
  status: TicketStatus;
  subtasks: Subtask[];
  attachments: Attachment[];
  activity: ActivityEntry[];
  priorityRequests: PriorityRequest[];
  billing?: Billing;
  updatedAt: string;
}
