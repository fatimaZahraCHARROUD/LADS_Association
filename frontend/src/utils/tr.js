// i18n.js

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      home: {
        hero: {
          title: "Empowering Youth to Become Leaders of Change",
          desc: "Your Journey to Growth, Leadership & Meaningful Networking Starts Here.",
          discover:"Discover More"
        },

        stats: {
          members: "Active Members",
          events: "Events",
          formations: "Formations",
          activites: "Activities",
        },

        about: {
          tag: "About L.A.D.S",
          title: "Building Future Leaders & Social Entrepreneurs",
          desc: "We believe youth are the driving force of positive change. Through leadership development, entrepreneurship, and social innovation, we help young people transform their ideas into impactful initiatives.",

          features: {
            innovation: "Innovation & Creativity",
            training: "Training & Mentorship",
            community: "Community Development",
            entrepreneurship: "Entrepreneurship",
          },
        },

        values: {
          tag: "Our Values",
          title: "What Drives Our Mission",
          desc: "Core principles shaping our community and initiatives.",

          innovation: {
            title: "Innovation",
            desc: "Encouraging creative thinking and problem-solving.",
          },

          leadership: {
            title: "Leadership",
            desc: "Developing confident and responsible leaders.",
          },

          impact: {
            title: "Impact",
            desc: "Building sustainable social and economic impact.",
          },

          growth: {
            title: "Growth",
            desc: "Empowering personal and professional development.",
          },
        },

        activities: {
          tag: "Main Activities",
          title: "Explore Our Community",
          desc: "Discover the events, activities, and news shaping the L.A.D.S community.",

          events: {
            title: "Events",
            desc: "Conferences, workshops, networking sessions, and inspiring leadership events for youth.",
            button: "View Events",
          },

          activities: {
            title: "Activities",
            desc: "Volunteer programs, social initiatives, collaborative projects, and youth engagement.",
            button: "Explore Activities",
          },

          news: {
            title: "News",
            desc: "Stay updated with the latest announcements, achievements, stories, and association updates.",
            button: "Read News",
          },
        },

        formations: {
          tag: "Our trainings",
          title: "Learn Through Modern Trainings",
          desc: "Leadership, entrepreneurship, innovation, soft skills, and practical workshops designed for ambitious youth.",

          entrepreneurship: "Entrepreneurship",

          leadership: {
            title: "Leadership & Soft Skills",
            desc: "Interactive workshops and real-world learning experiences.",
          },

          innovation: "Innovation Training",

          button: "Explore trainings",
        },

        testimonials: {
          tag: "Testimonials",
          title: "Voices From Our Community",

           first: {
      text: "Joining L.A.D.S during my studies at ENIAD was one of my best decisions. It helped me build leadership, teamwork, and public speaking skills while boosting my confidence.",
      author: "Association Member",
    },

    second: {
      text: "Being a responsible member at L.A.D.S strengthened my leadership, decision-making, and teamwork skills while allowing me to turn ideas into real projects.",
      author: "Association Responsible",
    },

    third: {
      text: "It was a pleasure to speak at a L.A.D.S webinar. The organization was excellent, and the members' enthusiasm made the experience truly inspiring.",
      author: "Webinar Guest Speaker",
    },
        },

        cta: {
          title: "Ready to Become a Future Leader?",
          desc: "Join a community of ambitious young people building impactful initiatives.",
          button: "Join L.A.D.S",
        },
      },
       layout: {

        logo_sub: "Association",

        join: "Join Us",
        login: "Login",

        nav: {
          home: "Home",
          about: "About",
          events: "Events",
          activities: "Activities",
          formations: "Trainings",
          news: "News",
          contact: "Contact",
        },

        footer: {

          desc:
            "Empowering leaders through innovation, learning and community impact.",

          location: "Morocco",

          navigation: "Navigation",

          community: "Community",

          membership: "Membership",

          partnerships: "Partnerships",

          careers: "Careers",

          follow: "Follow Us",

          rights: "All rights reserved.",

          terms: "Terms",

          privacy: "Privacy",

          cookies: "Cookies",
        },
      },
      // ADD THIS TO i18n.js

events: {

  hero: {

    badge: "L.A.D.S Events",

    title: "Our Events",

    desc:
      "Explore workshops, conferences, and youth initiatives designed to inspire leadership and innovation.",
  },

  search: "Search events...",

  filters: {

    all: "All",

    upcoming: "Upcoming",

    past: "Past",
  },

  status: {

    upcoming: "Upcoming",

    completed: "Past",
  },

  buttons: {

    details: "View Details",

    register: "Register",
  },

  empty: "No events found.",
},
// ENGLISH

