import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { contentType } from 'https://deno.land/std@0.208.0/media_types/mod.ts';
import { extname } from 'https://deno.land/std@0.208.0/path/mod.ts';

async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  let pathname = url.pathname;

  if (pathname == '/') {
    pathname = '/index.html';
  }

  pathname = '.' + pathname;

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
  }
}

console.log('Server listening');
Deno.serve(handler);
