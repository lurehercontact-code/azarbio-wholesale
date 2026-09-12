import baseHandler from './page-meta.js';

// Temporary diagnostic wrapper for the analytics-preview branch only.
// We intentionally remove CSP on this preview so we can isolate whether
// Microsoft Clarity is being blocked by the site's security policy.
// Production is untouched.
export default function handler(req, res) {
  const originalSetHeader = res.setHeader.bind(res);
  res.setHeader = (name, value) => {
    if (String(name).toLowerCase() === 'content-security-policy') {
      return res;
    }
    return originalSetHeader(name, value);
  };
  return baseHandler(req, res);
}
