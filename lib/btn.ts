import plugin from "tailwindcss/plugin";

export default plugin(({ addComponents }) => {
  addComponents({
    ".btn": {
      display: "inline-flex",
      whiteSpace: "nowrap",

      "font-size": "var(--font-size-2)",
      "font-weight": "var(--font-weight-7)",

      paddingInline: "var(--size-3)",
      paddingBlock: "var(--size-1)",

      color: "var(--color-link)",
      border: "var(--border-size-2) solid var(--color-link)",
      backgroundColor: "transparent",
      borderRadius: "var(--radius-2)",

      ".btn:is(:hover, :focus)": {
        cursor: "pointer",
        color: "var(--blue-0)",
        backgroundColor: "var(--color-link)",
      },

      ".btn:active:not(:focus-visible)": {
        position: "relative",
      },
    },

    "@media (prefers-reduced-motion: no-preference)": {
      "&:focus": {
        transition: "outline-offset .25s ease",
      },
      "&:focus:not(:active)": {
        "outline-offset": "5px",
      },
    },
  });
});
