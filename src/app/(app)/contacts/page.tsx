'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Plus,
  X,
  Phone,
  Mail,
  Star,
  User,
  Users,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Trash2,
  Pencil,
  BookUser,
} from 'lucide-react'
import type { Contact, ContactCreateInput } from '@/lib/types'
import {
  getContacts as fetchContactsAction,
  createContact as createContactAction,
  updateContact as updateContactAction,
  deleteContact as deleteContactAction,
  getContactRelatedCandidates,
} from '@/lib/contacts/actions'
import type { RelatedCandidate } from '@/lib/contacts/actions'
import { cn, formatDate } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import SearchInput from '@/components/ui/SearchInput'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'

const roleOptions = [
  { value: '', label: 'Tous les roles' },
  { value: 'rabbin', label: 'Rabbin' },
  { value: 'responsable_communautaire', label: 'Responsable communautaire' },
  { value: 'enseignant', label: 'Enseignant' },
  { value: 'ami', label: 'Ami' },
  { value: 'proche', label: 'Proche' },
  { value: 'autre', label: 'Autre' },
]

const roleFormOptions = roleOptions.filter((o) => o.value !== '')

function getRoleLabel(role: string | null): string {
  const labels: Record<string, string> = {
    rabbin: 'Rabbin',
    responsable_communautaire: 'Resp. communautaire',
    enseignant: 'Enseignant',
    ami: 'Ami',
    proche: 'Proche',
    autre: 'Autre',
  }
  return role ? labels[role] || role : 'Non defini'
}

function getRoleBadgeClass(role: string | null): string {
  switch (role) {
    case 'rabbin':
      return 'bg-plum-light text-plum border-plum/20'
    case 'responsable_communautaire':
      return 'bg-plum-light text-plum border-plum/20'
    case 'enseignant':
      return 'bg-sage/15 text-sage-deep border-sage/30'
    case 'ami':
    case 'proche':
      return 'bg-gold-light text-gold-deep border-gold/30'
    default:
      return 'bg-stone-100 text-stone-600 border-stone-200'
  }
}

