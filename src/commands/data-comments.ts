import type { OAuth2Client } from 'google-auth-library';
import { listCommentThreads, listAllCommentThreads } from '../data-api.js';
import { output } from '../utils/formatter.js';

interface ActionOptions {
  format: string;
  videoId: string;
  max: number;
  all: boolean;
  order: 'time' | 'relevance';
}

interface RawComment {
  snippet?: {
    authorDisplayName?: string;
    authorProfileImageUrl?: string;
    textDisplay?: string;
    likeCount?: number;
    publishedAt?: string;
    updatedAt?: string;
  };
}

interface RawThread {
  id?: string;
  snippet?: {
    topLevelComment?: RawComment;
    totalReplyCount?: number;
  };
  replies?: {
    comments?: RawComment[];
  };
}

function mapComment(raw: RawComment) {
  const s = raw.snippet;
  return {
    author: s?.authorDisplayName ?? '',
    authorProfileImage: s?.authorProfileImageUrl ?? '',
    text: s?.textDisplay ?? '',
    likeCount: s?.likeCount ?? 0,
    publishedAt: s?.publishedAt ?? '',
  };
}

function mapThread(raw: RawThread) {
  const topComment = raw.snippet?.topLevelComment;
  const mapped = {
    id: raw.id ?? '',
    ...mapComment(topComment ?? {}),
    updatedAt: topComment?.snippet?.updatedAt ?? '',
    replyCount: raw.snippet?.totalReplyCount ?? 0,
    replies: (raw.replies?.comments ?? []).map(mapComment),
  };
  return mapped;
}

export async function dataCommentsAction(
  auth: OAuth2Client,
  options: ActionOptions,
): Promise<void> {
  const result = options.all
    ? await listAllCommentThreads({
        auth,
        videoId: options.videoId,
        order: options.order,
      })
    : await listCommentThreads({
        auth,
        videoId: options.videoId,
        maxResults: options.max,
        order: options.order,
      });

  const comments = (result.items as RawThread[]).map(mapThread);

  const formatted = {
    videoId: options.videoId,
    totalResults: comments.length,
    comments,
  };

  output(formatted, options.format);
}
