// ============================================================
// Enums / Union types — valeurs IDENTIQUES à la base Supabase
// ============================================================

export type CandidateStatus =
  | 'invitation_envoyee'
  | 'brouillon'
  | 'a_valider'
  | 'validee'
  | 'archivee'

export type CandidateAvailability =
  | 'a_confirmer'
  | 'disponible'
  | 'en_rencontre'
  | 'en_pause'
  | 'fiancee'
  | 'mariee'

export type ProposalStatus =
  | 'envisagee'
  | 'accord_demande'
  | 'attente_retour'
  | 'acceptee'
  | 'rencontre_a_organiser'
  | 'rencontre_programmee'
  | 'rencontres_en_cours'
  | 'interrompue'
  | 'refusee'
  | 'aboutie'

export type MeetingStatus =
  | 'a_planifier'
  | 'planifiee'
  | 'confirmee'
  | 'effectuee'
  | 'annulee'
  | 'absent'

export type FeedbackSentiment = 'positif' | 'neutre' | 'negatif' | 'mitige'

export type TaskStatus = 'a_faire' | 'en_cours' | 'terminee' | 'annulee'

export type TaskPriority = 'basse' | 'normale' | 'haute' | 'urgente'

export type UserRole = 'admin' | 'chadkhanit' | 'assistante' | 'viewer'

export type InvitationStatus = 'en_attente' | 'acceptee' | 'expiree' | 'revoquee'

export type AuditAction =
  | 'creation'
  | 'modification'
  | 'suppression'
  | 'consultation'
  | 'export'
  | 'connexion'
  | 'deconnexion'
  | 'assignation'
  | 'desassignation'

export type SharedProfileAccess = 'lecture' | 'edition'

export type CandidateManStatus = 'actif' | 'en_pause' | 'archive'

// ============================================================
// Core database types
// ============================================================

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  auth_user_id: string
  organization_id: string
  email: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  role: UserRole
  is_active: boolean
  last_login_at: string | null
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Candidate {
  id: string
  organization_id: string
  created_by: string | null

  first_name: string
  last_name: string
  hebrew_name: string | null
  date_of_birth: string | null
  age_estimate: number | null
  is_age_estimate: boolean
  city: string | null
  country: string | null
  languages: string[] | null
  phone: string | null
  phone_country_code: string | null
  whatsapp: string | null
  email: string | null
  preferred_contact: string | null
  contact_availability: string | null

  marital_status: string | null
  has_children: boolean
  children_details: string | null
  siblings: string | null
  family_cities: string | null
  family_languages: string[] | null
  family_traditions: string | null
  family_role_in_project: string | null
  family_context: string | null

  courant: string | null
  hassidout: string | null
  nousah: string | null
  head_covering: string | null
  community: string | null
  synagogue: string | null
  rabbi_reference: string | null
  school_seminary: string | null
  traditions_minhaguim: string | null
  shabbat_practice: string | null
  kashrut_level: string | null
  prayer_study: string | null
  tsniout: string | null
  religious_home_project: string | null
  children_education: string | null

  studies: string | null
  profession: string | null
  work_schedule: string | null
  interests: string | null
  temperament: string | null
  social_life: string | null
  hobbies_travel: string | null
  smoking: string | null
  work_life_balance: string | null
  community_involvement: string | null
  couple_values: string | null
  home_vision: string | null
  personal_note: string | null

  age_min: number | null
  age_max: number | null
  preferred_cities: string | null
  mobility: string | null
  expected_languages: string[] | null
  accepted_marital_status: string[] | null
  religious_project: string | null
  torah_study_importance: string | null
  work_importance: string | null
  expected_values: string | null
  expected_qualities: string | null
  expected_lifestyle: string | null
  family_project: string | null
  ideal_husband: string | null
  incompatibilities: string | null
  physical_criteria: string | null

  status: CandidateStatus
  availability: CandidateAvailability
  exclusivity: string | null
  current_chadkhanit: string | null
  origin_chadkhanit_name: string | null
  origin_chadkhanit_contact: string | null
  origin_channel: string | null
  origin_date: string | null
  created_at: string
  updated_at: string
  last_activity_at: string | null
}

export interface CandidatePhoto {
  id: string
  candidate_id: string
  url: string
  is_primary: boolean
  caption: string | null
  order_index: number
  created_at: string
}

export interface CandidateMan {
  id: string
  organization_id: string
  created_by: string | null

  first_name: string
  last_name: string
  hebrew_name: string | null
  date_of_birth: string | null
  age_estimate: number | null
  is_age_estimate: boolean
  city: string | null
  country: string | null
  phone: string | null
  phone_country_code: string | null
  whatsapp: string | null
  email: string | null
  languages: string[] | null

  courant: string | null
  hassidout: string | null
  nousah: string | null
  kipa_type: string | null
  community: string | null
  synagogue: string | null
  rabbi_reference: string | null
  school_seminary: string | null
  shabbat_practice: string | null
  kashrut_level: string | null
  tsniout: string | null
  traditions_minhaguim: string | null
  torah_study: string | null
  prayer_study: string | null
  religious_home_project: string | null
  children_education: string | null

  marital_status: string | null
  has_children: boolean
  family_context: string | null

  profession: string | null
  studies: string | null
  interests: string | null
  temperament: string | null

  age_min: number | null
  age_max: number | null
  preferred_cities: string | null
  expected_qualities: string | null
  expected_values: string | null
  incompatibilities: string | null

  external_chadkhanit_name: string | null
  external_chadkhanit_contact: string | null
  origin_channel: string | null
  notes: string | null

  status: CandidateManStatus
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  organization_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  role: string | null
  relationship_to: string | null
  notes: string | null
  is_reference: boolean
  created_at: string
  updated_at: string
}

