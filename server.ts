import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { contentType } from 'https://deno.land/std@0.208.0/media_types/mod.ts';
import { extname } from 'https://deno.land/std@0.208.0/path/mod.ts';

interface RecordItem {
  level: string;
  username: string;
  time: number;
}

async function handler(request: Request): Promise<Response> {
  const kv = await Deno.openKv();

  const url = new URL(request.url);
  let pathname = url.pathname;

  if (pathname == '/') {
    pathname = '/index.html';
  }

  pathname = '.' + pathname;

  // DB
  if (pathname == './api/records' && request.method == 'GET') {
    const data: RecordItem[] = [];
    for await (const entry of kv.list({ prefix: ['records'] })) {
      data.push(entry.value as RecordItem);
    }

    kv.close();

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (pathname == './api/records' && request.method == 'POST') {
    const body = await request.json();

    if (!body.level || !body.username || !body.time) {
      return new Response("Missing request body", { status: 400 });
    }

    const newItem: RecordItem = { level: body.level, username: body.username, time: body.time };
    await kv.set(['records', body.level, body.username], newItem);

    kv.close();

    return new Response(JSON.stringify(newItem), {
      headers: { "Content-Type": "application/json" },
      status: 201 // Created
    });
  }

  if (pathname.startsWith('./api/records') && request.method == 'GET') {
    const keys = pathname.substring(13).split('/');
    const result = await kv.get(['records', keys[0], keys[1]]);

    if (result.value === null) {
      return new Response("Data not found", { status: 404 });
    }
    
    kv.close();

    return new Response(JSON.stringify(result.value), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (pathname.startsWith('./api/records') && request.method == 'PUT') {
    const body = await request.json();

    if (!body.level || !body.username || !body.time) {
      return new Response("Missing request body", { status: 400 });
    }

    const existing = await kv.get(['records', body.level, body.username]);
    if (existing.value && existing.value.time <= body.time) {
      return new Response({'rewritten': false}, {
        headers: { "Content-Type": "application/json" },
      });
    }

    let newItem: RecordItem = { level: body.level, username: body.username, time: body.time };
    await kv.set(['records', body.level, body.username], newItem);

    kv.close();

    return new Response({'rewritten': true}, {
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const file = await Deno.readFile(pathname);

    const extension = extname(pathname).toLowerCase();
    const mediaType = contentType(extension) || 'application/octet-stream';

    return new Response(file, {
      headers: {
        'content-type': mediaType,
      },
    });

  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      console.log(`Not found ${pathname}`);
      return new Response('404 Not Found', { status: 404 });
    }

    console.error(`Error serving ${pathname}: ${e}`);

    return new Response('500 Internal Server Error', { status: 500 });
  } finally {
    kv.close();
  }
}

console.log('Server listening');
Deno.serve(handler);
