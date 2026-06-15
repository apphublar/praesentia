export const marketingImages = {
  featured: {
    wedding: "/marketing/sections/featured-wedding.jpg",
    graduation: "/marketing/sections/featured-graduation.jpg",
    mavie: "/marketing/sections/featured-mavie.jpg",
    reveillon: "/marketing/sections/featured-reveillon.jpg"
  },
  hero: {
    birthday: "/marketing/hero/birthday.jpg",
    dinner: "/marketing/hero/dinner.jpg",
    wedding: "/marketing/hero/wedding-dance.jpg"
  },
  timeline: {
    cha: "/marketing/sections/mavie-cha.jpg",
    mavie1: "/marketing/sections/featured-mavie.jpg",
    years3: "/marketing/sections/mavie-garden-2.jpg",
    years5: "/marketing/sections/mavie-5years.jpg",
    years7: "/marketing/sections/mavie-7years.jpg",
    favorite: "/marketing/sections/mavie-favorite.jpg"
  },
  invitePreview: "/marketing/sections/mavie-invite-preview.svg"
} as const;

/** Datas de exemplo da jornada Mavie Fontinhas — convite → festa (+30d) → cápsula (+1 ano). */
export const mavieJourneyDates = {
  creating: "14 fev 2026",
  event: "16 mar 2026",
  capsule: "16 mar 2027"
} as const;
