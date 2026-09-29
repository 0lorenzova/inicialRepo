import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Finanzas",
    short_name: "Finanzas",
    description: "Organiza tus ingresos, gastos y sobres.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f8f5",
    theme_color: "#0b969f",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
