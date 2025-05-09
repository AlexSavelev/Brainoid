import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { contentType } from 'https://deno.land/std@0.208.0/media_types/mod.ts';
import { extname } from 'https://deno.land/std@0.208.0/path/mod.ts';

interface RecordItem {
  level: string;
  username: string;
  duration: number;
  timestamp: number;
}

function generateID(): string {
  return crypto.randomUUID();
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

    if (!body.level || !body.username || !(body.duration || body.duration === 0) || !body.timestamp) {
      return new Response("Missing request body", { status: 400 });
    }

    const newItem: RecordItem = {
      level: body.level,
      username: body.username,
      duration: body.duration,
      timestamp: body.timestamp
    };
    await kv.set(['records', body.level, generateID()], newItem);

    kv.close();

    return new Response(JSON.stringify(newItem), {
      headers: { "Content-Type": "application/json" },
      status: 201 // Created
    });
  }

  if (pathname == './api/records/clear' && request.method == 'POST') {
    const keys = kv.list({ prefix: ['records'] });

    for await (const entry of keys) {
      await kv.delete(entry.key);
    }

    kv.close();
    return new Response(JSON.stringify({}), {
      headers: { "Content-Type": "application/json" },
      status: 202 // Cleared
    });
  }

  if (pathname.startsWith('./api/records') && request.method == 'GET') {
    const key = pathname.substring(13);
    const result = await kv.get(['records', key]);

    if (result.value === null) {
      kv.close();
      return new Response("Data not found", { status: 404 });
    }
    
    kv.close();
    return new Response(JSON.stringify(result.value), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (pathname.startsWith('./api/records') && request.method == 'POST') {
    const body = await request.json();

    if (!body.level || !body.username || !(body.duration || body.duration === 0) || !body.timestamp) {
      return new Response("Missing request body", { status: 400 });
    }

    const newItem: RecordItem = {
      level: body.level,
      username: body.username,
      duration: body.duration,
      timestamp: body.timestamp
    };
    await kv.set(['records', body.level, generateID()], newItem);
    kv.close();

    return new Response(JSON.stringify(newItem), {
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
