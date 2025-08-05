/* src/lib/state/theme.state.svelte.js */

/* ── private reactive fields ── */
let _theme = $state(getInitial());

/* ── public read-only accessors ── */
export function getTheme() { return _theme; }

/* ── public actions that mutate state ── */
export function setTheme(newTheme) {
  _theme = newTheme;
}

export function toggleTheme() {
  _theme = _theme === 'dark' ? 'light' : 'dark';
}

function getInitial() {
   if (typeof localStorage !== "undefined" && localStorage.theme)
      return localStorage.theme;
   if (typeof window !== "undefined")
      return window.matchMedia("(prefers-color-scheme: dark)").matches
         ? "dark"
         : "light";
   return "light";
}

// Effect to sync theme changes to DOM and localStorage
$effect.root(() => {
	$effect(() => {
		if (typeof document !== 'undefined')
			document.documentElement.classList.toggle('dark', _theme === 'dark');
		if (typeof localStorage !== 'undefined') localStorage.theme = _theme;
	});
});
