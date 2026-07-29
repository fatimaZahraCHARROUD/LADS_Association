import React, { useEffect, useState } from "react";

import {
  Target,
  Eye,
  Users,
  Lightbulb,
  Briefcase,
  HeartHandshake,
  ChevronDown,
} from "lucide-react";

import { useTranslation } from "react-i18next";

import "../../Styles/About.css";

import { api } from "../../services/api";

import { mlDisplay } from "../../utils/i18n";

export default function About() {

const { t, i18n } = useTranslation();

  const [info, setInfo] = useState([]);

  const [loading, setLoading] = useState(true);
const [openFaq, setOpenFaq] = useState(null);
  /* =========================
      FETCH DATA
  ========================= */
  useEffect(() => {

    const fetchData = async () => {

      try {

        const data =
          await api.get("/lads-info");

        setInfo(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (err) {

        console.error(
          "LADS INFO ERROR:",
          err
        );

      } finally {

        setLoading(false);

      }
    };

    fetchData();

  }, []);
useEffect(() => {
  window.scrollTo({
    top: 0,
    behavior: "instant",
  });
}, []);

const faqs = [
  {
    question: t("about.faq.items.0.q"),
    answer: t("about.faq.items.0.a"),
  },
  {
    question: t("about.faq.items.1.q"),
    answer: t("about.faq.items.1.a"),
  },
  {
    question: t("about.faq.items.2.q"),
    answer: t("about.faq.items.2.a"),
  },
  {
    question: t("about.faq.items.3.q"),
    answer: t("about.faq.items.3.a"),
  },
  {
    question: t("about.faq.items.4.q"),
    answer: t("about.faq.items.4.a"),
  },
  {
    question: t("about.faq.items.5.q"),
    answer: t("about.faq.items.5.a"),
  },
];
  /* =========================
      HELPERS
  ========================= */
  const getByKey = (key) =>
    info.find(
      (i) =>
        i.title?.en?.toLowerCase() === key
    );

  const story =
    getByKey("story");

  const mission =
    getByKey("mission");

  const vision =
    getByKey("vision");

  /* =========================
      OBJECTIVES
  ========================= */
  const objectives = [

    t("about.objectives.items.0"),

    t("about.objectives.items.1"),

    t("about.objectives.items.2"),

    t("about.objectives.items.3"),
  ];

  /* =========================
      DEPARTMENTS
  ========================= */
  const departments = [

    {
      icon: <Users size={28} />,
      title: t("about.departments.items.0.title"),
      text: t("about.departments.items.0.text"),
    },

    {
      icon: <Lightbulb size={28} />,
      title: t("about.departments.items.1.title"),
      text: t("about.departments.items.1.text"),
    },

    {
      icon: <Briefcase size={28} />,
      title: t("about.departments.items.2.title"),
      text: t("about.departments.items.2.text"),
    },

    {
      icon: <HeartHandshake size={28} />,
      title: t("about.departments.items.3.title"),
      text: t("about.departments.items.3.text"),
    },
  ];

  /* =========================
      TEAM
  ========================= */
  const team = [

    {
      name: "Fatima Zahra",
      role: t("about.team.roles.communication"),
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop",
    },

    {
      name: "Ayoub",
      role: t("about.team.roles.coordinator"),
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
    },

    {
      name: "Duaa",
      role: t("about.team.roles.social"),
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&auto=format&fit=crop",
    },
  ];

  /* =========================
      LOADING
  ========================= */
  if (loading) {

    return (

      <section className="about-page">

        <div className="container">

          <p>
            {t("about.loading")}
          </p>

        </div>

      </section>

    );
  }

  return (

    <section className="about-page">

      {/* HERO */}
      <div className="about-hero">

        <div className="container hero-content">

          <span className="hero-badge" style={{color:"#2563eb"}}>
            {t("about.hero.badge")}
          </span>

          <h1>
            {t("about.hero.title")}
          </h1>

          <p>
            {t("about.hero.desc")}
          </p>

        </div>

      </div>

      <div className="container">

        {/* STORY */}
        <section className="story-section">

          <div className="story-image">

            <img
              src="images/lads.png"
              alt="LADS Team"
            />

          </div>

          <div className="story-content">

            <span className="section-tag">
              {t("about.story")}
            </span>

            <h2>
              {
                mlDisplay(story?.title, i18n.language)
                ||
                t("about.story_title")
              }
            </h2>

            <p>
              {mlDisplay(story?.content, i18n.language)}
            </p>

          </div>

        </section>

        {/* MISSION / VISION */}
        <section className="mission-grid">

          <div className="mission-card">

            <div className="mission-icon">
              <Target size={30} />
            </div>

            <h3>
              {
                mlDisplay(mission?.title, i18n.language)
                ||
                t("about.mission")
              }
            </h3>

            <p>
              {mlDisplay(mission?.content, i18n.language)}
            </p>

          </div>

          <div className="mission-card">

            <div className="mission-icon">
              <Eye size={30} />
            </div>

            <h3>
              {
                mlDisplay(vision?.title, i18n.language)
                ||
                t("about.vision")
              }
            </h3>

            <p>
              {mlDisplay(vision?.content, i18n.language)}
            </p>

          </div>

        </section>

        {/* OBJECTIVES */}
        <section className="objectives-section">

          <div className="section-header">

            <span className="section-tag">
              {t("about.objectives.tag")}
            </span>

            <h2>
              {t("about.objectives.title")}
            </h2>

          </div>

          <div className="objectives-grid">

            {
              objectives.map((item, index) => (

                <div
                  className="objective-card"
                  key={index}
                >

                  <span>
                    0{index + 1}
                  </span>

                  <p>{item}</p>

                </div>

              ))
            }

          </div>

        </section>

        {/* DEPARTMENTS */}
        <section className="departments-section">

          <div className="section-header">

            <span className="section-tag">
              {t("about.departments.tag")}
            </span>

            <h2>
              {t("about.departments.title")}
            </h2>

          </div>

          <div className="departments-grid">

            {
              departments.map((dept, index) => (

                <div
                  className="department-card"
                  key={index}
                >

                  <div className="department-icon">
                    {dept.icon}
                  </div>

                  <h3>
                    {dept.title}
                  </h3>

                  <p>
                    {dept.text}
                  </p>

                </div>

              ))
            }

          </div>

        </section>

{/* FAQ */}
<section className="faq-section">

  <div className="section-header">

    <span className="section-tag">
      {t("about.faq.tag")}
    </span>

    <h2>
      {t("about.faq.title")}
    </h2>

  </div>

  <div className="faq-list">

    {faqs.map((faq, index) => (

      <div
        key={index}
        className={`faq-item ${
          openFaq === index ? "active" : ""
        }`}
      >

        <button
          className="faq-question"
          onClick={() =>
            setOpenFaq(
              openFaq === index
                ? null
                : index
            )
          }
        >

          <span>{faq.question}</span>

          <ChevronDown
            className={
              openFaq === index
                ? "rotate"
                : ""
            }
            size={22}
          />

        </button>

        <div
          className={`faq-answer ${
            openFaq === index
              ? "show"
              : ""
          }`}
        >

          <p>{faq.answer}</p>

        </div>

      </div>

    ))}

  </div>

</section>
       

      </div>

    </section>

  );
}