export interface Community {
  id: string
  organization_id: string
  name: string
  description: string | null
  city: string | null
  country: string | null
  rabbi_name: string | null
  members_count: number | null
  created_at: string
}

export interface ContactCommunity {
  id: string
  contact_id: string
  community_id: string
  role: string | null
  created_at: string
}

export interface CandidateReference {
  id: string
  candidate_id: string
  candidate_type: 'woman' | 'man'
  contact_id: string | null
  reference_name: string
  reference_phone: string | null
  reference_email: string | null
  relationship: string | null
  feedback: string | null
  rating: number | null
  contacted_at: string | null
  created_at: string
}

export interface Proposal {
  id: string
  organization_id: string
  created_by: string | null
  candidate_woman_id: string
  candidate_man_id: string
  status: ProposalStatus
  proposed_at: string | null
  woman_response: string | null
  woman_response_at: string | null
  man_response: string | null
  man_response_at: string | null
  woman_notes: string | null
  man_notes: string | null
  matchmaker_notes: string | null
  decline_reason: string | null
  priority: number
  next_action: string | null
  next_action_date: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

export interface Meeting {
  id: string
  proposal_id: string
  meeting_number: number
  scheduled_at: string | null
  location: string | null
  location_type: string | null
  status: MeetingStatus
  duration_minutes: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface MeetingFeedback {
  id: string
  meeting_id: string
  from_side: 'woman' | 'man'
  sentiment: FeedbackSentiment
  wants_next_meeting: boolean | null
  feedback_text: string | null
  private_notes: string | null
  collected_at: string | null
  collected_by: string | null
  created_at: string
}

export interface Task {
  id: string
  organization_id: string
  assigned_to: string | null
  created_by: string | null
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  related_proposal_id: string | null
  related_candidate_id: string | null
  related_candidate_type: 'woman' | 'man' | null
  completed_at: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

export interface Invitation {
  id: string
  organization_id: string
  invited_by: string
  email: string
  role: UserRole
  status: InvitationStatus
  token: string
  expires_at: string
  accepted_at: string | null
  created_at: string
}

export interface CandidateAssignment {
  id: string
  candidate_id: string
  candidate_type: 'woman' | 'man'
  user_id: string
  is_primary: boolean
  assigned_at: string
  assigned_by: string | null
}

export interface AuditLog {
  id: string
  organization_id: string
  user_id: string | null
  action: AuditAction
  entity_type: string
  entity_id: string | null
  details: Record<string, unknown>
  ip_address: string | null
  created_at: string
}

export interface SharedProfile {
  id: string
  candidate_id: string
  candidate_type: 'woman' | 'man'
  shared_by: string
  shared_with_email: string | null
  token: string
  access_level: SharedProfileAccess
  expires_at: string | null
  views_count: number
  last_viewed_at: string | null
  is_active: boolean
  created_at: string
}

// ============================================================
// Form / input types (for creating & editing)
// ============================================================

export type CandidateCreateInput = Omit<
  Candidate,
  | 'id'
  | 'organization_id'
  | 'created_by'
  | 'created_at'
  | 'updated_at'
  | 'gender'
> & {
  gender?: 'female'
}

export type CandidateUpdateInput = Partial<CandidateCreateInput>

export type CandidateManCreateInput = Omit<
  CandidateMan,
  | 'id'
  | 'organization_id'
  | 'created_by'
  | 'created_at'
  | 'updated_at'
  | 'gender'
> & {
  gender?: 'male'
}

export type CandidateManUpdateInput = Partial<CandidateManCreateInput>

export type ProposalCreateInput = Omit<
  Proposal,
  'id' | 'organization_id' | 'created_by' | 'created_at' | 'updated_at'
>

export type ProposalUpdateInput = Partial<ProposalCreateInput>

export type MeetingCreateInput = Omit<
  Meeting,
  'id' | 'created_at' | 'updated_at'
>

export type MeetingUpdateInput = Partial<MeetingCreateInput>

export type MeetingFeedbackCreateInput = Omit<
  MeetingFeedback,
  'id' | 'created_at'
>

export type ContactCreateInput = Omit<
  Contact,
  'id' | 'organization_id' | 'created_at' | 'updated_at'
>

export type ContactUpdateInput = Partial<ContactCreateInput>

export type TaskCreateInput = Omit<
  Task,
  'id' | 'organization_id' | 'created_by' | 'created_at' | 'updated_at'
>

export type TaskUpdateInput = Partial<TaskCreateInput>

export type InvitationCreateInput = {
  email: string
  role: UserRole
}

export type CandidateReferenceCreateInput = Omit<
  CandidateReference,
  'id' | 'created_at'
>

// ============================================================
// Joined / enriched types (for views)
// ============================================================

export interface ProposalWithCandidates extends Proposal {
  candidate_woman: Pick<
    Candidate,
    'id' | 'first_name' | 'last_name' | 'age_estimate' | 'city' | 'status'
  >
  candidate_man: Pick<
    CandidateMan,
    'id' | 'first_name' | 'last_name' | 'age_estimate' | 'city' | 'status'
  >
}

export interface MeetingWithFeedback extends Meeting {
  feedback: MeetingFeedback[]
}

export interface TaskWithAssignee extends Task {
  assignee: Pick<UserProfile, 'id' | 'full_name' | 'avatar_url'> | null
}

// ============================================================
// Utility / pagination
// ============================================================

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  per_page: number
  total_pages: number
}

export interface FilterOptions {
  search?: string
  status?: string
  availability?: string
  community?: string
  courant?: string
  city?: string
  age_min?: number
  age_max?: number
  has_children?: boolean
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  page?: number
  per_page?: number
}
