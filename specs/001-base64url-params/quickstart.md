# Quickstart: Testing Base64URL-Encoded URL Parameters

## Generating a Test URL

To create a URL with base64url-encoded params, run this snippet in the browser console or Node.js:

```javascript
// Encode a value as base64url (no padding)
function toBase64Url(str) {
  return btoa(str)          // standard base64
    .replace(/\+/g, '-')    // + → -
    .replace(/\//g, '_')    // / → _
    .replace(/=+$/, '');    // strip padding
}

const schema = JSON.stringify({
  type: 'object',
  properties: {
    name: { type: 'string', title: 'Name' },
    email: { type: 'string', title: 'Email', "x-sensitive": true }
  },
  required: ['name']
});

const key = JSON.stringify({
  kty: 'RSA',
  // ... your JWK public key fields
});

const url = `http://localhost:5173/?schema=${toBase64Url(schema)}&key=${toBase64Url(key)}`;
console.log(url);
```

## Verification Checklist

| Scenario | Expected Result |
|----------|----------------|
| Valid `?schema=<base64url>` | Schema field pre-populated; Step 1 hidden |
| Valid `?key=<base64url>` | Key field pre-populated; Step 3 hidden |
| Both valid | Both fields pre-populated; Steps 1 and 3 hidden |
| Invalid base64url in `?schema=` | Red error alert: "URL schema parameter is invalid"; schema field empty |
| Invalid base64url in `?key=` | Red error alert: "URL key parameter is invalid"; key field empty |
| Valid base64url but non-JSON in `?schema=` | Red error alert; schema field empty |
| No URL params | Form loads normally; no errors |
| `?schema=` present but empty | No error; schema field empty; Step 1 shown |

## Manual Test: Invalid Base64URL

Append `?schema=!!!invalid!!!` to the URL. The `!` character is not valid base64url and should trigger the error alert.

## Migration Note

**Breaking change**: Previously shared URLs using plain-text (percent-encoded) JSON in `?schema=` or `?key=` will no longer work. To regenerate a shareable URL, encode the JSON values using the `toBase64Url()` function above.
