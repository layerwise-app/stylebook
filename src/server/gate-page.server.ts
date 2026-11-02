// The locked page. A plain string with no imports: it can't reach brand content,
// and no client bundle loads with it. System fonts and system colors only.

export type GateMessage = 'none' | 'wrong' | 'limited';

const messages: Record<GateMessage, string> = {
  none: 'This site is private. Enter the password to continue.',
  wrong: 'That password didn’t work. Try again.',
  limited: 'Too many tries. Wait a few minutes, then try again.'
};

const escapeAttribute = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

export function gatePageHtml(message: GateMessage, next: string) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Private site</title>
<style>
:root{color-scheme:light dark;font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
body{margin:0;min-height:100dvh;display:grid;place-items:center;padding:24px;box-sizing:border-box}
form{width:100%;max-width:320px}
p{margin:0 0 16px}
label{display:block;margin-bottom:4px;font-weight:600}
input,button{width:100%;box-sizing:border-box;font:inherit;padding:10px 12px;border:1px solid currentColor;border-radius:0;background:Canvas;color:CanvasText}
button{margin-top:12px;background:CanvasText;color:Canvas;border-color:CanvasText;cursor:pointer}
:focus-visible{outline:3px solid CanvasText;outline-offset:2px}
</style>
</head>
<body>
<form method="post" action="/unlock">
<p role="${message === 'none' ? 'status' : 'alert'}">${messages[message]}</p>
<input type="hidden" name="next" value="${escapeAttribute(next)}">
<label for="password">Password</label>
<input id="password" name="password" type="password" autocomplete="current-password" required autofocus>
<button type="submit">Continue</button>
</form>
</body>
</html>
`;
}