about: {

  loading: "Loading About content...",

  hero: {

    badge: "About L.A.D.S",

    title: "Building Future Leaders",

    desc:
      "A youth association focused on leadership, innovation, social entrepreneurship, and human development.",
  },

  story: "Association Story",

  story_title: "Our Story",

  mission: "Mission",

  vision: "Vision",

  objectives: {

    tag: "Strategic Objectives",

    title: "What We Focus On",

    items: [

      "Empowering and training young people",

      "Building leadership and innovation skills",

      "Creating sustainable social impact",

      "Encouraging citizenship and responsibility",
    ],
  },

  departments: {

    tag: "Our Main Areas of Work",

    title: "Our Main Areas",

    items: [

      {
        title: "Human Development",

        text:
          "Leadership programs and youth empowerment.",
      },

      {
        title: "Innovation & Skills",

        text:
          "Developing creativity and future skills.",
      },

      {
        title: "Social Entrepreneurship",

        text:
          "Turning ideas into impactful projects.",
      },

      {
        title: "Social Action",

        text:
          "Community service and volunteering initiatives.",
      },
    ],
  },
  "faq": {
  "tag": "FAQ",
  "title": "Frequently Asked Questions",
  "items": [
    {
      "q": "What is LADS Association?",
      "a": "LADS is a Moroccan non-profit organization dedicated to empowering youth through leadership, education, innovation, entrepreneurship, and community service."
    },
    {
      "q": "Who can join LADS?",
      "a": "Students, graduates, young professionals, and anyone who shares our values and wishes to contribute to positive social impact can become members."
    },
    {
      "q": "What activities does LADS organize?",
      "a": "We organize training programs, workshops, conferences, networking events, competitions, social initiatives, and community projects throughout the year."
    },
    {
      "q": "How is LADS organized?",
      "a": "LADS is composed of Communication & Coordination, Media & Marketing, Human Resources, Information Technology, Events, Finance, Projects, and Statistics & Analytics departments."
    },
    {
      "q": "How can I participate in LADS activities?",
      "a": "You can register through our website, follow our social media pages, or become a member to receive updates and exclusive opportunities."
    },
    {
      "q": "How can organizations partner with LADS?",
      "a": "Organizations can collaborate with LADS through sponsorships, joint projects, training programs, mentorship, internships, and strategic partnerships."
    }
  ]
},

  team: {

    tag: "Team Members",

    title: "Meet Our Team",

    roles: {

      communication:
        "Communication Manager",

      coordinator:
        "Project Coordinator",

      social:
        "Social Media Manager",
    },
  },
},
activities: {

  hero: {

    badge: "L.A.D.S Activities",

    title: "Our Activities",

    desc:
      "Discover our educational, social, and leadership activities designed to empower youth and create positive impact.",
  },

  search: "Search activities...",

  filters: {

    all: "All",

    upcoming: "Upcoming",

    past: "Past",
  },

  status: {

    upcoming: "Upcoming",

    past: "Past",
  },

  buttons: {

    details: "View Details",
  },

  empty: "No activities found.",
},
formations: {

  hero: {
    badge: "L.A.D.S trainings",
    title: "Our trainings",
    desc: "Build your skills through practical workshops in leadership, digital, social impact and entrepreneurship."
  },

  search: "Search trainings...",

  filters: {
    all: "All",
    SoftSkills: "Soft Skills",
    digital: "Media & Digital",
    social: "Social",
    entrepreneurship: "Entrepreneurship"
  },

  categories: {
    SoftSkills: "Soft Skills",
    MediaAndDigital: "Media & Digital",
    Social: "Social",
    Entrepreneurship: "Entrepreneurship"
  },

  buttons: {
    details: "Details",
    join: "Join"
  }
},
news: {

  hero: {
    badge: "L.A.D.S News",
    title: "Latest News",
    desc:
      "Follow our latest updates, events, workshops, and community initiatives.",
  },

  search: "Search articles...",

  read: "Read Article",

  defaultTag: "News",

  empty: "No news found.",

  categories: {
    all: "All",
    urgent: "Urgent",
    general: "General",
    announcement: "Announcement",
    recruitment: "Recruitment",
  },
},
contact: {

  hero: {
    badge: "Contact L.A.D.S",
    title: "Contact Us",
    desc: "We are here to help you and collaborate on youth initiatives."
  },

  info: {
    title: "Let’s Connect",
    desc: "Have questions, ideas, or want to collaborate? Contact us anytime."
  },

  form: {
    title: "Send Message",
    first: "First Name",
    last: "Last Name",
    email: "Email",
    phone: "Phone",
    subject: "Subject",
    message: "Message...",
  },

  send: "Send Message",
  sending: "Sending...",

  success: "Message sent successfully!",

  errors: {
    required: "All fields are required",
    email: "Invalid email address",
    phone: "Invalid phone number",
    message: "Message must be at least 10 characters",
    generic: "Something went wrong"
  }
},
membership: {

  hero: {
    badge: "Join L.A.D.S",
    title: "Become a Member",
    desc: "Join a community of young leaders passionate about innovation, leadership, and social impact.",
  },

  why: {
    tag: "Why Join Us",
    title: "Grow, Lead & Create Impact",
    desc: "L.A.D.S provides opportunities, mentorship, and skills development.",
    points: {
      p1: "Leadership development opportunities",
      p2: "Real social and entrepreneurial projects",
      p3: "Professional networking & teamwork",
      p4: "Workshops, activities, and events",
    },
  },

  benefits: {
    tag: "Membership Benefits",
    title: "What You Will Get",

    training: {
      title: "Training Programs",
      text: "Access workshops, formations, and leadership sessions.",
    },

    networking: {
      title: "Networking",
      text: "Connect with ambitious youth and leaders.",
    },

    projects: {
      title: "Project Opportunities",
      text: "Participate in impactful projects.",
    },

    impact: {
      title: "Community Impact",
      text: "Create positive social change.",
    },
  },

  form: {
    tag: "Membership Request",
    title: "Apply Now",

    fullName: "Full Name",
    email: "Email Address",
    phone: "Phone Number",
    city: "City",
    motivation: "Tell us why you want to join...",

    submit: "Submit Request",
    sending: "Sending...",
  },

  errors: {
    required: "All fields are required",
    phone: "Invalid phone number",
    motivation: "Motivation must be at least 10 characters",
  },

  success: "Request sent successfully!",
},
login: {
  title: "Welcome Back",

  message:
    "If you are a member, please login to access your dashboard. Not a member yet?",

  join_link: "Join us here",

  email: "Email address",

  password: "Password",

  button: "Login",
}
    },
  },

  fr: {
    translation: {
      home: {
        hero: {
          title: "Donner aux jeunes les moyens de devenir des leaders du changement",
          desc:  "Votre parcours vers la croissance, le leadership et un réseau professionnel commence ici.",
          discover:"Découvrir plus"
        },

        stats: {
          members: "Membres Actifs",
          events: "Événements",
          formations: "Formations",
          activites: "Activites",
        },

        about: {
          tag: "À propos de L.A.D.S",
          title: "Construire les futurs leaders et entrepreneurs sociaux",
          desc: "Nous croyons que les jeunes sont la force motrice du changement positif. Grâce au leadership, à l’entrepreneuriat et à l’innovation sociale, nous aidons les jeunes à transformer leurs idées en initiatives à impact.",

          features: {
            innovation: "Innovation & Créativité",
            training: "Formation & Mentorat",
            community: "Développement Communautaire",
            entrepreneurship: "Entrepreneuriat",
          },
        },

        values: {
          tag: "Nos Valeurs",
          title: "Ce qui guide notre mission",
          desc: "Les principes fondamentaux qui façonnent notre communauté et nos initiatives.",

          innovation: {
            title: "Innovation",
            desc: "Encourager la créativité et la résolution de problèmes.",
          },

          leadership: {
            title: "Leadership",
            desc: "Développer des leaders responsables et confiants.",
          },

          impact: {
            title: "Impact",
            desc: "Créer un impact social et économique durable.",
          },

          growth: {
            title: "Développement",
            desc: "Favoriser l’évolution personnelle et professionnelle.",
          },
        },

        activities: {
          tag: "Activités Principales",
          title: "Découvrez notre communauté",
          desc: "Découvrez les événements, activités et actualités qui animent la communauté L.A.D.S.",

          events: {
            title: "Événements",
            desc: "Conférences, ateliers, réseautage et événements inspirants pour les jeunes.",
            button: "Voir les événements",
          },

          activities: {
            title: "Activités",
            desc: "Programmes de volontariat, initiatives sociales et projets collaboratifs.",
            button: "Explorer les activités",
          },

          news: {
            title: "Actualités",
            desc: "Restez informé des dernières annonces, réussites et nouveautés de l’association.",
            button: "Lire les actualités",
          },
        },

        formations: {
          tag: "Nos Formations",
          title: "Apprendre grâce à des formations modernes",
          desc: "Leadership, entrepreneuriat, innovation et ateliers pratiques pour les jeunes ambitieux.",

          entrepreneurship: "Entrepreneuriat",

          leadership: {
            title: "Leadership & Soft Skills",
            desc: "Des ateliers interactifs et des expériences d’apprentissage concrètes.",
          },

          innovation: "Formation Innovation",

          button: "Explorer les formations",
        },

        testimonials: {
          tag: "Témoignages",
          title: "Les voix de notre communauté",

           first: {
      text: "Rejoindre L.A.D.S pendant mes études à l'ENIAD a été une excellente décision. J'y ai développé mon leadership, mon esprit d'équipe et ma confiance pour parler en public.",
      author: "Membre de l'association",
    },

    second: {
      text: "Être responsable au sein de L.A.D.S m'a permis de développer mon leadership, de mieux gérer une équipe et de concrétiser des idées en projets réels.",
      author: "Responsable de l'association",
    },

    third: {
      text: "J'ai eu le plaisir d'intervenir lors d'un webinaire de L.A.D.S. L'organisation était excellente et les échanges avec les jeunes étaient très enrichissants.",
      author: "Invité du webinaire",
    },
        },

        cta: {
          title: "Prêt à devenir un futur leader ?",
          desc: "Rejoignez une communauté de jeunes ambitieux construisant des initiatives à impact.",
          button: "Rejoindre L.A.D.S",
        },
      },
        layout: {

        logo_sub: "Association",

        join: "Rejoindre",
        login: "Connexion",

        nav: {
          home: "Accueil",
          about: "À propos",
          events: "Événements",
          activities: "Activités",
          formations: "Formations",
          news: "Actualités",
          contact: "Contact",
        },

        footer: {

          desc:
            "Former des leaders à travers l’innovation, l’apprentissage et l’impact communautaire.",

          location: "Maroc",

          navigation: "Navigation",

          community: "Communauté",

          membership: "Adhésion",

          partnerships: "Partenariats",

          careers: "Carrières",

          follow: "Suivez-nous",

          rights: "Tous droits réservés.",

          terms: "Conditions",

          privacy: "Confidentialité",

          cookies: "Cookies",
        },
      },
      
      // FRENCH VERSION

events: {

  hero: {

    badge: "Événements L.A.D.S",

    title: "Nos Événements",

    desc:
      "Découvrez des ateliers, conférences et initiatives de jeunesse conçus pour inspirer le leadership et l’innovation.",
  },

  search: "Rechercher des événements...",

  filters: {

    all: "Tous",

    upcoming: "À venir",

    past: "Passés",
  },

  status: {

    upcoming: "À venir",

    completed: "Passé",
  },

  buttons: {

    details: "Voir détails",

    register: "S'inscrire",
  },

  empty: "Aucun événement trouvé.",
},
// FRENCH

about: {
"faq": {
  "tag": "FAQ",
  "title": "Questions Fréquemment Posées",
  "items": [
    {
      "q": "Qu'est-ce que l'association LADS ?",
      "a": "LADS est une association marocaine à but non lucratif dédiée au développement des jeunes à travers le leadership, l'éducation, l'innovation, l'entrepreneuriat et l'engagement citoyen."
    },
    {
      "q": "Qui peut rejoindre LADS ?",
      "a": "Les étudiants, diplômés, jeunes professionnels et toute personne partageant nos valeurs peuvent rejoindre l'association."
    },
    {
      "q": "Quelles activités organise LADS ?",
      "a": "Nous organisons des formations, ateliers, conférences, événements de networking, compétitions, initiatives sociales et projets communautaires."
    },
    {
      "q": "Comment est organisée l'association ?",
      "a": "LADS comprend les départements Communication & Coordination, Média & Marketing, Ressources Humaines, Informatique, Événementiel, Finance, Projets et Statistiques & Analyse."
    },
    {
      "q": "Comment participer aux activités de LADS ?",
      "a": "Vous pouvez vous inscrire via notre site web, suivre nos réseaux sociaux ou devenir membre."
    },
    {
      "q": "Comment devenir partenaire de LADS ?",
      "a": "Les organisations peuvent collaborer avec LADS à travers des partenariats, du sponsoring, des formations, des stages et des projets communs."
    }
  ]
},
  loading: "Chargement du contenu...",

  hero: {

    badge: "À propos de L.A.D.S",

    title: "Construire les Leaders de Demain",

    desc:
      "Une association de jeunes axée sur le leadership, l’innovation, l’entrepreneuriat social et le développement humain.",
  },

  story: "Histoire de l’Association",

  story_title: "Notre Histoire",

  mission: "Mission",

  vision: "Vision",

  objectives: {

    tag: "Objectifs Stratégiques",

    title: "Nos Axes d’Action",

    items: [

      "Former et autonomiser les jeunes",

      "Développer les compétences en leadership et innovation",

      "Créer un impact social durable",

      "Encourager la citoyenneté et la responsabilité",
    ],
  },

  departments: {

    tag: "Présentation des Domaines",

    title: "Nos Principaux Domaines de Travail",

    items: [

      {
        title: "Développement Humain",

        text:
          "Programmes de leadership et autonomisation des jeunes.",
      },

      {
        title: "Innovation & Compétences",

        text:
          "Développement de la créativité et des compétences du futur.",
      },

      {
        title: "Entrepreneuriat Social",

        text:
          "Transformer les idées en projets à impact.",
      },

      {
        title: "Action Sociale",

        text:
          "Service communautaire et initiatives bénévoles.",
      },
    ],
  },

  team: {

    tag: "Membres de l’Équipe",

    title: "Notre Équipe",

    roles: {

      communication:
        "Responsable Communication",

      coordinator:
        "Coordinateur de Projet",

      social:
        "Responsable Réseaux Sociaux",
    },
  },
},
activities: {

  hero: {

    badge: "Activités L.A.D.S",

    title: "Nos Activités",

    desc:
      "Découvrez nos activités éducatives, sociales et de leadership conçues pour renforcer les jeunes et créer un impact positif.",
  },

  search: "Rechercher des activités...",

  filters: {

    all: "Tous",

    upcoming: "À venir",

    past: "Passées",
  },

  status: {

    upcoming: "À venir",

    past: "Passée",
  },

  buttons: {

    details: "Voir détails",
  },

  empty: "Aucune activité trouvée.",
},
formations: {

  hero: {
    badge: "Formations L.A.D.S",
    title: "Nos Formations",
    desc: "Développez vos compétences à travers des ateliers pratiques en leadership, digital, impact social et entrepreneuriat."
  },

  search: "Rechercher des formations...",

  filters: {
    all: "Tous",
    SoftSkills: "Soft Skills",
    digital: "Media & Digital",
    social: "Social",
    entrepreneurship: "Entrepreneuriat"
  },

  categories: {
    SoftSkills: "Soft Skills",
    MediaAndDigital: "Media & Digital",
    Social: "Social",
    Entrepreneurship: "Entrepreneuriat"
  },

  buttons: {
    details: "Détails",
    join: "Rejoindre"
  }
},
news: {

  hero: {
    badge: "Actualités L.A.D.S",
    title: "Dernières Actualités",
    desc:
      "Suivez nos dernières mises à jour, événements, ateliers et initiatives communautaires.",
  },

  search: "Rechercher des articles...",

  read: "Lire l'article",

  defaultTag: "Actualité",

  empty: "Aucune actualité trouvée.",

  categories: {
    all: "Tous",
    urgent: "Urgent",
    general: "Général",
    announcement: "Annonce",
    recruitment: "Recrutement",
  },
},contact: {

  hero: {
    badge: "Contact L.A.D.S",
    title: "Contactez-nous",
    desc: "Nous sommes là pour vous aider et collaborer sur des projets jeunesse."
  },

  info: {
    title: "Restons en contact",
    desc: "Questions ou idées ? Contactez-nous à tout moment."
  },

  form: {
    title: "Envoyer un message",
    first: "Prénom",
    last: "Nom",
    email: "Email",
    phone: "Téléphone",
    subject: "Sujet",
    message: "Message...",
  },

  send: "Envoyer",
  sending: "Envoi...",

  success: "Message envoyé avec succès !",

  errors: {
    required: "Tous les champs sont obligatoires",
    email: "Email invalide",
    phone: "Numéro invalide",
    message: "Le message doit contenir au moins 10 caractères",
    generic: "Une erreur est survenue"
  }
},
membership: {

  hero: {
    badge: "Rejoindre L.A.D.S",
    title: "Devenir Membre",
    desc: "Rejoignez une communauté de jeunes leaders passionnés par l’innovation et l’impact social.",
  },

  why: {
    tag: "Pourquoi nous rejoindre",
    title: "Grandir, Diriger & Créer de l’impact",
    desc: "L.A.D.S offre des opportunités, du mentorat et du développement de compétences.",
    points: {
      p1: "Développement du leadership",
      p2: "Projets sociaux et entrepreneuriaux",
      p3: "Réseautage professionnel",
      p4: "Ateliers et activités",
    },
  },

  benefits: {
    tag: "Avantages",
    title: "Ce que vous allez obtenir",

    training: {
      title: "Formations",
      text: "Accès aux ateliers et formations.",
    },

    networking: {
      title: "Réseautage",
      text: "Connectez-vous avec des jeunes ambitieux.",
    },

    projects: {
      title: "Projets",
      text: "Participez à des projets impactants.",
    },

    impact: {
      title: "Impact",
      text: "Créez un changement positif.",
    },
  },

  form: {
    tag: "Demande d’adhésion",
    title: "Postuler maintenant",

    fullName: "Nom complet",
    email: "Adresse email",
    phone: "Numéro de téléphone",
    city: "Ville",
    motivation: "Pourquoi voulez-vous rejoindre ?",

    submit: "Envoyer",
    sending: "Envoi...",
  },

  errors: {
    required: "Tous les champs sont obligatoires",
    phone: "Numéro invalide",
    motivation: "Minimum 10 caractères",
  },

  success: "Demande envoyée avec succès !",
},
login: {
  title: "Bon retour",

  message:
    "Si vous êtes membre, veuillez vous connecter pour accéder à votre espace. Pas encore membre ?",

  join_link: "Rejoignez-nous ici",

  email: "Adresse e-mail",

  password: "Mot de passe",

  button: "Connexion",
}
    },

  },

  ar: {
    translation: {
      home: {
        hero: {
          title: "تمكين الشباب ليصبحوا قادة التغيير",
          desc: "رحلتك نحو النمو والقيادة وبناء شبكة علاقات قوية تبدأ من هنا.",
          
        },

        stats: {
          members: "عضو نشط",
          events: "فعالية",
          formations: "تكوين",
          activites: "نشاط",
        },

        about: {
          tag: "حول L.A.D.S",
          title: "بناء قادة المستقبل ورواد الأعمال الاجتماعيين",
          desc: "نؤمن أن الشباب هم القوة المحركة للتغيير الإيجابي. من خلال تطوير القيادة وريادة الأعمال والابتكار الاجتماعي، نساعد الشباب على تحويل أفكارهم إلى مبادرات مؤثرة.",

          features: {
            innovation: "الابتكار والإبداع",
            training: "التكوين والتأطير",
            community: "تنمية المجتمع",
            entrepreneurship: "ريادة الأعمال",
          },
        },

        values: {
          tag: "قيمنا",
          title: "ما الذي يقود رسالتنا",
          desc: "المبادئ الأساسية التي تشكل مجتمعنا ومبادراتنا.",

          innovation: {
            title: "الابتكار",
            desc: "تشجيع التفكير الإبداعي وحل المشكلات.",
          },

          leadership: {
            title: "القيادة",
            desc: "تطوير قادة واثقين ومسؤولين.",
          },

          impact: {
            title: "الأثر",
            desc: "بناء أثر اجتماعي واقتصادي مستدام.",
          },

          growth: {
            title: "التطور",
            desc: "تمكين التطور الشخصي والمهني.",
          },
        },

        activities: {
          tag: "الأنشطة الرئيسية",
          title: "اكتشف مجتمعنا",
          desc: "اكتشف الفعاليات والأنشطة والأخبار التي تشكل مجتمع L.A.D.S.",

          events: {
            title: "الفعاليات",
            desc: "مؤتمرات وورشات ولقاءات قيادية ملهمة للشباب.",
            button: "عرض الفعاليات",
          },

          activities: {
            title: "الأنشطة",
            desc: "برامج تطوعية ومبادرات اجتماعية ومشاريع شبابية.",
            button: "استكشاف الأنشطة",
          },

          news: {
            title: "الأخبار",
            desc: "تابع آخر المستجدات والإنجازات وأخبار الجمعية.",
            button: "قراءة الأخبار",
          },
        },

        formations: {
          tag: "تكويناتنا",
          title: "تعلم من خلال تكوينات حديثة",
          desc: "القيادة، ريادة الأعمال، الابتكار، والمهارات الشخصية من خلال ورشات عملية حديثة.",

          entrepreneurship: "ريادة الأعمال",

          leadership: {
            title: "القيادة والمهارات الشخصية",
            desc: "ورشات تفاعلية وتجارب تعليمية واقعية.",
          },

          innovation: "تكوين الابتكار",

          button: "استكشاف التكوينات",
        },

        testimonials: {
          tag: "آراء الأعضاء",
          title: "أصوات من مجتمعنا",

           first: {
      text: "كان انضمامي إلى L.A.D.S خلال دراستي في ENIAD من أفضل القرارات. ساعدتني الجمعية على تطوير القيادة والعمل الجماعي والتحدث أمام الجمهور وزادت ثقتي بنفسي.",
      author: "عضو في الجمعية",
    },

    second: {
      text: "كان تحملي لمسؤولية داخل L.A.D.S تجربة مميزة، طورت من خلالها مهارات القيادة واتخاذ القرار والعمل مع الفريق وتحويل الأفكار إلى مشاريع حقيقية.",
      author: "مسؤول في الجمعية",
    },

    third: {
      text: "سعدت بالمشاركة في إحدى ندوات L.A.D.S. كان التنظيم احترافيًا والأعضاء متحمسين، وكانت تجربة ملهمة ومثرية للغاية.",
      author: "ضيف الندوة",
    },
        },

        cta: {
          title: "هل أنت مستعد لتصبح قائد المستقبل؟",
          desc: "انضم إلى مجتمع من الشباب الطموحين لبناء مبادرات مؤثرة.",
          button: "انضم إلى L.A.D.S",
        },
      },
      layout: {

        logo_sub: "جمعية",

        join: "انضم إلينا",
        login: "تسجيل الدخول",

        nav: {
          home: "الرئيسية",
          about: "من نحن",
          events: "الفعاليات",
          activities: "الأنشطة",
          formations: "التكوينات",
          news: "الأخبار",
          contact: "اتصل بنا",
        },

        footer: {

          desc:
            "تمكين القادة من خلال الابتكار والتعلم والأثر المجتمعي.",

          location: "المغرب",

          navigation: "التنقل",

          community: "المجتمع",

          membership: "العضوية",

          partnerships: "الشراكات",

          careers: "الوظائف",

          follow: "تابعنا",

          rights: "جميع الحقوق محفوظة.",

          terms: "الشروط",

          privacy: "الخصوصية",

          cookies: "ملفات تعريف الارتباط",
        },
      },

events: {

  hero: {

    badge: "فعاليات L.A.D.S",

    title: "فعالياتنا",

    desc:
      "اكتشف الورشات والمؤتمرات والمبادرات الشبابية المصممة لإلهام القيادة والابتكار.",
  },

  search: "ابحث عن فعالية...",

  filters: {

    all: "الكل",

    upcoming: "القادمة",

    past: "السابقة",
  },

  status: {

    upcoming: "قادمة",

    completed: "سابقة",
  },

  buttons: {

    details: "عرض التفاصيل",

    register: "التسجيل",
  },

  empty: "لم يتم العثور على فعاليات.",
},

about: {

  loading: "جارٍ تحميل المحتوى...",
"faq": {
  "tag": "الأسئلة الشائعة",
  "title": "الأسئلة الأكثر شيوعًا",
  "items": [
    {
      "q": "ما هي جمعية LADS؟",
      "a": "LADS هي جمعية مغربية غير ربحية تهدف إلى تمكين الشباب من خلال القيادة والتعليم والابتكار وريادة الأعمال وخدمة المجتمع."
    },
    {
      "q": "من يمكنه الانضمام إلى الجمعية؟",
      "a": "يمكن للطلبة والخريجين والمهنيين الشباب وكل من يشاركنا قيمنا ورؤيتنا الانضمام إلى الجمعية."
    },
    {
      "q": "ما هي الأنشطة التي تنظمها الجمعية؟",
      "a": "ننظم دورات تدريبية وورش عمل ومؤتمرات وفعاليات للتواصل ومبادرات مجتمعية ومسابقات ومشاريع ذات أثر اجتماعي."
    },
    {
      "q": "كيف يتم تنظيم الجمعية؟",
      "a": "تتكون الجمعية من أقسام التواصل والتنسيق، الإعلام والتسويق، الموارد البشرية، تكنولوجيا المعلومات، الفعاليات، المالية، المشاريع، والإحصاء والتحليل."
    },
    {
      "q": "كيف يمكنني المشاركة في أنشطة الجمعية؟",
      "a": "يمكنك التسجيل عبر موقعنا الإلكتروني أو متابعة صفحاتنا على وسائل التواصل الاجتماعي أو الانضمام كعضو."
    },
    {
      "q": "كيف يمكن للمؤسسات الشراكة مع LADS؟",
      "a": "يمكن للمؤسسات التعاون مع الجمعية من خلال الرعاية، والمشاريع المشتركة، والتدريب، وبرامج الإرشاد، والتدريب المهني، والشراكات الاستراتيجية."
    }
  ]
},
  hero: {

    badge: "حول L.A.D.S",

    title: "بناء قادة المستقبل",

    desc:
      "جمعية شبابية تهتم بالقيادة والابتكار وريادة الأعمال الاجتماعية والتنمية البشرية.",
  },

  story: "قصة الجمعية",

  story_title: "قصتنا",

  mission: "الرسالة",

  vision: "الرؤية",

  objectives: {

    tag: "الأهداف الاستراتيجية",

    title: "ما الذي نركز عليه",

    items: [

      "تمكين وتكوين الشباب",

      "بناء مهارات القيادة والابتكار",

      "خلق أثر اجتماعي مستدام",

      "تشجيع المواطنة والمسؤولية",
    ],
  },

  departments: {

    tag: "نظرة على المجالات",

    title:"مجالات عملنا الرئيسية",

    items: [

      {
        title: "التنمية البشرية",

        text:
          "برامج القيادة وتمكين الشباب.",
      },

      {
        title: "الابتكار والمهارات",

        text:
          "تطوير الإبداع ومهارات المستقبل.",
      },

      {
        title: "ريادة الأعمال الاجتماعية",

        text:
          "تحويل الأفكار إلى مشاريع مؤثرة.",
      },

      {
        title: "العمل الاجتماعي",

        text:
          "خدمة المجتمع والمبادرات التطوعية.",
      },
    ],
  },

  team: {

    tag: "أعضاء الفريق",

    title: "تعرف على فريقنا",

    roles: {

      communication:
        "مسؤولة التواصل",

      coordinator:
        "منسق المشاريع",

      social:
        "مسؤولة وسائل التواصل الاجتماعي",
    },
  },
},
activities: {

  hero: {

    badge: "أنشطة L.A.D.S",

    title: "أنشطتنا",

    desc:
      "اكتشف أنشطتنا التعليمية والاجتماعية والقيادية المصممة لتمكين الشباب وخلق تأثير إيجابي.",
  },

  search: "ابحث عن نشاط...",

  filters: {

    all: "الكل",

    upcoming: "القادمة",

    past: "السابقة",
  },

  status: {

    upcoming: "قادمة",

    past: "سابقة",
  },

  buttons: {

    details: "عرض التفاصيل",
  },

  empty: "لم يتم العثور على أنشطة.",
},
formations: {

  hero: {
    badge: "تكوينات L.A.D.S",
    title: "تكويناتنا",
    desc: "طوّر مهاراتك من خلال ورشات عملية في القيادة، الرقمنة، التأثير الاجتماعي وريادة الأعمال."
  },

  search: "ابحث عن تكوين...",

  filters: {
    all: "الكل",
    SoftSkills: "المهارات الشخصية",
  digital: "الإعلام والرقمنة",
  social: "اجتماعي",
  entrepreneurship: "ريادة الأعمال"
  },

  categories: {
     SoftSkills: "المهارات الشخصية",
  MediaAndDigital: "الإعلام والرقمنة",
  Social: "اجتماعي",
  Entrepreneurship: "ريادة الأعمال"
  },

  buttons: {
    details: "التفاصيل",
    join: "انضم"
  }
},
news: {

  hero: {
    badge: "أخبار L.A.D.S",
    title: "آخر الأخبار",
    desc:
      "تابع آخر التحديثات والفعاليات وورش العمل والمبادرات المجتمعية.",
  },

  search: "ابحث عن المقالات...",

  read: "قراءة المقال",

  defaultTag: "خبر",

  empty: "لا توجد أخبار.",

  categories: {
    all: "الكل",
    urgent: "عاجل",
    general: "عام",
    announcement: "إعلان",
    recruitment: "التوظيف",
  }
},
contact: {

  hero: {
    badge: "اتصال L.A.D.S",
    title: "اتصل بنا",
    desc: "نحن هنا لمساعدتك والتعاون في المبادرات الشبابية."
  },

  info: {
    title: "تواصل معنا",
    desc: "لديك أسئلة أو أفكار؟ تواصل معنا في أي وقت."
  },

  form: {
    title: "إرسال رسالة",
    first: "الاسم الأول",
    last: "الاسم الأخير",
    email: "البريد الإلكتروني",
    phone: "الهاتف",
    subject: "الموضوع",
    message: "الرسالة...",
  },

  send: "إرسال",
  sending: "جارٍ الإرسال...",

  success: "تم إرسال الرسالة بنجاح!",

  errors: {
    required: "جميع الحقول مطلوبة",
    email: "بريد إلكتروني غير صالح",
    phone: "رقم هاتف غير صالح",
    message: "الرسالة يجب أن تكون 10 أحرف على الأقل",
    generic: "حدث خطأ ما"
  }
},membership: {

  hero: {
    badge: "انضم إلى L.A.D.S",
    title: "كن عضواً",
    desc: "انضم إلى مجتمع من الشباب القادة المهتمين بالابتكار والتأثير الاجتماعي.",
  },

  why: {
    tag: "لماذا تنضم إلينا",
    title: "تطور، قد، واصنع تأثيراً",
    desc: "توفر L.A.D.S فرصاً وتدريباً وتطوير المهارات.",
    points: {
      p1: "تطوير القيادة",
      p2: "مشاريع اجتماعية حقيقية",
      p3: "شبكات مهنية",
      p4: "ورشات وأنشطة",
    },
  },

  benefits: {
    tag: "مزايا العضوية",
    title: "ما الذي ستحصل عليه",

    training: {
      title: "برامج تدريبية",
      text: "الوصول إلى الورشات والدورات.",
    },

    networking: {
      title: "التواصل",
      text: "تواصل مع شباب طموحين.",
    },

    projects: {
      title: "المشاريع",
      text: "شارك في مشاريع مؤثرة.",
    },

    impact: {
      title: "التأثير",
      text: "اصنع تغييراً إيجابياً.",
    },
  },

  form: {
    tag: "طلب العضوية",
    title: "تقديم الطلب",

    fullName: "الاسم الكامل",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    city: "المدينة",
    motivation: "لماذا تريد الانضمام؟",

    submit: "إرسال",
    sending: "جارٍ الإرسال...",
  },

  errors: {
    required: "جميع الحقول مطلوبة",
    phone: "رقم غير صالح",
    motivation: "يجب أن لا يقل عن 10 أحرف",
  },

  success: "تم إرسال الطلب بنجاح!",
},
login: {
  title: "مرحبًا بعودتك",

  message:
    "إذا كنت عضوًا، يرجى تسجيل الدخول للوصول إلى لوحة التحكم. لست عضوًا بعد؟",

  join_link: "انضم إلينا هنا",

  email: "البريد الإلكتروني",

  password: "كلمة المرور",

  button: "تسجيل الدخول",
}
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "fr",
  fallbackLng: "fr",

  interpolation: {
    escapeValue: false,
  },
});

export default i18n;