export default function ContactsPage() {

  // Data
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Detail panel
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [relatedCandidates, setRelatedCandidates] = useState<RelatedCandidate[]>([])
  const [loadingRelated, setLoadingRelated] = useState(false)

  // Edit mode
  const [editingContact, setEditingContact] = useState<Contact | null>(null)

  // Form state
  const [form, setForm] = useState<ContactCreateInput>({
    first_name: '',
    last_name: '',
    email: null,
    phone: null,
    role: null,
    relationship_to: null,
    notes: null,
    is_reference: false,
  })

  // Duplicate detection
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)

  // ----------------------------------------------------------------
  // Fetch contacts
  // ----------------------------------------------------------------
  const fetchContacts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchContactsAction()
      setContacts(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement des contacts'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  // ----------------------------------------------------------------
  // Client-side filtering
  // ----------------------------------------------------------------
  const filteredContacts = useMemo(() => {
    let result = contacts

    if (roleFilter) {
      result = result.filter((c) => c.role === roleFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim()
      result = result.filter(
        (c) =>
          c.first_name.toLowerCase().includes(q) ||
          c.last_name.toLowerCase().includes(q) ||
          (c.phone && c.phone.toLowerCase().includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q))
      )
    }

    return result
  }, [contacts, search, roleFilter])

  // ----------------------------------------------------------------
  // Duplicate detection
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!showModal) return
    const firstName = form.first_name.trim().toLowerCase()
    const lastName = form.last_name.trim().toLowerCase()
    const phone = (form.phone ?? '').replace(/\s/g, '')

    if (!firstName && !lastName && !phone) {
      setDuplicateWarning(null)
      return
    }

    const matches = contacts.filter((c) => {
      // Skip self when editing
      if (editingContact && c.id === editingContact.id) return false

      const nameMatch =
        firstName &&
        lastName &&
        c.first_name.toLowerCase() === firstName &&
        c.last_name.toLowerCase() === lastName

      const phoneMatch =
        phone.length >= 6 &&
        c.phone &&
        c.phone.replace(/\s/g, '').includes(phone)

      return nameMatch || phoneMatch
    })

    if (matches.length > 0) {
      const names = matches.map((m) => `${m.first_name} ${m.last_name}`).join(', ')
      setDuplicateWarning(`Doublon potentiel detecte : ${names}`)
    } else {
      setDuplicateWarning(null)
    }
  }, [form.first_name, form.last_name, form.phone, contacts, showModal, editingContact])

  // ----------------------------------------------------------------
  // Fetch related candidates for detail view
  // ----------------------------------------------------------------
  const fetchRelatedCandidates = useCallback(
    async (contactId: string) => {
      setLoadingRelated(true)
      try {
        const results = await getContactRelatedCandidates(contactId)
        setRelatedCandidates(results)
      } catch {
        setRelatedCandidates([])
      } finally {
        setLoadingRelated(false)
      }
    },
    []
  )

  // ----------------------------------------------------------------
  // Expand / collapse contact detail
  // ----------------------------------------------------------------
  function handleToggleExpand(contactId: string) {
    if (expandedId === contactId) {
      setExpandedId(null)
      setRelatedCandidates([])
    } else {
      setExpandedId(contactId)
      fetchRelatedCandidates(contactId)
    }
  }

  // ----------------------------------------------------------------
  // Open modal for new contact
  // ----------------------------------------------------------------
  function handleOpenNewModal() {
    setEditingContact(null)
    setForm({
      first_name: '',
      last_name: '',
      email: null,
      phone: null,
      role: null,
      relationship_to: null,
      notes: null,
      is_reference: false,
    })
    setFormError(null)
    setDuplicateWarning(null)
    setShowModal(true)
  }

  // ----------------------------------------------------------------
  // Open modal for editing
  // ----------------------------------------------------------------
  function handleOpenEditModal(contact: Contact) {
    setEditingContact(contact)
    setForm({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone,
      role: contact.role,
      relationship_to: contact.relationship_to,
      notes: contact.notes,
      is_reference: contact.is_reference,
    })
    setFormError(null)
    setDuplicateWarning(null)
    setShowModal(true)
  }

  // ----------------------------------------------------------------
  // Submit form (create or update)
  // ----------------------------------------------------------------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setFormError('Le prenom et le nom sont obligatoires.')
      return
    }

    setSubmitting(true)
    setFormError(null)

    try {
      if (editingContact) {
        // Update existing
        const result = await updateContactAction(editingContact.id, {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email?.trim() || null,
          phone: form.phone?.trim() || null,
          role: form.role || null,
          relationship_to: form.relationship_to?.trim() || null,
          notes: form.notes?.trim() || null,
          is_reference: form.is_reference,
        })

        if (!result.success) throw new Error(result.error)
      } else {
        // Create new
        const result = await createContactAction({
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email?.trim() || null,
          phone: form.phone?.trim() || null,
          role: form.role || null,
          relationship_to: form.relationship_to?.trim() || null,
          notes: form.notes?.trim() || null,
          is_reference: form.is_reference,
        })

        if (!result.success) throw new Error(result.error)
      }

      setShowModal(false)
      setEditingContact(null)
      await fetchContacts()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement'
      setFormError(message)
    } finally {
      setSubmitting(false)
    }
  }

  // ----------------------------------------------------------------
  // Delete contact
  // ----------------------------------------------------------------
  async function handleDelete(contactId: string) {
    if (!confirm('Supprimer ce contact ? Cette action est irreversible.')) return

    try {
      const result = await deleteContactAction(contactId)

      if (!result.success) throw new Error(result.error)

      if (expandedId === contactId) {
        setExpandedId(null)
        setRelatedCandidates([])
      }
      await fetchContacts()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression'
      alert(message)
    }
  }

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner text="Chargement des contacts..." size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 px-4">
        <div className="flex items-center gap-2 text-danger">
          <AlertTriangle className="h-6 w-6" />
          <p className="text-lg font-medium">Erreur</p>
        </div>
        <p className="text-sm text-ink-soft text-center max-w-md">{error}</p>
        <Button variant="secondary" onClick={fetchContacts}>
          Reessayer
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold text-ink">Contacts</h1>
          <p className="text-sm text-ink-soft mt-1">
            {contacts.length} contact{contacts.length !== 1 ? 's' : ''} au total
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={handleOpenNewModal}
        >
          Nouveau contact
        </Button>
      </div>

      {/* ---- Search & Filters ---- */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher par nom, telephone, email..."
          className="flex-1"
        />
        <div className="w-full sm:w-56">
          <Select
            options={roleOptions}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            placeholder="Filtrer par role"
          />
        </div>
      </div>

      {/* ---- Results info ---- */}
      {(search || roleFilter) && (
        <p className="text-sm text-ink-soft">
          {filteredContacts.length} resultat{filteredContacts.length !== 1 ? 's' : ''}
          {search && ` pour "${search}"`}
          {roleFilter && ` (${getRoleLabel(roleFilter)})`}
        </p>
      )}

      {/* ---- Empty state ---- */}
      {filteredContacts.length === 0 ? (
        <EmptyState
          icon={<BookUser className="h-8 w-8" />}
          title={contacts.length === 0 ? 'Aucun contact' : 'Aucun resultat'}
          description={
            contacts.length === 0
              ? 'Ajoutez votre premier contact pour commencer.'
              : 'Modifiez vos criteres de recherche ou de filtre.'
          }
          actionLabel={contacts.length === 0 ? 'Ajouter un contact' : undefined}
          onAction={contacts.length === 0 ? handleOpenNewModal : undefined}
        />
      ) : (
        /* ---- Contact cards grid ---- */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => {
            const isExpanded = expandedId === contact.id
            return (
              <div
                key={contact.id}
                className={cn(
                  'bg-surface rounded-[14px] border border-line overflow-hidden transition-shadow duration-200',
                  isExpanded && 'ring-2 ring-sage/40 shadow-card-hover md:col-span-2 xl:col-span-3'
                )}
              >
                {/* Card header - clickable */}
                <button
                  type="button"
                  className="w-full text-left p-4 hover:bg-canvas/60 transition-colors"
                  onClick={() => handleToggleExpand(contact.id)}
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar circle */}
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-sage/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-sage" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-ink truncate">
                            {contact.first_name} {contact.last_name}
                          </h3>
                          {contact.is_reference && (
                            <Star className="h-4 w-4 text-gold fill-gold flex-shrink-0" />
                          )}
                        </div>
                        <Badge variant="default" className={getRoleBadgeClass(contact.role)}>
                          {getRoleLabel(contact.role)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-ink-soft">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                  </div>

                  {/* Quick info */}
                  <div className="mt-3 flex flex-col gap-1 text-sm text-ink-soft">
                    {contact.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{contact.phone}</span>
                      </span>
                    )}
                    {contact.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{contact.email}</span>
                      </span>
                    )}
                  </div>

                  {/* Notes preview */}
                  {contact.notes && !isExpanded && (
                    <p className="mt-2 text-xs text-ink-soft line-clamp-2">
                      {contact.notes}
                    </p>
                  )}
                </button>

                {/* ---- Expanded detail panel ---- */}
                {isExpanded && (
                  <div className="border-t border-line p-4 space-y-5 bg-canvas/30">
                    {/* Full contact info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-ink">Nom complet</span>
                        <p className="text-ink-soft">
                          {contact.first_name} {contact.last_name}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-ink">Role</span>
                        <p className="text-ink-soft">{getRoleLabel(contact.role)}</p>
                      </div>
                      {contact.phone && (
                        <div>
                          <span className="font-medium text-ink">Telephone</span>
                          <p>
                            <a
                              href={`tel:${contact.phone}`}
                              className="text-sage hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {contact.phone}
                            </a>
                          </p>
                        </div>
                      )}
                      {contact.email && (
                        <div>
                          <span className="font-medium text-ink">Email</span>
                          <p>
                            <a
                              href={`mailto:${contact.email}`}
                              className="text-sage hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {contact.email}
                            </a>
                          </p>
                        </div>
                      )}
                      {contact.relationship_to && (
                        <div>
                          <span className="font-medium text-ink">Lien avec un(e) candidat(e)</span>
                          <p className="text-ink-soft">{contact.relationship_to}</p>
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-ink">Reference</span>
                        <p className="text-ink-soft">
                          {contact.is_reference ? 'Oui' : 'Non'}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-ink">Cree le</span>
                        <p className="text-ink-soft">{formatDate(contact.created_at)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-ink">Mis a jour le</span>
                        <p className="text-ink-soft">{formatDate(contact.updated_at)}</p>
                      </div>
                    </div>

                    {/* Notes */}
                    {contact.notes && (
                      <div>
                        <span className="text-sm font-medium text-ink">Notes</span>
                        <p className="mt-1 text-sm text-ink-soft whitespace-pre-wrap">
                          {contact.notes}
                        </p>
                      </div>
                    )}

                    {/* Related candidates */}
                    <div>
                      <h4 className="text-sm font-medium text-ink flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-plum" />
                        Candidat(e)s lie(e)s
                      </h4>
                      {loadingRelated ? (
                        <LoadingSpinner size="sm" text="Chargement..." />
                      ) : relatedCandidates.length === 0 ? (
                        <p className="text-sm text-ink-soft italic">
                          Aucun(e) candidat(e) lie(e) a ce contact.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {relatedCandidates.map((rc) => (
                            <div
                              key={rc.id}
                              className="flex items-center gap-3 rounded-lg bg-surface border border-line px-3 py-2 text-sm"
                            >
                              <div
                                className={cn(
                                  'h-2 w-2 rounded-full flex-shrink-0',
                                  rc.candidate_type === 'woman'
                                    ? 'bg-plum'
                                    : 'bg-sage'
                                )}
                              />
                              <div className="min-w-0 flex-1">
                                <span className="font-medium text-ink">
                                  {rc.candidate_first_name ?? ''}{' '}
                                  {rc.candidate_last_name ?? ''}
                                </span>
                                {rc.relationship && (
                                  <span className="text-ink-soft ml-1">
                                    ({rc.relationship})
                                  </span>
                                )}
                              </div>
                              <Badge
                                variant="default"
                                className={
                                  rc.candidate_type === 'woman'
                                    ? 'bg-plum/10 text-plum border-plum/20'
                                    : 'bg-sage/15 text-sage-deep border-sage/30'
                                }
                              >
                                {rc.candidate_type === 'woman' ? 'Femme' : 'Homme'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2 border-t border-line">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Pencil className="h-3.5 w-3.5" />}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenEditModal(contact)
                        }}
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(contact.id)
                        }}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ==================================================================
          MODAL — Nouveau / Modifier contact
          ================================================================== */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={editingContact ? 'Modifier le contact' : 'Nouveau contact'}
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              if (!submitting) {
                setShowModal(false)
                setEditingContact(null)
              }
            }}
          />

          {/* Modal card */}
          <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-surface rounded-2xl shadow-xl border border-line">
            {/* Modal header */}
            <div className="sticky top-0 bg-surface border-b border-line px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h2 className="font-display text-[22px] font-semibold text-ink">
                {editingContact ? 'Modifier le contact' : 'Nouveau contact'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  if (!submitting) {
                    setShowModal(false)
                    setEditingContact(null)
                  }
                }}
                className="rounded-lg p-1.5 text-ink-soft hover:bg-stone-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sage"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Duplicate warning */}
              {duplicateWarning && (
                <div className="flex items-start gap-2 rounded-lg bg-gold-light border border-gold/30 px-3 py-2.5 text-sm text-gold-deep">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{duplicateWarning}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Prenom *"
                  inputType="text"
                  value={form.first_name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, first_name: (e.target as HTMLInputElement).value }))
                  }
                  placeholder="Prenom"
                  required
                />
                <Input
                  label="Nom *"
                  inputType="text"
                  value={form.last_name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, last_name: (e.target as HTMLInputElement).value }))
                  }
                  placeholder="Nom"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email"
                  inputType="email"
                  value={form.email ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: (e.target as HTMLInputElement).value || null }))
                  }
                  placeholder="email@exemple.com"
                />
                <Input
                  label="Telephone"
                  inputType="tel"
                  value={form.phone ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, phone: (e.target as HTMLInputElement).value || null }))
                  }
                  placeholder="+33 6 00 00 00 00"
                />
              </div>

              <Select
                label="Role"
                options={roleFormOptions}
                value={form.role ?? ''}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, role: e.target.value || null }))
                }
                placeholder="Choisir un role"
              />

              <Input
                label="Lien avec un(e) candidat(e)"
                inputType="text"
                value={form.relationship_to ?? ''}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    relationship_to: (e.target as HTMLInputElement).value || null,
                  }))
                }
                placeholder="Ex: pere de Sarah Cohen"
                helperText="Decrivez le lien entre ce contact et un(e) candidat(e)"
              />

              {/* is_reference checkbox */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={form.is_reference}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, is_reference: e.target.checked }))
                    }
                    className="peer sr-only"
                  />
                  <div className="h-5 w-5 rounded border border-line bg-surface transition-colors peer-checked:bg-sage peer-checked:border-sage peer-focus-visible:ring-2 peer-focus-visible:ring-sage peer-focus-visible:ring-offset-2 flex items-center justify-center">
                    <svg
                      className="h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {/* Visible check when checked */}
                  {form.is_reference && (
                    <svg
                      className="absolute inset-0 h-5 w-5 text-white pointer-events-none flex items-center justify-center p-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div>
                  <span className="text-sm font-medium text-ink group-hover:text-sage transition-colors">
                    Personne de reference
                  </span>
                  <p className="text-xs text-ink-soft">
                    Ce contact peut etre cite comme reference pour des candidat(e)s
                  </p>
                </div>
              </label>

              <Input
                label="Notes"
                inputType="textarea"
                value={form.notes ?? ''}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    notes: (e.target as HTMLTextAreaElement).value || null,
                  }))
                }
                placeholder="Remarques, informations complementaires..."
              />

              {/* Form error */}
              {formError && (
                <div className="flex items-center gap-2 text-sm text-danger">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Modal footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowModal(false)
                    setEditingContact(null)
                  }}
                  disabled={submitting}
                >
                  Annuler
                </Button>
                <Button type="submit" variant="primary" loading={submitting}>
                  {editingContact ? 'Enregistrer' : 'Creer le contact'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
