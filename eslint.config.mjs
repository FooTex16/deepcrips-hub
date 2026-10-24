import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

/** Flat config native (ESLint 9/10) — tanpa FlatCompat. */
const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      /**
       * react-hooks v7 memperketat aturan ini, menandai pola React standar yang
       * sah: "fetch saat mount" (useEffect → load → setState) dan sinkronisasi
       * tema/hydration (setMounted(true)). Aturan ini baru & masih kasar; kami
       * turunkan ke "warn" agar tidak menggagalkan build, sambil tetap
       * melihat peringatan untuk ditinjau manual.
       */
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "out/**", "build/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
