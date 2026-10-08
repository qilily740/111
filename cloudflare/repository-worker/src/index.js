const channels = new Set(['beauty', 'world', 'character']);
const mime = { css:'text/css', js:'text/javascript', json:'application/json', txt:'text/plain', docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document', png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', webp:'image/webp' };
const allowedFiles = {
  beauty:new Set(['css', 'js', 'json', 'txt', 'png', 'jpg', 'jpeg', 'webp']),
  world:new Set(['docx', 'txt', 'json', 'png', 'jpg', 'jpeg', 'webp']),
  character:new Set(['docx', 'txt', 'json', 'png', 'jpg', 'jpeg', 'webp'])
};
const maxFile = 8 * 1024 * 1024;
const maxRequest = 26 * 1024 * 1024;
const maxChatStickers = 20;
const maxChatStickerGroups = 20;
const maxChatStickerBytes = 5 * 1024 * 1024;
const chatStickerUnusedMs = 90 * 24 * 60 * 60 * 1000;
const maxChatStickerFileBytes = 512 * 1024;
const driveUploadEndpoint = 'https://www.googleapis.com/upload/drive/v3/files';
const driveFilesEndpoint = 'https://www.googleapis.com/drive/v3/files';
const driveFolderMime = 'application/vnd.google-apps.folder';
const now = () => Date.now();
const clean = (value, length) => String(value ?? '').trim().slice(0, length);
const uuid = () => crypto.randomUUID();
const listTags = value => [...new Set(String(value || '').split(/[,，]/).map(item => clean(item, 24)).filter(Boolean))].slice(0, 5);
class RepositoryError extends Error {
  constructor(code, status = 500) { super(code); this.code = code; this.status = status; }
}
const header = (request, env) => {
  const origin = request.headers.get('Origin') || '';
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map(item => item.trim());
  return {
    ...(allowed.includes(origin) ? { 'Access-Control-Allow-Origin':origin, Vary:'Origin' } : {}),
    'Access-Control-Allow-Methods':'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':'Authorization, Content-Type, X-Ideal-Authorization, X-Ideal-Target-URL',
    'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff'
  };
};
const json = (request, env, body, status = 200) => Response.json(body, { status, headers:header(request, env) });
async function authorize(request, env) {
  const token = request.headers.get('Authorization') || '';
  if (!/^Bearer\s+\S+$/i.test(token)) return { error:'UNAUTHORIZED', status:401 };
  if (!env.AUTH) return { error:'AUTH_SERVICE_UNAVAILABLE', status:503 };
  try {
    const response = await env.AUTH.fetch('https://ideal-machine-auth/auth/authorize', { method:'POST', headers:{ Authorization:token } });
    const data = await response.json();
    if (!response.ok || !data?.user?.id) return { error:data?.error || 'UNAUTHORIZED', status:response.status };
    return { user:data.user };
  } catch { return { error:'AUTH_SERVICE_UNAVAILABLE', status:503 }; }
}
async function proxyImageGeneration(request, env) {
  const token = request.headers.get('X-Ideal-Authorization') || '';
  const authRequest = new Request(request.url, { method:'GET', headers:{ Authorization:token } });
  const auth = await authorize(authRequest, env);
  if (auth.error) return json(request, env, { error:auth.error }, auth.status);

  let target;
  try { target = new URL(request.headers.get('X-Ideal-Target-URL') || ''); }
  catch { return json(request, env, { error:'INVALID_IMAGE_ENDPOINT' }, 400); }
  if (target.protocol !== 'https:' || target.username || target.password ||
      !/\/images\/generations\/?$/i.test(target.pathname) ||
      (target.port && target.port !== '443') ||
      /^(?:localhost|.*\.localhost|.*\.local)$/i.test(target.hostname) ||
      /^(?:127\.|10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2\d|3[01])\.|0\.|\[::1\]|\[fc|\[fd|\[fe80:)/i.test(target.hostname)) {
    return json(request, env, { error:'INVALID_IMAGE_ENDPOINT' }, 400);
  }
  if (request.method !== 'POST') return json(request, env, { error:'METHOD_NOT_ALLOWED' }, 405);
  if (Number(request.headers.get('Content-Length') || 0) > 2 * 1024 * 1024) return json(request, env, { error:'IMAGE_REQUEST_TOO_LARGE' }, 413);
  const body = await request.arrayBuffer();
  if (body.byteLength > 2 * 1024 * 1024) return json(request, env, { error:'IMAGE_REQUEST_TOO_LARGE' }, 413);

  const headers = new Headers();
  for (const name of ['Authorization', 'Content-Type', 'Accept']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  try {
    const upstream = await fetch(target.href, { method:'POST', headers, body, redirect:'manual' });
    const responseHeaders = new Headers(header(request, env));
    for (const name of ['Content-Type', 'Retry-After']) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    responseHeaders.set('Cache-Control', 'no-store');
    return new Response(upstream.body, { status:upstream.status, headers:responseHeaders });
  } catch {
    return json(request, env, { error:'IMAGE_UPSTREAM_UNREACHABLE' }, 502);
  }
}
function requireDriveConfig(env) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REFRESH_TOKEN) throw new RepositoryError('STORAGE_UNAVAILABLE', 503);
}
async function driveAccessToken(env) {
  requireDriveConfig(env);
  const body = new URLSearchParams({
    client_id:env.GOOGLE_CLIENT_ID,
    client_secret:env.GOOGLE_CLIENT_SECRET,
    refresh_token:env.GOOGLE_REFRESH_TOKEN,
    grant_type:'refresh_token'
  });
  const response = await fetch('https://oauth2.googleapis.com/token', { method:'POST', headers:{ 'Content-Type':'application/x-www-form-urlencoded' }, body });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) throw new RepositoryError('STORAGE_UNAVAILABLE', 503);
  return data.access_token;
}
async function driveFetch(token, url, options = {}) {
  const response = await fetch(url, { ...options, headers:{ Authorization:`Bearer ${token}`, ...(options.headers || {}) } });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('google_drive_request_failed', response.status, detail.slice(0, 500));
    throw new RepositoryError('STORAGE_ERROR', 502);
  }
  return response;
}
function joinBytes(...parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
  return output;
}
async function driveUpload(token, file, name, type, folderId) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const boundary = `ideal_${uuid().replaceAll('-', '')}`;
  const encoder = new TextEncoder();
  const metadata = JSON.stringify({ name, mimeType:type, parents:[folderId] });
  const prefix = encoder.encode(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${type}\r\n\r\n`);
  const suffix = encoder.encode(`\r\n--${boundary}--`);
  const response = await driveFetch(token, `${driveUploadEndpoint}?uploadType=multipart&fields=id`, {
    method:'POST',
    headers:{ 'Content-Type':`multipart/related; boundary=${boundary}` },
    body:joinBytes(prefix, bytes, suffix)
  });
  const data = await response.json().catch(() => ({}));
  if (!data.id) throw new RepositoryError('STORAGE_ERROR', 502);
  return data.id;
}
async function driveCreateFolder(token) {
  const response = await driveFetch(token, `${driveFilesEndpoint}?fields=id`, {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body:JSON.stringify({ name:'个人文件同步', mimeType:driveFolderMime, parents:['root'] })
  });
  const data = await response.json().catch(() => ({}));
  if (!data.id) throw new RepositoryError('STORAGE_ERROR', 502);
  return data.id;
}
async function driveFolderId(env, token) {
  if (env.GOOGLE_DRIVE_FOLDER_ID) return env.GOOGLE_DRIVE_FOLDER_ID;
  const existing = await env.DB.prepare('SELECT value FROM repository_settings WHERE key = ?').bind('drive_folder_id').first();
  if (existing?.value) return existing.value;
  const created = await driveCreateFolder(token);
  await env.DB.prepare('INSERT OR IGNORE INTO repository_settings (key, value) VALUES (?, ?)').bind('drive_folder_id', created).run();
  const saved = await env.DB.prepare('SELECT value FROM repository_settings WHERE key = ?').bind('drive_folder_id').first();
  return saved?.value || created;
}
async function driveDelete(token, fileId) {
  if (!fileId) return true;
  try {
    const response = await fetch(`${driveFilesEndpoint}/${encodeURIComponent(fileId)}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } });
    return response.ok || response.status === 404;
  } catch { return false; }
}
async function driveDownload(token, fileId) {
  return driveFetch(token, `${driveFilesEndpoint}/${encodeURIComponent(fileId)}?alt=media`);
}
function fromRow(row, userId) {
  return {
    id:row.id, channel:row.channel, authorId:row.author_id, authorName:row.author_name, authorAvatar:Boolean(row.avatar_key),
    title:row.title, body:row.body, hasCode:Boolean(row.code_text), codeText:row.liked || row.author_id === userId ? row.code_text : '', tags:JSON.parse(row.tags_json || '[]'),
    createdAt:row.created_at, updatedAt:row.updated_at,
    likeCount:Number(row.like_count || 0),
    liked:Boolean(row.liked), saved:Boolean(row.saved), mine:row.author_id === userId,
    attachments:row.attachments || []
  };
}
async function addAttachments(db, postIds, posts) {
  if (!postIds.length) return posts;
  const placeholders = postIds.map(() => '?').join(',');
  const rows = await db.prepare(`SELECT id, post_id, file_name, mime_type, size FROM attachments WHERE post_id IN (${placeholders}) ORDER BY created_at`).bind(...postIds).all();
  const byPost = new Map(postIds.map(id => [id, []]));
  for (const file of rows.results || []) byPost.get(file.post_id)?.push({ id:file.id, name:file.file_name, type:file.mime_type, size:file.size });
  return posts.map(post => ({ ...post, attachments:byPost.get(post.id) || [] }));
}
async function listPosts(request, env, user, url) {
  const channel = url.searchParams.get('channel') || '';
  if (!channels.has(channel)) return json(request, env, { error:'INVALID_CHANNEL' }, 400);
  const tag = clean(url.searchParams.get('tag'), 24);
  const query = clean(url.searchParams.get('q'), 100);
  const offset = Math.min(1000, Math.max(0, Number(url.searchParams.get('offset')) || 0));
  const order = url.searchParams.get('order') === 'oldest' ? 'ASC' : 'DESC';
  const statement = env.DB.prepare(`SELECT p.*,
    (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id) AS like_count,
    (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id AND l.user_id = ?) AS liked,
    (SELECT COUNT(*) FROM saved_posts s WHERE s.post_id = p.id AND s.user_id = ?) AS saved
    FROM posts p WHERE p.channel = ? AND (? = '' OR p.title LIKE ? OR p.body LIKE ?)
    AND (? = '' OR p.tags_json LIKE ?)
    ORDER BY p.created_at ${order} LIMIT 20 OFFSET ?`);
  const rows = await statement.bind(user.id, user.id, channel, query, `%${query}%`, `%${query}%`, tag, `%"${tag}"%`, offset).all();
  const posts = (rows.results || []).map(row => fromRow(row, user.id));
  return json(request, env, { posts:await addAttachments(env.DB, posts.map(post => post.id), posts), hasMore:posts.length === 20 });
}
async function readPost(request, env, user, id) {
  const row = await env.DB.prepare(`SELECT p.*,
    (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id) AS like_count,
    (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id AND l.user_id = ?) AS liked,
    (SELECT COUNT(*) FROM saved_posts s WHERE s.post_id = p.id AND s.user_id = ?) AS saved
    FROM posts p WHERE p.id = ?`).bind(user.id, user.id, id).first();
  if (!row) return json(request, env, { error:'NOT_FOUND' }, 404);
  const [post] = await addAttachments(env.DB, [id], [fromRow(row, user.id)]);
  return json(request, env, { post });
}
async function createPost(request, env, user) {
  if (Number(request.headers.get('Content-Length') || 0) > maxRequest) return json(request, env, { error:'REQUEST_TOO_LARGE' }, 413);
  const form = await request.formData();
  const channel = clean(form.get('channel'), 20);
  const title = clean(form.get('title'), 121);
  const body = clean(form.get('body'), 30001);
  const codeText = clean(form.get('codeText'), 121).toUpperCase();
  const avatar = form.get('avatar');
  if (!channels.has(channel) || !title || title.length > 120 || body.length > 30000) return json(request, env, { error:'INVALID_POST' }, 400);
  const files = form.getAll('files');
  if (channel === 'beauty' && !codeText && !files.length) return json(request, env, { error:'BEAUTY_CODE_OR_FILE_REQUIRED' }, 400);
  if (channel !== 'beauty' && !files.length) return json(request, env, { error:'FILE_REQUIRED' }, 400);
  if (channel !== 'beauty' && codeText) return json(request, env, { error:'CODE_NOT_ALLOWED' }, 400);
  if (codeText && !/^IDEAL-[A-Z0-9-]{3,100}$/.test(codeText)) return json(request, env, { error:'INVALID_BEAUTY_CODE' }, 400);
  if (files.length > 3) return json(request, env, { error:'TOO_MANY_FILES' }, 400);
  const prepared = [];
  let total = 0;
  let avatarType = '';
  if (avatar instanceof File && avatar.size) {
    avatarType = String(avatar.type || '');
    if (avatar.size > 512 * 1024 || !['image/png', 'image/jpeg', 'image/webp'].includes(avatarType)) return json(request, env, { error:'INVALID_AVATAR' }, 400);
    const bytes = new Uint8Array(await avatar.slice(0, 12).arrayBuffer());
    const valid = avatarType === 'image/png' ? bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 : avatarType === 'image/jpeg' ? bytes[0] === 0xff && bytes[1] === 0xd8 : String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
    if (!valid) return json(request, env, { error:'INVALID_AVATAR' }, 400);
    total += avatar.size;
  }
  for (const file of files) {
    if (!(file instanceof File)) return json(request, env, { error:'INVALID_FILE' }, 400);
    const name = clean(file.name, 150).replace(/[\\/\r\n\0]/g, '_');
    const extension = name.split('.').pop().toLowerCase();
    if (!allowedFiles[channel].has(extension) || file.size < 1 || file.size > maxFile) return json(request, env, { error:'INVALID_FILE_TYPE_OR_SIZE' }, 400);
    total += file.size;
    if (total > maxRequest) return json(request, env, { error:'REQUEST_TOO_LARGE' }, 413);
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    if (extension === 'png' && !(bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47)) return json(request, env, { error:'INVALID_IMAGE' }, 400);
    if (['jpg','jpeg'].includes(extension) && !(bytes[0] === 0xff && bytes[1] === 0xd8)) return json(request, env, { error:'INVALID_IMAGE' }, 400);
    if (extension === 'webp' && !(String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP')) return json(request, env, { error:'INVALID_IMAGE' }, 400);
    if (extension === 'docx' && !(bytes[0] === 0x50 && bytes[1] === 0x4b)) return json(request, env, { error:'INVALID_DOCX' }, 400);
    prepared.push({ file, name, type:mime[extension] });
  }
  const importable = { beauty:/\.(css|json)$/i, world:/\.(txt|docx|json)$/i, character:/\.(png|txt|docx|json)$/i }[channel];
  if (!codeText && !prepared.some(item => importable.test(item.name))) return json(request, env, { error:'IMPORTABLE_FILE_REQUIRED' }, 400);
  const recent = await env.DB.prepare('SELECT COUNT(*) AS n FROM posts WHERE author_id = ? AND created_at > ?').bind(user.id, now() - 3600000).first();
  if (Number(recent?.n || 0) >= 10) return json(request, env, { error:'POST_RATE_LIMIT' }, 429);
  const id = uuid();
  const createdAt = now();
  const stored = [];
  const token = await driveAccessToken(env);
  const folderId = await driveFolderId(env, token);
  try {
    let storedAvatarKey = '';
    if (avatarType) {
      storedAvatarKey = await driveUpload(token, avatar, `${id}-avatar.${avatarType === 'image/png' ? 'png' : avatarType === 'image/webp' ? 'webp' : 'jpg'}`, avatarType, folderId);
      stored.push({ key:storedAvatarKey });
    }
    for (const item of prepared) {
      const fileId = uuid();
      const key = await driveUpload(token, item.file, item.name, item.type, folderId);
      stored.push({ id:fileId, key, ...item });
      item.driveKey = key;
    }
    const statements = [env.DB.prepare('INSERT INTO posts (id, channel, author_id, author_name, title, body, code_text, tags_json, created_at, updated_at, avatar_key, avatar_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, channel, user.id, clean(user.username || '理想机用户', 60), title, body, codeText, JSON.stringify(listTags(form.get('tags'))), createdAt, createdAt, stored.find(item => !item.id)?.key || '', avatarType)];
    for (const item of stored.filter(item => item.id)) statements.push(env.DB.prepare('INSERT INTO attachments (id, post_id, object_key, file_name, mime_type, size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(item.id, id, item.key, item.name, item.type, item.file.size, createdAt));
    await env.DB.batch(statements);
  } catch (error) {
    await Promise.allSettled(stored.map(item => driveDelete(token, item.key)));
    throw error;
  }
  return json(request, env, { id }, 201);
}
async function deletePost(request, env, user, postId) {
  const post = await env.DB.prepare('SELECT id, author_id, avatar_key FROM posts WHERE id = ?').bind(postId).first();
  if (!post) return json(request, env, { error:'NOT_FOUND' }, 404);
  if (post.author_id !== user.id) return json(request, env, { error:'FORBIDDEN' }, 403);
  const attachments = await env.DB.prepare('SELECT object_key FROM attachments WHERE post_id = ?').bind(postId).all();
  const driveKeys = [post.avatar_key, ...(attachments.results || []).map(row => row.object_key)].filter(Boolean);

  // Delete all D1 metadata first. This also removes likes/saves even if a Drive
  // cleanup request is temporarily unavailable, so the post cannot be found again.
  await env.DB.batch([
    env.DB.prepare('DELETE FROM saved_posts WHERE post_id = ?').bind(postId),
    env.DB.prepare('DELETE FROM post_likes WHERE post_id = ?').bind(postId),
    env.DB.prepare('DELETE FROM attachments WHERE post_id = ?').bind(postId),
    env.DB.prepare('DELETE FROM posts WHERE id = ? AND author_id = ?').bind(postId, user.id)
  ]);

  // Drive files are private and only referenced by this post. Cleanup is best
  // effort after the authoritative D1 deletion; an API outage must not block
  // the author from deleting the post itself.
  try {
    const token = await driveAccessToken(env);
    await Promise.allSettled(driveKeys.map(key => driveDelete(token, key)));
  } catch (error) {
    console.error('repository_drive_cleanup_failed', error);
  }
  return json(request, env, { deleted:true });
}
async function toggleLike(request, env, user, postId) {
  const post = await env.DB.prepare('SELECT id FROM posts WHERE id = ?').bind(postId).first();
  if (!post) return json(request, env, { error:'NOT_FOUND' }, 404);
  const existing = await env.DB.prepare('SELECT 1 AS liked FROM post_likes WHERE post_id = ? AND user_id = ?').bind(postId, user.id).first();
  if (existing) await env.DB.prepare('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?').bind(postId, user.id).run();
  else await env.DB.prepare('INSERT OR IGNORE INTO post_likes (post_id, user_id, created_at) VALUES (?, ?, ?)').bind(postId, user.id, now()).run();
  const count = await env.DB.prepare('SELECT COUNT(*) AS n FROM post_likes WHERE post_id = ?').bind(postId).first();
  return json(request, env, { liked:!existing, likeCount:Number(count?.n || 0) });
}
async function readAttachment(request, env, user, id) {
  const file = await env.DB.prepare('SELECT a.object_key, a.file_name, a.mime_type, a.post_id, p.author_id FROM attachments a JOIN posts p ON p.id = a.post_id WHERE a.id = ?').bind(id).first();
  if (!file) return json(request, env, { error:'NOT_FOUND' }, 404);
  const image = /^image\/(png|jpeg|webp)$/.test(file.mime_type);
  const downloading = new URL(request.url).searchParams.get('download') === '1';
  if ((!image || downloading) && file.author_id !== user.id) {
    const liked = await env.DB.prepare('SELECT 1 AS liked FROM post_likes WHERE post_id = ? AND user_id = ?').bind(file.post_id, user.id).first();
    if (!liked) return json(request, env, { error:'LIKE_REQUIRED' }, 403);
  }
  const object = await driveDownload(await driveAccessToken(env), file.object_key);
  const name = encodeURIComponent(file.file_name);
  return new Response(object.body, { headers:{ ...header(request, env), 'Content-Type':image ? file.mime_type : 'application/octet-stream', 'Content-Disposition':`${image ? 'inline' : 'attachment'}; filename*=UTF-8''${name}` } });
}
async function searchAccounts(request, env, user, url) {
  const query = clean(url.searchParams.get('q'), 32);
  if (!/^[a-zA-Z0-9._-]{3,32}$/.test(query)) return json(request, env, { error:'INVALID_ACCOUNT_QUERY' }, 400);
  const token = request.headers.get('Authorization');
  const response = await env.AUTH.fetch(`https://ideal-machine-auth/auth/users/search?q=${encodeURIComponent(query)}`, { headers:{ Authorization:token } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) return json(request, env, { error:payload.error || 'ACCOUNT_SEARCH_UNAVAILABLE' }, response.status);
  const users = Array.isArray(payload.users) ? payload.users.filter(item => item.id && item.username) : [];
  const ids = users.map(item => item.id);
  const pending = ids.length ? await env.DB.prepare(`SELECT from_user_id, to_user_id, status FROM friend_requests WHERE (from_user_id = ? AND to_user_id IN (${ids.map(() => '?').join(',')})) OR (to_user_id = ? AND from_user_id IN (${ids.map(() => '?').join(',')}))`).bind(user.id, ...ids, user.id, ...ids).all() : { results:[] };
  const relations = new Map((pending.results || []).map(row => [row.from_user_id === user.id ? row.to_user_id : row.from_user_id, row]));
  const profiles = ids.length ? await env.DB.prepare(`SELECT user_id, nickname, avatar_key FROM repository_profiles WHERE user_id IN (${ids.map(() => '?').join(',')})`).bind(...ids).all() : { results:[] };
  const profileByUser = new Map((profiles.results || []).map(row => [row.user_id, row]));
  return json(request, env, { users:users.map(item => {
    const profile = profileByUser.get(item.id);
    const relation = relations.get(item.id);
    return { ...item, userId:item.id, nickname:profile?.nickname || '', avatarUrl:profile?.avatar_key ? `/api/users/${encodeURIComponent(item.id)}/avatar` : '', relation:relation?.status === 'accepted' ? 'friend' : relation ? (relation.from_user_id === user.id ? 'outgoing' : 'incoming') : '' };
  }) });
}
async function listFriends(request, env, user) {
  const [friends, incoming, outgoing] = await Promise.all([
    env.DB.prepare(`SELECT r.id, CASE WHEN r.from_user_id = ? THEN r.to_user_id ELSE r.from_user_id END AS userId,
      CASE WHEN r.from_user_id = ? THEN r.to_username ELSE r.from_username END AS username,
      COALESCE(NULLIF(p.nickname,''), CASE WHEN r.from_user_id = ? THEN r.to_username ELSE r.from_username END) AS nickname, p.avatar_key AS avatarKey
      FROM friend_requests r LEFT JOIN repository_profiles p ON p.user_id = CASE WHEN r.from_user_id = ? THEN r.to_user_id ELSE r.from_user_id END
      WHERE r.status = 'accepted' AND (r.from_user_id = ? OR r.to_user_id = ?) ORDER BY r.updated_at DESC LIMIT 500`).bind(user.id,user.id,user.id,user.id,user.id,user.id).all(),
    env.DB.prepare(`SELECT r.id, r.from_user_id AS userId, r.from_username AS username,
      COALESCE(NULLIF(p.nickname,''), r.from_username) AS nickname, p.avatar_key AS avatarKey FROM friend_requests r
      LEFT JOIN repository_profiles p ON p.user_id = r.from_user_id
      WHERE r.to_user_id = ? AND r.status = 'pending' ORDER BY r.created_at DESC LIMIT 200`).bind(user.id).all(),
    env.DB.prepare(`SELECT r.id, r.to_user_id AS userId, r.to_username AS username,
      COALESCE(NULLIF(p.nickname,''), r.to_username) AS nickname, p.avatar_key AS avatarKey FROM friend_requests r
      LEFT JOIN repository_profiles p ON p.user_id = r.to_user_id
      WHERE r.from_user_id = ? AND r.status = 'pending' ORDER BY r.created_at DESC LIMIT 200`).bind(user.id).all()
  ]);
  const publicProfiles = rows => (rows || []).map(({avatarKey, ...row}) => ({ ...row, avatarUrl:avatarKey ? `/api/users/${encodeURIComponent(row.userId)}/avatar` : '' }));
  return json(request, env, { friends:publicProfiles(friends.results), incoming:publicProfiles(incoming.results), outgoing:publicProfiles(outgoing.results) });
}
async function createFriendRequest(request, env, user) {
  let body;
  try { body = await request.json(); } catch { return json(request, env, { error:'INVALID_ACCOUNT_QUERY' }, 400); }
  const accountId = clean(body?.accountId, 32);
  if (!/^[a-zA-Z0-9._-]{3,32}$/.test(accountId) || accountId.toLowerCase() === String(user.username || '').toLowerCase()) return json(request, env, { error:'INVALID_ACCOUNT_QUERY' }, 400);
  const authorization = request.headers.get('Authorization');
  const lookup = await env.AUTH.fetch(`https://ideal-machine-auth/auth/users/search?q=${encodeURIComponent(accountId)}`, { headers:{ Authorization:authorization } });
  const found = await lookup.json().catch(() => ({}));
  if (!lookup.ok) return json(request, env, { error:found.error || 'ACCOUNT_SEARCH_UNAVAILABLE' }, lookup.status);
  const target = (found.users || []).find(item => String(item.username).toLowerCase() === accountId.toLowerCase());
  if (!target) return json(request, env, { error:'ACCOUNT_NOT_FOUND' }, 404);
  const existing = await env.DB.prepare(`SELECT id, from_user_id, status FROM friend_requests
    WHERE (from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?) LIMIT 1`).bind(user.id,target.id,target.id,user.id).first();
  if (existing?.status === 'accepted') return json(request, env, { error:'ALREADY_FRIENDS' }, 409);
  if (existing?.from_user_id === user.id) return json(request, env, { error:'REQUEST_ALREADY_SENT' }, 409);
  if (existing?.from_user_id === target.id) {
    await env.DB.prepare("UPDATE friend_requests SET status = 'accepted', updated_at = ? WHERE id = ? AND status = 'pending'").bind(now(),existing.id).run();
    return json(request, env, { ok:true, friends:true });
  }
  if (existing) return json(request, env, { error:'REQUEST_RECEIVED' }, 409);
  const createdAt = now();
  const id = uuid();
  await env.DB.prepare(`INSERT INTO friend_requests (id,from_user_id,from_username,to_user_id,to_username,status,created_at,updated_at)
    VALUES (?,?,?,?,?,'pending',?,?)`).bind(id,user.id,clean(user.username,32),target.id,target.username,createdAt,createdAt).run();
  return json(request, env, { ok:true, request:{ id, username:target.username } }, 201);
}
async function updateFriendRequest(request, env, user, requestId, action) {
  const row = await env.DB.prepare('SELECT id, from_user_id, to_user_id, status FROM friend_requests WHERE id = ?').bind(requestId).first();
  const authorizedSide = action === 'cancel' ? row?.from_user_id === user.id : row?.to_user_id === user.id;
  if (!row || !authorizedSide || row.status !== 'pending') return json(request, env, { error:'NOT_FOUND' }, 404);
  if (action === 'accept') {
    const reciprocal = await env.DB.prepare("SELECT id FROM friend_requests WHERE from_user_id = ? AND to_user_id = ? AND status = 'pending'").bind(row.to_user_id,row.from_user_id).first();
    if (reciprocal) await env.DB.prepare("DELETE FROM friend_requests WHERE id = ? AND status = 'pending'").bind(reciprocal.id).run();
    await env.DB.prepare("UPDATE friend_requests SET status = 'accepted', updated_at = ? WHERE id = ? AND to_user_id = ? AND status = 'pending'").bind(now(),requestId,user.id).run();
  }
  else { const side = action === 'cancel' ? 'from_user_id' : 'to_user_id'; await env.DB.prepare(`DELETE FROM friend_requests WHERE id = ? AND ${side} = ? AND status = 'pending'`).bind(requestId,user.id).run(); }
  return json(request, env, { ok:true });
}
async function removeFriend(request, env, user, friendId) {
  const result = await env.DB.prepare("DELETE FROM friend_requests WHERE id = ? AND status = 'accepted' AND (from_user_id = ? OR to_user_id = ?)").bind(friendId,user.id,user.id).run();
  return result.meta?.changes ? json(request, env, { ok:true }) : json(request, env, { error:'NOT_FOUND' }, 404);
}

const chatRetentionMs = 7 * 24 * 60 * 60 * 1000;
async function purgeExpiredMessages(env, at = now()) {
  await env.DB.prepare('DELETE FROM direct_messages WHERE expires_at <= ?').bind(at).run();
}
async function acceptedFriend(env, userId, friendId) {
  if (!friendId || friendId === userId) return false;
  return Boolean(await env.DB.prepare("SELECT 1 AS ok FROM friend_requests WHERE status = 'accepted' AND ((from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?)) LIMIT 1").bind(userId,friendId,friendId,userId).first());
}
async function chatBlockState(env, userId, friendId) {
  const rows = await env.DB.prepare('SELECT blocker_id FROM blocked_users WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)').bind(userId,friendId,friendId,userId).all();
  const blockedByMe = (rows.results || []).some(row => row.blocker_id === userId);
  const blockedByFriend = (rows.results || []).some(row => row.blocker_id === friendId);
  return { blockedByMe, blockedByFriend, canSend:!blockedByMe && !blockedByFriend };
}
async function updateChatBlock(request, env, user, friendId, block) {
  if (!await acceptedFriend(env, user.id, friendId)) return json(request, env, { error:'FRIENDSHIP_REQUIRED' }, 403);
  if (block) await env.DB.prepare('INSERT OR IGNORE INTO blocked_users (blocker_id,blocked_id,created_at) VALUES (?,?,?)').bind(user.id,friendId,now()).run();
  else await env.DB.prepare('DELETE FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?').bind(user.id,friendId).run();
  return json(request, env, { blocked:block });
}
async function listChats(request, env, user) {
  const at = now();
  const [friends, messages] = await Promise.all([
    env.DB.prepare(`SELECT r.id, CASE WHEN r.from_user_id = ? THEN r.to_user_id ELSE r.from_user_id END AS userId,
      CASE WHEN r.from_user_id = ? THEN r.to_username ELSE r.from_username END AS username,
      COALESCE(NULLIF(p.nickname,''), CASE WHEN r.from_user_id = ? THEN r.to_username ELSE r.from_username END) AS nickname,
      p.avatar_key AS avatarKey,
      EXISTS(SELECT 1 FROM blocked_users b WHERE b.blocker_id = ? AND b.blocked_id = CASE WHEN r.from_user_id = ? THEN r.to_user_id ELSE r.from_user_id END) AS blockedByMe,
      EXISTS(SELECT 1 FROM blocked_users b WHERE b.blocker_id = CASE WHEN r.from_user_id = ? THEN r.to_user_id ELSE r.from_user_id END AND b.blocked_id = ?) AS blockedByFriend
      FROM friend_requests r LEFT JOIN repository_profiles p ON p.user_id = CASE WHEN r.from_user_id = ? THEN r.to_user_id ELSE r.from_user_id END
      WHERE r.status = 'accepted' AND (r.from_user_id = ? OR r.to_user_id = ?)`).bind(user.id,user.id,user.id,user.id,user.id,user.id,user.id,user.id,user.id,user.id).all(),
    env.DB.prepare(`WITH user_messages AS (
      SELECT recipient_id AS friend_id, id, sender_id, recipient_id, body, created_at, read_at
        FROM direct_messages WHERE sender_id = ? AND expires_at > ?
      UNION ALL
      SELECT sender_id AS friend_id, id, sender_id, recipient_id, body, created_at, read_at
        FROM direct_messages WHERE recipient_id = ? AND expires_at > ?
    ), ranked_messages AS (
      SELECT friend_id, id, sender_id, body, created_at,
        SUM(CASE WHEN recipient_id = ? AND read_at IS NULL THEN 1 ELSE 0 END)
          OVER (PARTITION BY friend_id) AS unread_count,
        ROW_NUMBER() OVER (PARTITION BY friend_id ORDER BY created_at DESC, id DESC) AS row_number
      FROM user_messages
    )
    SELECT friend_id, sender_id, body, created_at, unread_count
      FROM ranked_messages WHERE row_number = 1`).bind(user.id,at,user.id,at,user.id).all()
  ]);
  const byFriend = new Map();
  for (const message of messages.results || []) {
    byFriend.set(message.friend_id, {
      lastMessage:message.body,
      lastMessageAt:message.created_at,
      lastMessageSenderId:message.sender_id,
      unreadCount:message.unread_count
    });
  }
  const chats = (friends.results || []).filter(friend => byFriend.has(friend.userId) && !friend.blockedByMe && !friend.blockedByFriend).map(({avatarKey, ...friend}) => ({
    ...friend, ...byFriend.get(friend.userId), avatarUrl:avatarKey ? `/api/users/${encodeURIComponent(friend.userId)}/avatar` : ''
  })).sort((a,b) => b.lastMessageAt - a.lastMessageAt);
  return json(request, env, { chats });
}
async function readChatMessages(request, env, user, friendId) {
  if (!await acceptedFriend(env, user.id, friendId)) return json(request, env, { error:'FRIENDSHIP_REQUIRED' }, 403);
  const at = now();
  const blockState = await chatBlockState(env,user.id,friendId);
  await env.DB.prepare('UPDATE direct_messages SET read_at = ? WHERE sender_id = ? AND recipient_id = ? AND read_at IS NULL AND expires_at > ?').bind(at,friendId,user.id,at).run();
  const result = await env.DB.prepare(`SELECT m.id, m.sender_id AS senderId, m.recipient_id AS recipientId, m.body, m.message_type AS type,
      m.sticker_id AS stickerId,
      CASE WHEN sticker.object_key != '' THEN '/api/chat-stickers/' || sticker.id || '/image' ELSE sticker.source_url END AS stickerUrl,
      sticker.size_bytes AS stickerSizeBytes, m.created_at AS createdAt,
      m.reply_to_id AS replyToId, reply.body AS replyBody, reply.sender_id AS replySenderId, reply.created_at AS replyCreatedAt
    FROM direct_messages m LEFT JOIN direct_messages reply ON reply.id = m.reply_to_id AND reply.expires_at > ?
    LEFT JOIN chat_stickers sticker ON sticker.id = m.sticker_id
    WHERE ((m.sender_id = ? AND m.recipient_id = ?) OR (m.sender_id = ? AND m.recipient_id = ?)) AND m.expires_at > ?
    ORDER BY m.created_at DESC, m.id DESC LIMIT 100`).bind(at,user.id,friendId,friendId,user.id,at).all();
  return json(request, env, { ...blockState, messages:(result.results || []).reverse() });
}
async function sendChatMessage(request, env, user, friendId) {
  if (!await acceptedFriend(env, user.id, friendId)) return json(request, env, { error:'FRIENDSHIP_REQUIRED' }, 403);
  const blockState = await chatBlockState(env,user.id,friendId);
  if (!blockState.canSend) return json(request, env, { error:'ACCOUNT_BLOCKED' }, 403);
  if (Number(request.headers.get('Content-Length') || 0) > 5000) return json(request, env, { error:'INVALID_MESSAGE' }, 400);
  let body;
  try { body = await request.json(); } catch { return json(request, env, { error:'INVALID_MESSAGE' }, 400); }
  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  const stickerId = typeof body?.stickerId === 'string' ? body.stickerId : null;
  const replyToId = typeof body?.replyToId === 'string' && body.replyToId ? body.replyToId : null;
  if ((stickerId ? text.length > 0 || !/^[a-f0-9-]{36}$/i.test(stickerId) : !text || text.length > 2000) || Object.keys(body || {}).some(key => !['text','replyToId','stickerId'].includes(key)) || (body?.replyToId != null && replyToId == null)) return json(request, env, { error:'INVALID_MESSAGE' }, 400);
  const at = now();
  let sticker = null;
  if (stickerId) {
    sticker = await env.DB.prepare('SELECT id, label, source_url AS stickerUrl, object_key AS objectKey FROM chat_stickers WHERE id = ? AND user_id = ? AND deleted_at IS NULL').bind(stickerId,user.id).first();
    if (!sticker) return json(request, env, { error:'CHAT_STICKER_NOT_FOUND' }, 404);
    await env.DB.prepare('UPDATE chat_stickers SET last_used_at = ? WHERE id = ? AND deleted_at IS NULL').bind(at,stickerId).run();
  }
  if (replyToId) {
    const replied = await env.DB.prepare(`SELECT id FROM direct_messages WHERE id = ? AND expires_at > ? AND ((sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?))`).bind(replyToId,at,user.id,friendId,friendId,user.id).first();
    if (!replied) return json(request, env, { error:'INVALID_REPLY' }, 400);
  }
  const recent = await env.DB.prepare('SELECT COUNT(*) AS count FROM direct_messages WHERE sender_id = ? AND created_at > ?').bind(user.id,at - 60_000).first();
  if (Number(recent?.count || 0) >= 30) return json(request, env, { error:'CHAT_RATE_LIMIT' }, 429);
  const messageBody = sticker ? `[表情包] ${sticker.label}` : text;
  const message = { id:uuid(), senderId:user.id, recipientId:friendId, body:messageBody, type:sticker ? 'sticker' : 'text', stickerId, stickerUrl:sticker?.objectKey ? `/api/chat-stickers/${stickerId}/image` : sticker?.stickerUrl || '', createdAt:at, replyToId };
  await env.DB.prepare('INSERT INTO direct_messages (id,sender_id,recipient_id,body,created_at,expires_at,reply_to_id,message_type,sticker_id) VALUES (?,?,?,?,?,?,?,?,?)').bind(message.id,user.id,friendId,messageBody,at,at + chatRetentionMs,replyToId,message.type,stickerId).run();
  return json(request, env, { message }, 201);
}

async function listChatStickers(request, env, user) {
  const [result, usage] = await Promise.all([
    env.DB.prepare(`SELECT id, label, group_name AS groupName, source_url AS sourceUrl,
      CASE WHEN object_key != '' THEN 1 ELSE 0 END AS stored,
      size_bytes AS sizeBytes, created_at AS createdAt, last_used_at AS lastUsedAt
      FROM chat_stickers WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC`).bind(user.id).all(),
    env.DB.prepare('SELECT COALESCE(SUM(size_bytes),0) AS usedBytes FROM chat_stickers WHERE user_id = ?').bind(user.id).first()
  ]);
  return json(request, env, { stickers:result.results || [], maxCount:maxChatStickers, maxGroups:maxChatStickerGroups, usedBytes:Number(usage?.usedBytes || 0), maxBytes:maxChatStickerBytes, maxFileBytes:maxChatStickerFileBytes, unusedDays:90 });
}
async function fetchChatStickerImage(sourceUrl) {
  let parsed;
  try { parsed = new URL(sourceUrl); } catch {}
  const host = String(parsed?.hostname || '').toLowerCase();
  const ipLiteral = /^\[?[0-9a-f:.]+\]?$/i.test(host);
  if (!parsed || parsed.protocol !== 'https:' || (parsed.port && parsed.port !== '443') || parsed.username || parsed.password || ipLiteral || /(?:^|\.)(?:localhost|local|internal|lan|test|onion)$/i.test(host)) throw new RepositoryError('INVALID_CHAT_STICKER', 400);
  let response;
  try { response = await fetch(parsed.href, { method:'GET', redirect:'manual', headers:{ Accept:'image/avif,image/webp,image/png,image/jpeg,image/gif' } }); }
  catch { throw new RepositoryError('CHAT_STICKER_SOURCE_UNAVAILABLE', 400); }
  if (response.status >= 300 && response.status < 400) throw new RepositoryError('CHAT_STICKER_REDIRECT_NOT_ALLOWED', 400);
  if (!response.ok) throw new RepositoryError('CHAT_STICKER_SOURCE_NOT_FOUND', 400);
  const type = String(response.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
  const extensions = { 'image/jpeg':'jpg', 'image/png':'png', 'image/webp':'webp', 'image/gif':'gif', 'image/avif':'avif' };
  if (!extensions[type]) throw new RepositoryError('INVALID_CHAT_STICKER_IMAGE', 400);
  const declaredSize = Number(response.headers.get('Content-Length') || 0);
  if (declaredSize > maxChatStickerFileBytes) throw new RepositoryError('CHAT_STICKER_FILE_TOO_LARGE', 413);
  const reader = response.body?.getReader();
  if (!reader) throw new RepositoryError('INVALID_CHAT_STICKER_IMAGE', 400);
  const chunks = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxChatStickerFileBytes) {
      await reader.cancel();
      throw new RepositoryError('CHAT_STICKER_FILE_TOO_LARGE', 413);
    }
    chunks.push(value);
  }
  if (!totalBytes) throw new RepositoryError('INVALID_CHAT_STICKER_IMAGE', 400);
  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.byteLength; }
  const starts = (...values) => values.every((value,index) => bytes[index] === value);
  const signatureValid = type === 'image/jpeg' ? starts(0xff,0xd8,0xff)
    : type === 'image/png' ? starts(0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a)
    : type === 'image/gif' ? String.fromCharCode(...bytes.slice(0,6)).startsWith('GIF8')
    : type === 'image/webp' ? String.fromCharCode(...bytes.slice(0,4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8,12)) === 'WEBP'
    : String.fromCharCode(...bytes.slice(4,12)).includes('ftyp') && /avif|avis/.test(String.fromCharCode(...bytes.slice(8,16)));
  if (!signatureValid) throw new RepositoryError('INVALID_CHAT_STICKER_IMAGE', 400);
  return { bytes, type, extension:extensions[type] };
}
async function readChatStickerImage(request, env, user, stickerId) {
  const at = now();
  const sticker = await env.DB.prepare('SELECT id,user_id,object_key,mime_type,deleted_at FROM chat_stickers WHERE id = ? AND object_key != ?').bind(stickerId,'').first();
  if (!sticker) return json(request, env, { error:'CHAT_STICKER_NOT_FOUND' }, 404);
  const owner = sticker.user_id === user.id && !sticker.deleted_at;
  const inChat = await env.DB.prepare(`SELECT 1 AS found FROM direct_messages WHERE sticker_id = ? AND expires_at > ? AND (sender_id = ? OR recipient_id = ?) LIMIT 1`).bind(stickerId,at,user.id,user.id).first();
  if (!owner && !inChat) return json(request, env, { error:'CHAT_STICKER_NOT_FOUND' }, 404);
  await env.DB.prepare('UPDATE chat_stickers SET last_used_at = ? WHERE id = ? AND deleted_at IS NULL').bind(at,stickerId).run();
  const object = await driveDownload(await driveAccessToken(env), sticker.object_key);
  return new Response(object.body, { headers:{ ...header(request, env), 'Content-Type':sticker.mime_type || 'application/octet-stream', 'Cache-Control':'private, max-age=3600', 'X-Content-Type-Options':'nosniff' } });
}
async function uploadChatSticker(request, env, user) {
  if (Number(request.headers.get('Content-Length') || 0) > 64 * 1024) return json(request, env, { error:'INVALID_CHAT_STICKER' }, 400);
  let body;
  try { body = await request.json(); } catch { return json(request, env, { error:'INVALID_CHAT_STICKER' }, 400); }
  const label = clean(body?.label, 40);
  const groupName = clean(body?.groupName || '默认', 24);
  const sourceUrl = typeof body?.url === 'string' ? body.url.trim() : '';
  let parsed;
  try { parsed = new URL(sourceUrl); } catch {}
  if (!label || !groupName || !parsed || parsed.protocol !== 'https:' || sourceUrl.length > 2048 || parsed.username || parsed.password || Object.keys(body || {}).some(key => !['label','url','groupName'].includes(key))) return json(request, env, { error:'INVALID_CHAT_STICKER' }, 400);
  const duplicate = await env.DB.prepare('SELECT id FROM chat_stickers WHERE user_id = ? AND source_url = ? AND deleted_at IS NULL').bind(user.id,sourceUrl).first();
  if (duplicate) return json(request, env, { error:'CHAT_STICKER_EXISTS' }, 409);
  const image = await fetchChatStickerImage(sourceUrl);
  const at = now(), id = uuid();
  const total = await env.DB.prepare('SELECT COALESCE(SUM(size_bytes),0) AS usedBytes FROM chat_stickers WHERE user_id = ?').bind(user.id).first();
  if (Number(total?.usedBytes || 0) + image.bytes.byteLength > maxChatStickerBytes) return json(request, env, { error:'CHAT_STICKER_STORAGE_LIMIT' }, 409);
  const token = await driveAccessToken(env);
  const file = new File([image.bytes], `sticker-${id}.${image.extension}`, { type:image.type });
  const objectKey = await driveUpload(token,file,`chat-sticker-${id}.${image.extension}`,image.type,await driveFolderId(env,token));
  const inserted = await env.DB.prepare(`INSERT INTO chat_stickers (id,user_id,label,group_name,source_url,created_at,object_key,mime_type,size_bytes,last_used_at)
    SELECT ?,?,?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM chat_stickers WHERE user_id = ? AND deleted_at IS NULL) < ?
    AND ((SELECT COUNT(*) FROM chat_stickers WHERE user_id = ? AND deleted_at IS NULL AND group_name = ?) > 0 OR (SELECT COUNT(DISTINCT group_name) FROM chat_stickers WHERE user_id = ? AND deleted_at IS NULL) < ?)
    AND (SELECT COALESCE(SUM(size_bytes),0) FROM chat_stickers WHERE user_id = ?) + ? <= ?
    AND NOT EXISTS (SELECT 1 FROM chat_stickers WHERE user_id = ? AND source_url = ? AND deleted_at IS NULL)`)
    .bind(id,user.id,label,groupName,sourceUrl,at,objectKey,image.type,image.bytes.byteLength,at,user.id,maxChatStickers,user.id,groupName,user.id,maxChatStickerGroups,user.id,image.bytes.byteLength,maxChatStickerBytes,user.id,sourceUrl).run();
  if (!inserted.meta?.changes) {
    await driveDelete(token,objectKey);
    const [exists, usage, groups, count] = await Promise.all([
      env.DB.prepare('SELECT 1 AS found FROM chat_stickers WHERE user_id = ? AND source_url = ? AND deleted_at IS NULL').bind(user.id,sourceUrl).first(),
      env.DB.prepare('SELECT COALESCE(SUM(size_bytes),0) AS usedBytes FROM chat_stickers WHERE user_id = ?').bind(user.id).first(),
      env.DB.prepare('SELECT COUNT(DISTINCT group_name) AS count FROM chat_stickers WHERE user_id = ? AND deleted_at IS NULL').bind(user.id).first(),
      env.DB.prepare('SELECT COUNT(*) AS count FROM chat_stickers WHERE user_id = ? AND deleted_at IS NULL').bind(user.id).first()
    ]);
    const error = exists ? 'CHAT_STICKER_EXISTS' : Number(usage?.usedBytes || 0) + image.bytes.byteLength > maxChatStickerBytes ? 'CHAT_STICKER_STORAGE_LIMIT' : Number(count?.count || 0) >= maxChatStickers ? 'CHAT_STICKER_LIMIT' : Number(groups?.count || 0) >= maxChatStickerGroups ? 'CHAT_STICKER_GROUP_LIMIT' : 'CHAT_STICKER_STORAGE_LIMIT';
    return json(request, env, { error }, 409);
  }
  return json(request, env, { ok:true, sticker:{ id, label, groupName, sourceUrl, stored:true, sizeBytes:image.bytes.byteLength, createdAt:at, lastUsedAt:at } }, 201);
}
async function renameChatStickerGroup(request, env, user, oldName) {
  let body; try { body = await request.json(); } catch { return json(request, env, { error:'INVALID_CHAT_STICKER' }, 400); }
  const groupName = clean(body?.groupName, 24);
  if (!groupName || Object.keys(body || {}).some(key => key !== 'groupName')) return json(request, env, { error:'INVALID_CHAT_STICKER' }, 400);
  const present = await env.DB.prepare('SELECT 1 AS found FROM chat_stickers WHERE user_id = ? AND group_name = ? AND deleted_at IS NULL LIMIT 1').bind(user.id,oldName).first();
  if (!present) return json(request, env, { error:'CHAT_STICKER_GROUP_NOT_FOUND' }, 404);
  const exists = await env.DB.prepare('SELECT 1 AS found FROM chat_stickers WHERE user_id = ? AND group_name = ? AND deleted_at IS NULL LIMIT 1').bind(user.id,groupName).first();
  const groups = await env.DB.prepare('SELECT COUNT(DISTINCT group_name) AS count FROM chat_stickers WHERE user_id = ? AND deleted_at IS NULL').bind(user.id).first();
  if (!exists && Number(groups?.count || 0) >= maxChatStickerGroups) return json(request, env, { error:'CHAT_STICKER_GROUP_LIMIT' }, 409);
  await env.DB.prepare('UPDATE chat_stickers SET group_name = ? WHERE user_id = ? AND group_name = ? AND deleted_at IS NULL').bind(groupName,user.id,oldName).run();
  return json(request, env, { ok:true, groupName });
}
async function deleteChatStickerGroup(request, env, user, groupName) {
  const result = await env.DB.prepare('UPDATE chat_stickers SET deleted_at = ? WHERE user_id = ? AND group_name = ? AND deleted_at IS NULL').bind(now(),user.id,groupName).run();
  if (!result.meta?.changes) return json(request, env, { error:'CHAT_STICKER_GROUP_NOT_FOUND' }, 404);
  return json(request, env, { ok:true });
}
async function deleteChatSticker(request, env, user, stickerId) {
  const sticker = await env.DB.prepare('SELECT id FROM chat_stickers WHERE id = ? AND user_id = ? AND deleted_at IS NULL').bind(stickerId,user.id).first();
  if (!sticker) return json(request, env, { error:'CHAT_STICKER_NOT_FOUND' }, 404);
  await env.DB.prepare('UPDATE chat_stickers SET deleted_at = ? WHERE id = ? AND user_id = ?').bind(now(),stickerId,user.id).run();
  return json(request, env, { ok:true });
}

async function uploadProfileAvatar(request, env, user) {
  if (Number(request.headers.get('Content-Length') || 0) > 600 * 1024) return json(request, env, { error:'INVALID_AVATAR' }, 400);
  let form;
  try { form = await request.formData(); } catch { return json(request, env, { error:'INVALID_AVATAR' }, 400); }
  const avatar = form.get('avatar');
  const type = avatar instanceof File ? String(avatar.type || '') : '';
  if (!(avatar instanceof File) || !avatar.size || avatar.size > 512 * 1024 || !['image/png','image/jpeg','image/webp'].includes(type)) return json(request, env, { error:'INVALID_AVATAR' }, 400);
  const bytes = new Uint8Array(await avatar.slice(0, 12).arrayBuffer());
  const valid = type === 'image/png' ? bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 : type === 'image/jpeg' ? bytes[0] === 0xff && bytes[1] === 0xd8 : String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  if (!valid) return json(request, env, { error:'INVALID_AVATAR' }, 400);
  const token = await driveAccessToken(env);
  const folderId = await driveFolderId(env, token);
  const extension = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
  const uploaded = await driveUpload(token, avatar, `profile-${uuid()}.${extension}`, type, folderId);
  const previous = await env.DB.prepare('SELECT avatar_key FROM repository_profiles WHERE user_id = ?').bind(user.id).first();
  try {
    await env.DB.prepare('INSERT OR IGNORE INTO repository_profiles (user_id) VALUES (?)').bind(user.id).run();
    await env.DB.prepare('UPDATE repository_profiles SET avatar_key = ?, avatar_type = ? WHERE user_id = ?').bind(uploaded, type, user.id).run();
  } catch (error) {
    await driveDelete(token, uploaded);
    throw error;
  }
  if (previous?.avatar_key && previous.avatar_key !== uploaded) await driveDelete(token, previous.avatar_key);
  return json(request, env, { ok:true, avatarUrl:`/api/users/${encodeURIComponent(user.id)}/avatar` });
}
async function readUserAvatar(request, env, userId) {
  const row = await env.DB.prepare('SELECT avatar_key, avatar_type FROM repository_profiles WHERE user_id = ?').bind(userId).first();
  if (!row?.avatar_key) return json(request, env, { error:'NOT_FOUND' }, 404);
  const object = await driveDownload(await driveAccessToken(env), row.avatar_key);
  return new Response(object.body, { headers:{ ...header(request, env), 'Content-Type':row.avatar_type, 'Cache-Control':'private, max-age=300' } });
}
async function personalProfile(request, env, user) {
  if (request.method === 'POST') {
    if (Number(request.headers.get('Content-Length') || 0) > 16000) return json(request, env, { error:'INVALID_PROFILE' }, 400);
    let body;
    try { body = await request.json(); } catch { return json(request, env, { error:'INVALID_PROFILE' }, 400); }
    if (!body || Array.isArray(body) || typeof body !== 'object' || Object.keys(body).some(key => !['nickname', 'bio', 'note'].includes(key))) return json(request, env, { error:'INVALID_PROFILE' }, 400);
    for (const [key, max] of [['nickname',32], ['bio',1000], ['note',2000]]) {
      if (key in body && (typeof body[key] !== 'string' || body[key].length > max || (key === 'nickname' && !body[key].trim()))) return json(request, env, { error:'INVALID_PROFILE' }, 400);
    }
    await env.DB.prepare('INSERT OR IGNORE INTO repository_profiles (user_id) VALUES (?)').bind(user.id).run();
    const fields = Object.keys(body);
    if (fields.length) await env.DB.prepare(`UPDATE repository_profiles SET ${fields.map(key => `${key} = ?`).join(', ')} WHERE user_id = ?`).bind(...fields.map(key => body[key].trim()), user.id).run();
  }
  const profile = await env.DB.prepare('SELECT nickname, bio, note, avatar_key FROM repository_profiles WHERE user_id = ?').bind(user.id).first();
  return json(request, env, { profile:{ nickname:profile?.nickname || '', bio:profile?.bio || '', note:profile?.note || '', avatarUrl:profile?.avatar_key ? `/api/users/${encodeURIComponent(user.id)}/avatar` : '', createdAt:user.createdAt || null } });
}
async function likedPosts(request, env, user, url) {
  const offset = Math.max(0, Math.min(1000000, Number.parseInt(url.searchParams.get('offset'), 10) || 0));
  const rows = await env.DB.prepare(`SELECT p.*, 1 AS liked,
    (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id) AS like_count,
    (SELECT COUNT(*) FROM saved_posts s WHERE s.post_id = p.id AND s.user_id = ?) AS saved
    FROM post_likes mine JOIN posts p ON p.id = mine.post_id
    WHERE mine.user_id = ? ORDER BY mine.created_at DESC, p.id DESC LIMIT 31 OFFSET ?`).bind(user.id, user.id, offset).all();
  const posts = (rows.results || []).slice(0,30).map(row => fromRow(row, user.id));
  return json(request, env, { posts, hasMore:(rows.results || []).length > 30 });
}
async function savedPosts(request, env, user) {
  const rows = await env.DB.prepare(`SELECT p.*, s.saved_at,
    (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id) AS like_count,
    (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id AND l.user_id = ?) AS liked,
    1 AS saved FROM saved_posts s JOIN posts p ON p.id = s.post_id
    WHERE s.user_id = ? ORDER BY s.saved_at DESC LIMIT 300`).bind(user.id, user.id).all();
  const posts = (rows.results || []).map(row => fromRow(row, user.id));
  return json(request, env, { posts:await addAttachments(env.DB, posts.map(post => post.id), posts) });
}
async function setSaved(request, env, user, postId) {
  const post = await env.DB.prepare('SELECT id FROM posts WHERE id = ?').bind(postId).first();
  if (!post) return json(request, env, { error:'NOT_FOUND' }, 404);
  if (request.method === 'POST') {
    const liked = await env.DB.prepare('SELECT 1 AS liked FROM post_likes WHERE user_id = ? AND post_id = ?').bind(user.id, postId).first();
    if (!liked) return json(request, env, { error:'LIKE_REQUIRED' }, 403);
    await env.DB.prepare('INSERT OR IGNORE INTO saved_posts (user_id, post_id, saved_at) VALUES (?, ?, ?)').bind(user.id, postId, now()).run();
  }
  else await env.DB.prepare('DELETE FROM saved_posts WHERE user_id = ? AND post_id = ?').bind(user.id, postId).run();
  return json(request, env, { saved:request.method === 'POST' });
}
async function readPostAvatar(request, env, postId) {
  const row = await env.DB.prepare('SELECT avatar_key, avatar_type FROM posts WHERE id = ?').bind(postId).first();
  if (!row?.avatar_key) return json(request, env, { error:'NOT_FOUND' }, 404);
  const object = await driveDownload(await driveAccessToken(env), row.avatar_key);
  return new Response(object.body, { headers:{ ...header(request, env), 'Content-Type':row.avatar_type } });
}
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status:204, headers:header(request, env) });
    const url = new URL(request.url);
    if (url.pathname === '/health') return json(request, env, { ok:true, service:'ideal-machine-repository' });
    if (url.pathname === '/api/image-proxy' && request.method === 'OPTIONS') return new Response(null, { status:204, headers:header(request, env) });
    if (url.pathname === '/api/image-proxy') return await proxyImageGeneration(request, env);
    const auth = await authorize(request, env);
    if (auth.error) return json(request, env, { error:auth.error }, auth.status);
    if (!env.DB) return json(request, env, { error:'STORAGE_UNAVAILABLE' }, 503);
    try {
      if (url.pathname === '/api/users/search' && request.method === 'GET') return await searchAccounts(request, env, auth.user, url);
      if (url.pathname === '/api/me/friends' && request.method === 'GET') return await listFriends(request, env, auth.user);
      if (url.pathname === '/api/me/chats' && request.method === 'GET') return await listChats(request, env, auth.user);
      const chatBlock = url.pathname.match(/^\/api\/me\/blocks\/([^/]{1,128})$/);
      if (chatBlock && ['POST','DELETE'].includes(request.method)) return await updateChatBlock(request, env, auth.user, decodeURIComponent(chatBlock[1]), request.method === 'POST');
      const chatMessages = url.pathname.match(/^\/api\/me\/chats\/([^/]{1,128})\/messages$/);
      if (chatMessages && request.method === 'GET') return await readChatMessages(request, env, auth.user, decodeURIComponent(chatMessages[1]));
      if (chatMessages && request.method === 'POST') return await sendChatMessage(request, env, auth.user, decodeURIComponent(chatMessages[1]));
      const chatStickerImage = url.pathname.match(/^\/api\/chat-stickers\/([a-f0-9-]{36})\/image$/i);
      if (chatStickerImage && request.method === 'GET') return await readChatStickerImage(request, env, auth.user, chatStickerImage[1]);
      if (url.pathname === '/api/me/chat-stickers' && request.method === 'GET') return await listChatStickers(request, env, auth.user);
      if (url.pathname === '/api/me/chat-stickers' && request.method === 'POST') return await uploadChatSticker(request, env, auth.user);
      const chatStickerGroup = url.pathname.match(/^\/api\/me\/chat-sticker-groups\/([^/]{1,72})$/);
      if (chatStickerGroup && request.method === 'PATCH') return await renameChatStickerGroup(request, env, auth.user, decodeURIComponent(chatStickerGroup[1]));
      if (chatStickerGroup && request.method === 'DELETE') return await deleteChatStickerGroup(request, env, auth.user, decodeURIComponent(chatStickerGroup[1]));
      const chatSticker = url.pathname.match(/^\/api\/me\/chat-stickers\/([a-f0-9-]{36})$/i);
      if (chatSticker && request.method === 'DELETE') return await deleteChatSticker(request, env, auth.user, chatSticker[1]);
      if (url.pathname === '/api/me/friends/requests' && request.method === 'POST') return await createFriendRequest(request, env, auth.user);
      const friendRequest = url.pathname.match(/^\/api\/me\/friends\/requests\/([a-f0-9-]{36})\/(accept|decline|cancel)$/);
      if (friendRequest && request.method === 'POST') return await updateFriendRequest(request, env, auth.user, friendRequest[1], friendRequest[2]);
      const friend = url.pathname.match(/^\/api\/me\/friends\/([a-f0-9-]{36})$/);
      if (friend && request.method === 'DELETE') return await removeFriend(request, env, auth.user, friend[1]);
      if (url.pathname === '/api/me/profile' && ['GET','POST'].includes(request.method)) return await personalProfile(request, env, auth.user);
      if (url.pathname === '/api/me/avatar' && request.method === 'POST') return await uploadProfileAvatar(request, env, auth.user);
      const userAvatar = url.pathname.match(/^\/api\/users\/([^/]{1,128})\/avatar$/);
      if (userAvatar && request.method === 'GET') return await readUserAvatar(request, env, decodeURIComponent(userAvatar[1]));
      if (url.pathname === '/api/me/likes' && request.method === 'GET') return await likedPosts(request, env, auth.user, url);
      if (url.pathname === '/api/me/saved' && request.method === 'GET') return await savedPosts(request, env, auth.user);
      if (url.pathname === '/api/posts' && request.method === 'GET') return await listPosts(request, env, auth.user, url);
      if (url.pathname === '/api/posts' && request.method === 'POST') return await createPost(request, env, auth.user);
      const post = url.pathname.match(/^\/api\/posts\/([a-f0-9-]{36})$/);
      if (post && request.method === 'GET') return await readPost(request, env, auth.user, post[1]);
      if (post && request.method === 'DELETE') return await deletePost(request, env, auth.user, post[1]);
      const avatar = url.pathname.match(/^\/api\/posts\/([a-f0-9-]{36})\/avatar$/);
      if (avatar && request.method === 'GET') return await readPostAvatar(request, env, avatar[1]);
      const saved = url.pathname.match(/^\/api\/posts\/([a-f0-9-]{36})\/save$/);
      if (saved && (request.method === 'POST' || request.method === 'DELETE')) return await setSaved(request, env, auth.user, saved[1]);
      const like = url.pathname.match(/^\/api\/posts\/([a-f0-9-]{36})\/like$/);
      if (like && request.method === 'POST') return await toggleLike(request, env, auth.user, like[1]);
      const attachment = url.pathname.match(/^\/api\/attachments\/([a-f0-9-]{36})$/);
      if (attachment && request.method === 'GET') return await readAttachment(request, env, auth.user, attachment[1]);
      return json(request, env, { error:'NOT_FOUND' }, 404);
    } catch (error) {
      console.error('repository_request_failed', error);
      if (error instanceof RepositoryError) return json(request, env, { error:error.code }, error.status);
      return json(request, env, { error:error instanceof TypeError ? 'INVALID_REQUEST' : 'SERVER_ERROR' }, error instanceof TypeError ? 400 : 500);
    }
  },
  async scheduled(controller, env) {
    if (env.DB) {
      const at = now();
      await purgeExpiredMessages(env, at);
      const cutoff = at - chatStickerUnusedMs;
      const candidates = await env.DB.prepare(`SELECT id,object_key FROM chat_stickers
        WHERE ((deleted_at IS NOT NULL) OR (deleted_at IS NULL AND last_used_at < ?))
        AND NOT EXISTS (SELECT 1 FROM direct_messages WHERE sticker_id = chat_stickers.id AND expires_at > ?)
        ORDER BY COALESCE(deleted_at,last_used_at) LIMIT 100`).bind(cutoff,at).all();
      const rows = candidates.results || [];
      if (rows.length) {
        const token = await driveAccessToken(env);
        for (const sticker of rows) {
          if (sticker.object_key && !await driveDelete(token,sticker.object_key)) continue;
          await env.DB.prepare(`DELETE FROM chat_stickers WHERE id = ? AND NOT EXISTS
            (SELECT 1 FROM direct_messages WHERE sticker_id = ? AND expires_at > ?)`)
            .bind(sticker.id,sticker.id,at).run();
        }
      }
    }
  }
};
