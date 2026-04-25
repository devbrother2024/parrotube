import fs from 'node:fs';
import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';

function getYouTubeClient(auth: OAuth2Client) {
  return google.youtube({ version: 'v3', auth });
}

// ---------- Comment Threads ----------

export interface ListCommentThreadsParams {
  auth: OAuth2Client;
  videoId: string;
  maxResults?: number;
  pageToken?: string;
  order?: 'time' | 'relevance';
}

export interface CommentThreadsResult {
  items: unknown[];
  nextPageToken?: string;
  pageInfo?: { totalResults?: number };
}

export async function listCommentThreads(
  params: ListCommentThreadsParams,
): Promise<CommentThreadsResult> {
  const yt = getYouTubeClient(params.auth);
  const response = await yt.commentThreads.list({
    part: ['snippet', 'replies'],
    videoId: params.videoId,
    maxResults: params.maxResults ?? 100,
    pageToken: params.pageToken,
    order: params.order ?? 'time',
  });
  return response.data as CommentThreadsResult;
}

export async function listAllCommentThreads(
  params: Omit<ListCommentThreadsParams, 'pageToken'> & { totalMax?: number },
): Promise<CommentThreadsResult> {
  const allItems: unknown[] = [];
  let pageToken: string | undefined;
  const limit = params.totalMax;

  do {
    const perPage = limit ? Math.min(100, limit - allItems.length) : 100;
    const result = await listCommentThreads({
      ...params,
      maxResults: perPage,
      pageToken,
    });
    allItems.push(...(result.items ?? []));
    pageToken = result.nextPageToken ?? undefined;

    if (limit && allItems.length >= limit) break;

    process.stderr.write(`Fetched ${allItems.length} comments...\n`);
  } while (pageToken);

  return { items: allItems, pageInfo: { totalResults: allItems.length } };
}

// ---------- Channels ----------

export interface GetChannelParams {
  auth: OAuth2Client;
  channelId?: string;
}

export interface DataApiResult {
  items: unknown[];
  pageInfo?: { totalResults?: number };
  nextPageToken?: string;
}

export async function getChannel(params: GetChannelParams): Promise<DataApiResult> {
  const yt = getYouTubeClient(params.auth);
  const requestParams: Record<string, unknown> = {
    part: ['snippet', 'statistics', 'contentDetails', 'brandingSettings'],
  };
  if (params.channelId) {
    requestParams.id = [params.channelId];
  } else {
    requestParams.mine = true;
  }
  const response = await yt.channels.list(requestParams as never);
  return (response as { data: DataApiResult }).data;
}

// ---------- Videos ----------

export interface ListVideosParams {
  auth: OAuth2Client;
  videoIds: string[];
}

export async function listVideos(params: ListVideosParams): Promise<DataApiResult> {
  const yt = getYouTubeClient(params.auth);
  const response = await yt.videos.list({
    part: ['snippet', 'statistics', 'contentDetails', 'status'],
    id: params.videoIds,
  });
  return response.data as DataApiResult;
}

// ---------- Playlists ----------

export interface ListPlaylistsParams {
  auth: OAuth2Client;
  channelId?: string;
  maxResults?: number;
  pageToken?: string;
}

export async function listPlaylists(params: ListPlaylistsParams): Promise<DataApiResult> {
  const yt = getYouTubeClient(params.auth);
  const requestParams: Record<string, unknown> = {
    part: ['snippet', 'contentDetails'],
    maxResults: params.maxResults ?? 25,
    pageToken: params.pageToken,
  };
  if (params.channelId) {
    requestParams.channelId = params.channelId;
  } else {
    requestParams.mine = true;
  }
  const response = await yt.playlists.list(requestParams as never);
  return (response as { data: DataApiResult }).data;
}

// ---------- Playlist Items ----------

export interface ListPlaylistItemsParams {
  auth: OAuth2Client;
  playlistId: string;
  maxResults?: number;
  pageToken?: string;
}

export async function listPlaylistItems(
  params: ListPlaylistItemsParams,
): Promise<DataApiResult> {
  const yt = getYouTubeClient(params.auth);
  const response = await yt.playlistItems.list({
    part: ['snippet', 'contentDetails'],
    playlistId: params.playlistId,
    maxResults: params.maxResults ?? 50,
    pageToken: params.pageToken,
  });
  return response.data as DataApiResult;
}

// ---------- Search ----------

export interface SearchParams {
  auth: OAuth2Client;
  query: string;
  type?: string;
  maxResults?: number;
  pageToken?: string;
}

