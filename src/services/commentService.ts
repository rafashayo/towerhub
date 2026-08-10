import type { Comment } from '../types'
import { db } from './db'
import { ApiError, request } from './http'
import { uid } from '../lib/utils'

export const commentService = {
  listForMod(modId: string): Promise<Comment[]> {
    return request(() => {
      return db.comments
        .all()
        .filter((c) => c.modId === modId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }, 150)
  },

  add(input: {
    modId: string
    userId: string
    userName: string
    userAvatar: string
    text: string
    parentId?: string | null
  }): Promise<Comment> {
    return request(() => {
      if (!input.text.trim()) throw new ApiError('The comment cannot be empty.')
      if (input.text.length > 1000) throw new ApiError('The comment is too long.')

      const comment: Comment = {
        id: uid('c'),
        modId: input.modId,
        userId: input.userId,
        userName: input.userName,
        userAvatar: input.userAvatar,
        text: input.text.trim(),
        parentId: input.parentId ?? null,
        createdAt: new Date().toISOString(),
        reported: false,
      }
      db.comments.save([...db.comments.all(), comment])
      return comment
    }, 200)
  },

  report(commentId: string): Promise<void> {
    return commentService.setReported(commentId, true)
  },

  setReported(commentId: string, reported: boolean): Promise<void> {
    return request(() => {
      const comments = db.comments.all()
      const idx = comments.findIndex((c) => c.id === commentId)
      if (idx === -1) throw new ApiError('Comment not found.', 404)
      comments[idx] = { ...comments[idx], reported }
      db.comments.save(comments)
    }, 120)
  },

  remove(commentId: string): Promise<void> {
    return request(() => {
      db.comments.save(db.comments.all().filter((c) => c.id !== commentId && c.parentId !== commentId))
    })
  },

  listReported(): Promise<Comment[]> {
    return request(() => db.comments.all().filter((c) => c.reported))
  },
}
