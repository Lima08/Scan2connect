/**
 * GDG Connect — Tailwind CSS config
 * Maps design tokens (CSS custom properties) to Tailwind utility classes.
 * Requires tokens.css to be loaded before this script runs.
 */
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        "on-primary": "var(--color-on-primary)",
        "primary-container": "var(--color-primary-container)",
        "on-primary-container": "var(--color-on-primary-container)",
        "primary-fixed": "var(--color-primary-fixed)",
        "on-primary-fixed": "var(--color-on-primary-fixed)",
        "primary-fixed-dim": "var(--color-primary-fixed-dim)",
        "on-primary-fixed-variant": "var(--color-on-primary-fixed-variant)",
        "inverse-primary": "var(--color-inverse-primary)",
        "surface-tint": "var(--color-surface-tint)",

        secondary: "var(--color-secondary)",
        "on-secondary": "var(--color-on-secondary)",
        "secondary-container": "var(--color-secondary-container)",
        "on-secondary-container": "var(--color-on-secondary-container)",
        "secondary-fixed": "var(--color-secondary-fixed)",
        "on-secondary-fixed": "var(--color-on-secondary-fixed)",
        "secondary-fixed-dim": "var(--color-secondary-fixed-dim)",
        "on-secondary-fixed-variant": "var(--color-on-secondary-fixed-variant)",

        tertiary: "var(--color-tertiary)",
        "on-tertiary": "var(--color-on-tertiary)",
        "tertiary-container": "var(--color-tertiary-container)",
        "on-tertiary-container": "var(--color-on-tertiary-container)",
        "tertiary-fixed": "var(--color-tertiary-fixed)",
        "on-tertiary-fixed": "var(--color-on-tertiary-fixed)",
        "tertiary-fixed-dim": "var(--color-tertiary-fixed-dim)",
        "on-tertiary-fixed-variant": "var(--color-on-tertiary-fixed-variant)",

        error: "var(--color-error)",
        "on-error": "var(--color-on-error)",
        "error-container": "var(--color-error-container)",
        "on-error-container": "var(--color-on-error-container)",

        background: "var(--color-background)",
        "on-background": "var(--color-on-background)",
        surface: "var(--color-surface)",
        "on-surface": "var(--color-on-surface)",
        "on-surface-variant": "var(--color-on-surface-variant)",
        "surface-bright": "var(--color-surface-bright)",
        "surface-dim": "var(--color-surface-dim)",
        "surface-variant": "var(--color-surface-variant)",
        "surface-container-lowest": "var(--color-surface-container-lowest)",
        "surface-container-low": "var(--color-surface-container-low)",
        "surface-container": "var(--color-surface-container)",
        "surface-container-high": "var(--color-surface-container-high)",
        "surface-container-highest": "var(--color-surface-container-highest)",
        "inverse-surface": "var(--color-inverse-surface)",
        "inverse-on-surface": "var(--color-inverse-on-surface)",

        outline: "var(--color-outline)",
        "outline-variant": "var(--color-outline-variant)",

        "google-blue": "var(--color-google-blue)",
        "google-red": "var(--color-google-red)",
        "google-green": "var(--color-google-green)",
        "google-yellow": "var(--color-google-yellow)",
      },
      borderRadius: {
        DEFAULT: "var(--radius-default)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "var(--radius-full)",
      },
      spacing: {
        xs: "var(--space-xs)",
        sm: "var(--space-sm)",
        base: "var(--space-base)",
        md: "var(--space-md)",
        lg: "var(--space-lg)",
        xl: "var(--space-xl)",
        gutter: "var(--space-gutter)",
        "margin-mobile": "var(--space-margin-mobile)",
        "margin-desktop": "var(--space-margin-desktop)",
      },
      fontFamily: {
        "headline-lg": ["var(--font-headline)"],
        "headline-lg-mobile": ["var(--font-headline)"],
        "headline-md": ["var(--font-headline)"],
        "headline-sm": ["var(--font-headline)"],
        "title-lg": ["var(--font-body)"],
        "body-lg": ["var(--font-body)"],
        "body-md": ["var(--font-body)"],
        "label-lg": ["var(--font-body)"],
        "label-md": ["var(--font-body)"],
      },
      fontSize: {
        "headline-lg": [
          "var(--text-headline-lg-size)",
          {
            lineHeight: "var(--text-headline-lg-line)",
            letterSpacing: "var(--text-headline-lg-tracking)",
            fontWeight: "var(--text-headline-lg-weight)",
          },
        ],
        "headline-lg-mobile": [
          "var(--text-headline-lg-mobile-size)",
          {
            lineHeight: "var(--text-headline-lg-mobile-line)",
            letterSpacing: "var(--text-headline-lg-tracking)",
            fontWeight: "var(--text-headline-lg-weight)",
          },
        ],
        "headline-md": [
          "var(--text-headline-md-size)",
          {
            lineHeight: "var(--text-headline-md-line)",
            fontWeight: "var(--text-headline-md-weight)",
          },
        ],
        "headline-sm": [
          "var(--text-headline-sm-size)",
          {
            lineHeight: "var(--text-headline-sm-line)",
            fontWeight: "var(--text-headline-sm-weight)",
          },
        ],
        "headline-sm-mobile": [
          "var(--text-headline-sm-size)",
          {
            lineHeight: "var(--text-headline-sm-line)",
            fontWeight: "var(--text-headline-sm-weight)",
          },
        ],
        "title-lg": [
          "var(--text-title-lg-size)",
          {
            lineHeight: "var(--text-title-lg-line)",
            fontWeight: "var(--text-title-lg-weight)",
          },
        ],
        "body-lg": [
          "var(--text-body-lg-size)",
          { lineHeight: "var(--text-body-lg-line)", fontWeight: "400" },
        ],
        "body-md": [
          "var(--text-body-md-size)",
          { lineHeight: "var(--text-body-md-line)", fontWeight: "400" },
        ],
        "label-lg": [
          "var(--text-label-lg-size)",
          {
            lineHeight: "var(--text-label-lg-line)",
            letterSpacing: "var(--text-label-lg-tracking)",
            fontWeight: "var(--text-label-lg-weight)",
          },
        ],
        "label-md": [
          "var(--text-label-md-size)",
          {
            lineHeight: "var(--text-label-md-line)",
            fontWeight: "var(--text-label-md-weight)",
          },
        ],
      },
      maxWidth: {
        layout: "var(--layout-max-width)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
      },
    },
  },
};
