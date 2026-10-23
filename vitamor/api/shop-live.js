const liveOrigin = 'https://vitamor-azarbio-crm.vitamor-azarbio.workers.dev';
export default function handler(req,res) {
 const incoming = new URL(req.url,'https://vitamor-fruits.vercel.app');
 const pathname = /^\/shop\/vitamor(?:\/|$)/.test(incoming.pathname) ? incoming.pathname : '/shop/vitamor';
 const target = new URL(pathname, liveOrigin);
 for (const [key,value] of incoming.searchParams) if (key !== 'preview') target.searchParams.append(key,value);
 res.statusCode = 307;
 res.setHeader('Cache-Control','no-store');
 res.setHeader('Location', target.href);
 res.end();
}