export async function searchVideos(params: SearchParams): Promise<DataApiResult> {
  const yt = getYouTubeClient(params.auth);
  const response = await yt.search.list({
    part: ['snippet'],
    q: params.query,
    type: [params.type ?? 'video'],
    maxResults: params.maxResults ?? 25,
    pageToken: params.pageToken,
  });
  return response.data as DataApiResult;
}

// ---------- Subscriptions ----------

export interface ListSubscriptionsParams {
  auth: OAuth2Client;
  maxResults?: number;
  pageToken?: string;
}

export async function listSubscriptions(
  params: ListSubscriptionsParams,
): Promise<DataApiResult> {
  const yt = getYouTubeClient(params.auth);
  const response = await yt.subscriptions.list({
    part: ['snippet'],
    mine: true,
    maxResults: params.maxResults ?? 25,
    pageToken: params.pageToken,
  });
  return response.data as DataApiResult;
}

// ---------- Activities ----------

export interface ListActivitiesParams {
  auth: OAuth2Client;
  channelId?: string;
  maxResults?: number;
  pageToken?: string;
}

export async function listActivities(
  params: ListActivitiesParams,
): Promise<DataApiResult> {
  const yt = getYouTubeClient(params.auth);
  const requestParams: Record<string, unknown> = {
    part: ['snippet', 'contentDetails'],
    maxResults: params.maxResults ?? 25,
    pageToken: params.pageToken,
  };
  if (params.channelId) {
    requestParams.channelId = params.channelId;
  } else {
    requestParams.mine = true;
  }
  const response = await yt.activities.list(requestParams as never);
  return (response as { data: DataApiResult }).data;
}

// ---------- Captions ----------

export interface ListCaptionsParams {
  auth: OAuth2Client;
  videoId: string;
}

export async function listCaptions(params: ListCaptionsParams): Promise<DataApiResult> {
  const yt = getYouTubeClient(params.auth);
  const response = await yt.captions.list({
    part: ['snippet'],
    videoId: params.videoId,
  });
  return response.data as DataApiResult;
}

const MAX_CAPTION_FILE_SIZE_BYTES = 100 * 1024 * 1024;

export interface UploadCaptionParams {
  auth: OAuth2Client;
  videoId: string;
  filePath: string;
  language: string;
  name: string;
  isDraft: boolean;
}

export interface CaptionResource {
  id?: string;
  snippet?: Record<string, unknown>;
  [key: string]: unknown;
}

function validateCaptionFile(filePath: string): void {
  let stat: fs.Stats;
  try {
    stat = fs.statSync(filePath);
  } catch {
    throw new Error(`Caption file not found: ${filePath}`);
  }

  if (!stat.isFile()) {
    throw new Error(`Caption path must be a file: ${filePath}`);
  }

  if (stat.size > MAX_CAPTION_FILE_SIZE_BYTES) {
    throw new Error('Caption file must be 100MB or smaller');
  }
}

export async function uploadCaption(
  params: UploadCaptionParams,
): Promise<CaptionResource> {
  validateCaptionFile(params.filePath);

  const yt = getYouTubeClient(params.auth);
  const response = await yt.captions.insert({
    part: ['snippet'],
    requestBody: {
      snippet: {
        videoId: params.videoId,
        language: params.language,
        name: params.name,
        isDraft: params.isDraft,
      },
    },
    media: {
      mimeType: 'application/octet-stream',
      body: fs.createReadStream(params.filePath),
    },
  });

  return response.data as CaptionResource;
}

// ---------- Video Categories ----------

export interface ListVideoCategoriesParams {
  auth: OAuth2Client;
  regionCode?: string;
}

export async function listVideoCategories(
  params: ListVideoCategoriesParams,
): Promise<DataApiResult> {
  const yt = getYouTubeClient(params.auth);
  const response = await yt.videoCategories.list({
    part: ['snippet'],
    regionCode: params.regionCode ?? 'KR',
  });
  return response.data as DataApiResult;
}

// ---------- i18n ----------

export interface I18nParams {
  auth: OAuth2Client;
}

export async function listI18nRegions(params: I18nParams): Promise<DataApiResult> {
  const yt = getYouTubeClient(params.auth);
  const response = await yt.i18nRegions.list({ part: ['snippet'] });
  return response.data as DataApiResult;
}

export async function listI18nLanguages(params: I18nParams): Promise<DataApiResult> {
  const yt = getYouTubeClient(params.auth);
  const response = await yt.i18nLanguages.list({ part: ['snippet'] });
  return response.data as DataApiResult;
}
