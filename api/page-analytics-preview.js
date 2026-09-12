import baseHandler from './page-meta.js';

function widenClarityCsp(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace("default-src 'self'", "default-src 'self' https://*.clarity.ms https://c.bing.com")
    .replace("https://www.clarity.ms", "https://www.clarity.ms https://*.clarity.ms https://c.bing.com")
    .replace("https://*.clarity.ms", "https://*.clarity.ms https://c.bing.com");
}

export default function handler(req, res) {
  const originalSetHeader = res.setHeader.bind(res);
  res.setHeader = (name, value) => {
    if (String(name).toLowerCase() === 'content-security-policy') {
      value = widenClarityCsp(value);
    }
    return originalSetHeader(name, value);
  };
  return baseHandler(req, res);
}
