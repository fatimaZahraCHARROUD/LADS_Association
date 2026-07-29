import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { mlDisplay } from "../../utils/i18n";
import {
  Users,
  CalendarDays,
  Newspaper,
  ChevronDown,
  Lightbulb,
  Target,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Globe,
  Briefcase,
   ChevronLeft,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import "../../Styles/home.css";

export default function Home() {
const { t, i18n } = useTranslation();

const [slides, setSlides] = useState([]);
const [activeSlide, setActiveSlide] = useState(0);
const navigate = useNavigate();
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
const [openFaq, setOpenFaq] = useState(null);

useEffect(() => {

  const loadHero = async () => {

    try {

      const [
        events,
        activities,
        formations,
        news
      ] = await Promise.all([
        api.get("/events?isPublished=true"),
        api.get("/activities?isPublished=true"),
        api.get("/formations?isPublished=true"),
        api.get("/news?isPublished=true"),
      ]);


      const prepare = (items,type)=>{

        return items
        .sort(
          (a,b)=>
          new Date(b.createdAt)
          -
          new Date(a.createdAt)
        )
        .slice(0,2)
        .map(item=>({

          ...item,

          type

        }));

      };


      const allSlides = [
 ...prepare(events,"event"),
 ...prepare(activities,"activity"),
 ...prepare(formations,"formation"),
 ...prepare(news,"news"),
]
.sort(
(a,b)=>
new Date(b.createdAt)
-
new Date(a.createdAt)
)
.slice(0,8);


      setSlides(allSlides);


    } catch(err){

      console.log(err);

    }

  };


  loadHero();

},[]);
useEffect(() => {
  window.scrollTo({
    top: 0,
    behavior: "instant",
  });
}, []);
useEffect(()=>{

 if(!slides.length)
   return;


 const timer=setInterval(()=>{

   setActiveSlide(
     prev =>
     (prev+1)%slides.length
   );

 },5000);


 return ()=>clearInterval(timer);


},[slides]);

const prevSlide = () => {
  setActiveSlide((prev) =>
    prev === 0 ? slides.length - 1 : prev - 1
  );
};

const nextSlide = () => {
  setActiveSlide((prev) =>
    (prev + 1) % slides.length
  );
};

  return (
    <div className="home-page">

      {/* HERO */}
<section className="hero">

  {/* BACKGROUND IMAGE */}
  <div
    className="home-hero-background"
    style={{
      backgroundImage: slides.length 
        ? `url(${slides[activeSlide]?.coverImage || slides[activeSlide]?.image || slides[activeSlide]?.imgUrl || slides[activeSlide]?.thumbnail})` 
        : "",
    }}
  ></div>


  {/* BLACK OVERFLOW */}
  <div className="hero-black-overlay"></div>

{/* 
<button
  className="hero-arrow hero-arrow-left"
  onClick={prevSlide}
>
  <ChevronLeft size={30} />
</button>

<button
  className="hero-arrow hero-arrow-right"
  onClick={nextSlide}
>
  <ChevronRight size={30} />
</button> */}
  <div className="home-container hero-wrapper">

      <div className="home-hero-content">

      {slides.length > 0 && (
        <>
           


          <h1 className="hero-title">
            LADS Association  
          </h1> 
          <p style={{color:"white"}}>{t("home.hero.desc")}</p><br />
          {/* <div style={{"backgroundColor":"navy","color":"white", "borderRadius":"8px"}}>
          <h2> {mlDisplay(
              slides[activeSlide].title,
              i18n.language
            )}</h2>
            </div> */}

        </>
      )}

    </div>  


    


  </div>

<div className="hero-info">

      <div className="hero-dots">

        {slides.map((slide,index)=>(

          <button
            key={slide._id}
            className={`hero-dot ${index===activeSlide ? "active" : ""}`}
            onClick={()=>setActiveSlide(index)}
          />

        ))}

      </div>

    </div>
    
</section>




 {/* STATS */}
 
        <div className="hero-stats-wrapper">
          <div className="container">
            <div className="hero-stats-bar">

              <div className="stat-item">
                <h2>30+</h2>
                <p>{t("home.stats.members")}</p>
              </div>

              <div className="stat-item">
                <h2>15+</h2>
                <p>{t("home.stats.events")}</p>
              </div>

              <div className="stat-item">
                <h2>10+</h2>
                <p>{t("home.stats.formations")}</p>
              </div>

              <div className="stat-item">
                <h2>10+</h2>
                <p>{t("home.stats.activites")}</p>
              </div>

            </div>
          </div>
        </div>
      <div className="container">

        {/* ABOUT */}
        <section className="about-section">

          <div className="about-image">
            <div className="image-box"></div>
          </div>

          <div className="about-content">

            <span className="section-tag">
              {t("home.about.tag")}
            </span>

            <h2>
              {t("home.about.title")}
            </h2>

            <p>
              {t("home.about.desc")}
            </p>

            <div className="about-features">

              <div>
                <Sparkles />
                <span>
                  {t("home.about.features.innovation")}
                </span>
              </div>

              <div>
                <GraduationCap />
                <span>
                  {t("home.about.features.training")}
                </span>
              </div>

              <div>
                <Globe />
                <span>
                  {t("home.about.features.community")}
                </span>
              </div>

              <div>
                <Briefcase />
                <span>
                  {t("home.about.features.entrepreneurship")}
                </span>
              </div>

            </div>

          </div>

        </section>

        {/* VALUES */}
        <section className="values-section">

          <div className="section-header">

            <span className="section-tag">
              {t("home.values.tag")}
            </span>

            <h2>
              {t("home.values.title")}
            </h2>

            <p>
              {t("home.values.desc")}
            </p>

          </div>

          <div className="values-grid">

            <div className="value-card">
              <Lightbulb />

              <h3>
                {t("home.values.innovation.title")}
              </h3>

              <p>
                {t("home.values.innovation.desc")}
              </p>
            </div>

            <div className="value-card">
              <Users />

              <h3>
                {t("home.values.leadership.title")}
              </h3>

              <p>
                {t("home.values.leadership.desc")}
              </p>
            </div>

            <div className="value-card">
              <Target />

              <h3>
                {t("home.values.impact.title")}
              </h3>

              <p>
                {t("home.values.impact.desc")}
              </p>
            </div>

            <div className="value-card">
              <TrendingUp />

              <h3>
                {t("home.values.growth.title")}
              </h3>

              <p>
                {t("home.values.growth.desc")}
              </p>
            </div>

          </div>

        </section>

        {/* MAIN ACTIVITIES */}
        <section className="programs-section">

          <div className="section-header">

            <span className="section-tag">
              {t("home.activities.tag")}
            </span>

            <h2>
              {t("home.activities.title")}
            </h2>

            <p>
              {t("home.activities.desc")}
            </p>

          </div>

          <div className="programs-grid">

            {/* EVENTS */}
            <div className="activity-card">

              <div
                className="activity-image"
                style={{
                  backgroundImage:
                    "url('images/img2.png')",
                }}
              ></div>

              <div className="activity-content">

                <div className="activity-icon">
                  <CalendarDays size={22} />
                </div>

                <h3>
                  {t("home.activities.events.title")}
                </h3>

                <p>
                  {t("home.activities.events.desc")}
                </p>

                <button className="activity-btn"   onClick={() => navigate("/events")}>
                  {t("home.activities.events.button")}
                </button>

              </div>

            </div>

            {/* ACTIVITIES */}
            <div className="activity-card">

              <div
                className="activity-image"
                style={{
                  backgroundImage:
                    "url('images/home_act.png')",
                }}
              ></div>

              <div className="activity-content">

                <div className="activity-icon">
                  <Users size={22} />
                </div>

                <h3>
                  {t("home.activities.activities.title")}
                </h3>

                <p>
                  {t("home.activities.activities.desc")}
                </p>

                <button className="activity-btn"   onClick={() => navigate("/activities")}>
                  {t("home.activities.activities.button")}
                </button>

              </div>

            </div>

            {/* NEWS */}
            <div className="activity-card">

              <div
                className="activity-image"
                style={{
                  backgroundImage:
                    "url('images/news.jpeg')",
                }}
              ></div>

              <div className="activity-content">

                <div className="activity-icon">
                  <Newspaper size={22} />
                </div>

                <h3>
                  {t("home.activities.news.title")}
                </h3>

                <p>
                  {t("home.activities.news.desc")}
                </p>

                <button className="activity-btn"   onClick={() => navigate("/news")}>
                  {t("home.activities.news.button")}
                </button>

              </div>

            </div>

          </div>

        </section>

        {/* FORMATIONS */}
        <section className="formations-section">

          <div className="section-header">

            <span className="section-tag">
              {t("home.formations.tag")}
            </span>

            <h2>
              {t("home.formations.title")}
            </h2>

            <p>
              {t("home.formations.desc")}
            </p>

          </div>

          <div className="formations-slider">

            {/* LEFT */}
            <div
              className="formation-card side-card"
              style={{
                backgroundImage:
                  "url('images/for_left.jpeg')",
              }}
            >
              <div className="formation-layer">
                <h3>
                  {t("home.formations.entrepreneurship")}
                </h3>
              </div>
            </div>

            {/* CENTER */}
            <div
              className="formation-card main-card"
              style={{
                backgroundImage:
                  "url('images/leader.jpeg')",
              }}
            >
              <div className="formation-layer">

                <h3>
                  {t("home.formations.leadership.title")}
                </h3>

                <p>
                  {t("home.formations.leadership.desc")}
                </p>

                <button className="primary-btn"   onClick={() => navigate("/formations")}>
                  {t("home.formations.button")}
                </button>

              </div>
            </div>

            {/* RIGHT */}
            <div
              className="formation-card side-card"
              style={{
                backgroundImage:
                  "url('images/team.png')",
              }}
            >
              <div className="formation-layer">
                <h3>
                  {t("home.formations.innovation")}
                </h3>
              </div>
            </div>

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

        {/* TESTIMONIALS */}
        <section className="testimonials">

          <div className="section-header">

            <span className="section-tag">
              {t("home.testimonials.tag")}
            </span>

            <h2>
              {t("home.testimonials.title")}
            </h2>

          </div>

          <div className="testimonial-grid">

            <div className="testimonial-card">

              <p>
                “{t("home.testimonials.first.text")}”
              </p>

              <h4>
                — {t("home.testimonials.first.author")}
              </h4>

            </div>

            <div className="testimonial-card">

              <p>
                “{t("home.testimonials.second.text")}”
              </p>

              <h4>
                — {t("home.testimonials.second.author")}
              </h4>

            </div>

            <div className="testimonial-card">

              <p>
                “{t("home.testimonials.third.text")}”
              </p>

              <h4>
                — {t("home.testimonials.third.author")}
              </h4>

            </div>

          </div>

        </section>

        {/* CTA */}
        <section className="cta-section">

          <div className="cta-box">

            <h2>
              {t("home.cta.title")}
            </h2>

            <p>
              {t("home.cta.desc")}
            </p>

            <button className="primary-btn" onClick={()=>navigate("/membership")}>
              {t("home.cta.button")}
              <ArrowRight size={18} />
            </button>

          </div>

        </section>

      </div>

    </div>
  );
}