import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CornerDownRight, Flag, Send } from 'lucide-react'
import type { Comment } from '../types'
import type { SafeUser } from '../services/authService'
import { timeAgo } from '../lib/utils'
import { useToast } from '../context/ToastContext'

interface CommentThreadProps {
  comments: Comment[]
  currentUser: SafeUser | null
  onAdd: (text: string, parentId: string | null) => Promise<void>
  onReport: (commentId: string) => Promise<void>
}

function CommentRow({
  comment,
  currentUser,
  onReply,
  onReport,
  isReply = false,
}: {
  comment: Comment
  currentUser: SafeUser | null
  onReply: (text: string) => Promise<void>
  onReport: () => Promise<void>
  isReply?: boolean
}) {
  const [replying, setReplying] = useState(false)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { push } = useToast()

  async function submitReply(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)
    try {
      await onReply(text)
      setText('')
      setReplying(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={isReply ? 'ml-10 border-l border-ink-700 pl-4' : ''}>
      <div className="flex gap-3 py-4">
        <img src={comment.userAvatar} alt="" className="h-8 w-8 shrink-0 rounded-sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <Link to={`/users/${comment.userName}`} className="text-sm font-semibold text-mist-100 hover:text-signal-400">
              {comment.userName}
            </Link>
            <span className="font-mono text-xs text-mist-400">{timeAgo(comment.createdAt)}</span>
            {comment.reported && <span className="badge border-amber-600/40 text-amber-400">Reported</span>}
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-mist-200">{comment.text}</p>

          <div className="mt-1.5 flex items-center gap-4">
            {currentUser && !isReply && (
              <button
                onClick={() => setReplying((v) => !v)}
                className="flex items-center gap-1 text-xs text-mist-400 hover:text-signal-400"
              >
                <CornerDownRight size={12} /> Reply
              </button>
            )}
            {currentUser && (
              <button
                onClick={async () => {
                  await onReport()
                  push('Comment reported. A moderator will review it.', 'info')
                }}
                className="flex items-center gap-1 text-xs text-mist-400 hover:text-amber-400"
              >
                <Flag size={12} /> Report
              </button>
            )}
          </div>

          {replying && (
            <form onSubmit={submitReply} className="mt-3 flex gap-2">
              <input
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`Reply to ${comment.userName}…`}
                className="input !py-2"
              />
              <button type="submit" disabled={submitting} className="btn-primary !px-3">
                <Send size={14} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export function CommentThread({ comments, currentUser, onAdd, onReport }: CommentThreadProps) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const topLevel = comments.filter((c) => !c.parentId)
  const repliesFor = (id: string) => comments.filter((c) => c.parentId === id)

  async function submitTop(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)
    try {
      await onAdd(text, null)
      setText('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {currentUser ? (
        <form onSubmit={submitTop} className="mb-2 flex flex-col gap-2 sm:flex-row">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment…"
            rows={2}
            className="textarea !min-h-0 flex-1"
          />
          <button type="submit" disabled={submitting} className="btn-primary self-end sm:self-stretch">
            <Send size={15} /> Comment
          </button>
        </form>
      ) : (
        <div className="card mb-2 flex items-center justify-between gap-3 px-4 py-3 text-sm text-mist-300">
          <span>
            <Link to="/login" className="text-signal-400 hover:underline">
              Sign in
            </Link>{' '}
            to comment and rate this mod.
          </span>
        </div>
      )}

      <div className="divide-y divide-ink-700">
        {topLevel.length === 0 && <p className="py-8 text-center text-sm text-mist-400">No comments yet. Be the first!</p>}
        {topLevel.map((c) => (
          <div key={c.id}>
            <CommentRow
              comment={c}
              currentUser={currentUser}
              onReply={(t) => onAdd(t, c.id)}
              onReport={() => onReport(c.id)}
            />
            {repliesFor(c.id).map((r) => (
              <CommentRow key={r.id} comment={r} currentUser={currentUser} onReply={async () => {}} onReport={() => onReport(r.id)} isReply />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
