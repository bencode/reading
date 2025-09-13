import { NextRequest, NextResponse } from 'next/server'
import {
  toggleArticleReadStatus,
  toggleArticleStarred,
  toggleArticleSkipStatus,
  rateArticle,
  updateArticleNote,
  toggleArticleDeleted,
} from '../../../../services/articleService'
import { withAuth } from '../../../../lib/middleware'

const actionHandlers = {
  toggle_read: async (articleId: number) => ({
    is_read: await toggleArticleReadStatus(articleId),
  }),
  toggle_skip: async (articleId: number) => ({
    is_skipped: await toggleArticleSkipStatus(articleId),
  }),
  toggle_starred: async (articleId: number) => ({
    starred: await toggleArticleStarred(articleId),
  }),
  rate: async (articleId: number, rating: number) => {
    await rateArticle(articleId, rating)
    return { rating }
  },
  update_note: async (articleId: number, note: string | null) => {
    await updateArticleNote(articleId, note)
    return { note }
  },
  toggle_deleted: async (articleId: number) => ({
    deleted: await toggleArticleDeleted(articleId),
  }),
} as Record<string, ActionHandler>

type ActionHandler = (
  articleId: number,
  payload: unknown,
) => Promise<Record<string, unknown>>

export const PATCH = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await params
    const articleId = parseInt(id)

    if (isNaN(articleId)) {
      return NextResponse.json({ error: 'Invalid article ID' }, { status: 400 })
    }

    const body = await request.json()
    const { action, rating, note } = body

    const handler =
      actionHandlers[action as keyof typeof actionHandlers] ||
      actionHandlers.toggle_read
    const payload =
      action === 'rate' ? rating : action === 'update_note' ? note : undefined
    const result = await handler(articleId, payload)

    return NextResponse.json({ success: true, ...result })
  },
)
