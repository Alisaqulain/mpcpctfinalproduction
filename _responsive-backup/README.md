# Responsive layout backup

Created before site-wide responsive CSS fixes.

## Files backed up

- `src/app/globals.css`
- `src/app/responsive.css` (added after backup — new file)
- `src/lib/viewport.js`
- `src/app/components/LayoutWrapper.jsx`
- `src/app/components/common/Header.jsx`
- `src/app/components/common/Footer.jsx`
- `src/app/components/HomePageClient.jsx`
- `src/app/typing/page.jsx`
- `src/app/keyboard/page.jsx`
- `src/app/example/page.jsx`
- `src/app/hindi-keyboard/page.jsx`
- `src/app/exam_mode/page.jsx`

Restore a file:

```powershell
Copy-Item "_responsive-backup\src\app\globals.css" "src\app\globals.css" -Force
```
