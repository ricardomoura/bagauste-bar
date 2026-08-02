@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto,
    Helvetica, Arial, sans-serif;
}

html {
  -webkit-text-size-adjust: 100%;
}

body {
  @apply bg-brand-cream text-brand-navy antialiased;
}

/* Barra de scroll horizontal discreta nas categorias */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Gradiente da marca (sol do Douro) */
.brand-gradient {
  background: linear-gradient(135deg, #f15a22 0%, #f7941d 100%);
}

@layer components {
  .input {
    @apply w-full rounded-lg border border-brand-navy/15 px-3 py-2 text-brand-navy outline-none focus:border-brand-orange;
  }
  .btn-primary {
    @apply rounded-lg brand-gradient px-4 py-2 font-bold text-white transition hover:opacity-90 disabled:opacity-60;
  }
  .btn-ghost {
    @apply rounded-lg px-4 py-2 font-semibold text-brand-navy transition hover:bg-brand-sand;
  }
}
