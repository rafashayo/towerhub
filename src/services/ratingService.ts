import type { Rating } from '../types'
import { db } from './db'
import { request } from './http'
import { uid } from '../lib/utils'

export const ratingService = {
  getUserRating(modId: string, userId: string): Promise<Rating | null> {
    return request(() => db.ratings.all().find((r) => r.modId === modId && r.userId === userId) ?? null, 80)
  },

  rate(modId: string, userId: string, stars: 1 | 2 | 3 | 4 | 5): Promise<Rating> {
    return request(() => {
      const ratings = db.ratings.all()
      const idx = ratings.findIndex((r) => r.modId === modId && r.userId === userId)
      if (idx !== -1) {
        ratings[idx] = { ...ratings[idx], stars, createdAt: new Date().toISOString() }
        db.ratings.save(ratings)
        return ratings[idx]
      }
      const rating: Rating = { id: uid('r'), modId, userId, stars, createdAt: new Date().toISOString() }
      db.ratings.save([...ratings, rating])
      return rating
    }, 150)
  },
}
