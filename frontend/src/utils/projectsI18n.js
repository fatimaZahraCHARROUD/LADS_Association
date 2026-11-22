import i18n from "./tr";

// Translations of the public "Projects" page and of its menu link.
// They are merged into the existing translations (deep merge), so nothing
// in tr.js is replaced.
const bundles = {
  fr: {
    layout: { nav: { projects: "Projets" } },
    projects: {
      hero: {
        badge: "Projets L.A.D.S",
        title: "Nos Projets",
        desc: "Découvrez les initiatives et les projets menés par nos membres pour créer un impact durable.",
      },
      search: "Rechercher des projets...",
      filters: {
        all: "Tous",
        in_progress: "En cours",
        completed: "Terminés",
        planned: "À venir",
      },
      status: {
        planned: "À venir",
        in_progress: "En cours",
        completed: "Terminé",
        on_hold: "En pause",
      },
      progress: "Avancement",
      department: "Département",
      period: "Période",
      general: "L.A.D.S",
      loading: "Chargement...",
      empty: "Aucun projet trouvé.",
    },
  },
  en: {
    layout: { nav: { projects: "Projects" } },
    projects: {
      hero: {
        badge: "L.A.D.S Projects",
        title: "Our Projects",
        desc: "Discover the initiatives and projects led by our members to create lasting impact.",
      },
      search: "Search projects...",
      filters: {
        all: "All",
        in_progress: "In progress",
        completed: "Completed",
        planned: "Upcoming",
      },
      status: {
        planned: "Upcoming",
        in_progress: "In progress",
        completed: "Completed",
        on_hold: "On hold",
      },
      progress: "Progress",
      department: "Department",
      period: "Period",
      general: "L.A.D.S",
      loading: "Loading...",
      empty: "No projects found.",
    },
  },
  ar: {
    layout: { nav: { projects: "المشاريع" } },
    projects: {
      hero: {
        badge: "مشاريع L.A.D.S",
        title: "مشاريعنا",
        desc: "اكتشف المبادرات والمشاريع التي يقودها أعضاؤنا لإحداث أثر مستدام.",
      },
      search: "ابحث عن المشاريع...",
      filters: {
        all: "الكل",
        in_progress: "قيد التنفيذ",
        completed: "مكتملة",
        planned: "قادمة",
      },
      status: {
        planned: "قادم",
        in_progress: "قيد التنفيذ",
        completed: "مكتمل",
        on_hold: "متوقف مؤقتًا",
      },
      progress: "التقدّم",
      department: "القسم",
      period: "الفترة",
      general: "L.A.D.S",
      loading: "جارٍ التحميل...",
      empty: "لم يتم العثور على مشاريع.",
    },
  },
};

Object.entries(bundles).forEach(([lng, resources]) => {
  i18n.addResourceBundle(lng, "translation", resources, true, true);
});

export default i18n;
