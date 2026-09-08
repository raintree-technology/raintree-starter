# Web design system

The reference serves teams and clients managing projects. It uses restrained
surfaces, readable typography, clear hierarchy, and native web interaction.
Apple HIG informs adaptation and clarity; it does not make this a native Apple app.

The shared implementation lives in `app/globals.css` and `components/ui`:

- Geist is self-hosted by Next.js after build-time font acquisition. System fonts
  provide fallbacks. Body copy uses 16px with relative spacing and line heights.
- Light and dark tokens define surface, text, border, focus, and destructive states.
  Muted text and input borders were strengthened for visibility. Meaning is also
  carried by labels, icons, and shapes.
- Buttons preserve native types; links remain links. Radix owns dialog focus,
  Escape handling, and accessible relationships. Forms retain browser validation.
- AuthField associates labels, descriptions, and errors. AuthLoadingButton exposes
  pending state and disables repeat submission. Sonner provides success/error feedback.
- EmptyState, loading skeletons, StatusBadge, tables, and RecoverableErrorBoundary
  demonstrate empty, loading, status, and failure/retry patterns in existing screens.
- Keyboard focus, skip navigation, forced colors, and reduced motion remain enabled.
  Layouts use responsive widths rather than fixed desktop canvases.

## Verification limits

Source checks do not establish accessibility conformance. Review keyboard use,
assistive technology, responsive layout, and visual states in the application
you deploy. See [release readiness](release-readiness.md) for candidate checks.
