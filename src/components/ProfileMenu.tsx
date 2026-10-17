import { useEffect, useRef, useState, type FormEvent } from 'react'
import { AVATARS, addProfile, renameProfile, switchProfile, useAppState, useProfile } from '../lib/store'

type Editing = null | { kind: 'add' | 'edit'; name: string; emoji: string }

export function ProfileMenu() {
  const { profiles } = useAppState()
  const me = useProfile()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Editing>(null)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (!open) setEditing(null)
  }, [open])

  const save = (e: FormEvent) => {
    e.preventDefault()
    if (!editing) return
    if (editing.kind === 'add') addProfile(editing.name, editing.emoji)
    else renameProfile(editing.name, editing.emoji)
    setEditing(null)
    setOpen(false)
  }

  return (
    <div className="profile" ref={root}>
      <button className="pill-btn profile-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="avatar">{me.emoji}</span>
        <span className="profile-name">{me.name}</span>
        <svg className="caret" viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
          <path d="M2 4l4 4 4-4" fill="currentColor" />
        </svg>
      </button>

      {open && (
        <div className="profile-menu" role="menu">
          <div className="profile-points">
            <span className="points-num">{me.points.toLocaleString()}</span>
            <span className="points-label">points</span>
          </div>

          {editing ? (
            <form className="profile-form" onSubmit={save}>
              <label className="form-label" htmlFor="profile-name">
                {editing.kind === 'add' ? 'New player' : 'Edit player'}
              </label>
              <input
                id="profile-name"
                className="text-input"
                autoFocus
                maxLength={20}
                placeholder="Name"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
              <div className="emoji-grid">
                {AVATARS.map((a) => (
                  <button
                    type="button"
                    key={a}
                    className={a === editing.emoji ? 'emoji-opt is-on' : 'emoji-opt'}
                    onClick={() => setEditing({ ...editing, emoji: a })}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <div className="form-row">
                <button type="button" className="link-btn" onClick={() => setEditing(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Save
                </button>
              </div>
            </form>
          ) : (
            <>
              <ul className="profile-list">
                {profiles.map((p) => (
                  <li key={p.id}>
                    <button
                      className={p.id === me.id ? 'profile-opt is-on' : 'profile-opt'}
                      onClick={() => {
                        switchProfile(p.id)
                        setOpen(false)
                      }}
                    >
                      <span className="avatar avatar-sm">{p.emoji}</span>
                      <span className="profile-opt-name">{p.name}</span>
                      <span className="profile-opt-pts">{p.points}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="menu-actions">
                <button className="link-btn" onClick={() => setEditing({ kind: 'edit', name: me.name, emoji: me.emoji })}>
                  Edit {me.name}
                </button>
                <button
                  className="link-btn"
                  onClick={() => setEditing({ kind: 'add', name: '', emoji: AVATARS[profiles.length % AVATARS.length] })}
                >
                  + Add player
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
