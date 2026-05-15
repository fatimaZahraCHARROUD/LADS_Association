import React from "react";
import {
  Users,
  CalendarDays,
  Newspaper,
  Lightbulb,
  Target,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Globe,
  Briefcase,
  GraduationCap,
  HeartHandshake,
} from "lucide-react";

import "../../Styles/home.css";

export default function Home() {
  return (
    <div className="home-page">
{/* HERO */}
<section className="hero">
  <div className="hero-overlay"></div>

  <div className="container hero-wrapper">
    <div className="hero-content">

    

      <h1>
        Empowering Youth to Become
        <span> Leaders of Change</span>
      </h1>

      <p>
        L.A.D.S is a youth association dedicated to leadership,
        entrepreneurship, and social innovation — turning ideas into
        real-world impact projects.
      </p> <br /> <br /> <br />

      {/* <div className="hero-buttons">
        <button className="primary-btn">
          Join L.A.D.S
          <ArrowRight size={18} />
        </button>

        <button className="secondary-btn">
          Explore Activities
        </button>
      </div> */}

    </div>
  </div>

  {/* STATS */}
  <div className="hero-stats-wrapper">
    <div className="container">
      <div className="hero-stats-bar">

        <div className="stat-item">
          <h2>200+</h2>
          <p>Active Members</p>
        </div>

        <div className="stat-item">
          <h2>50+</h2>
          <p>Events</p>
        </div>

        <div className="stat-item">
          <h2>30+</h2>
          <p>Projects</p>
        </div>

        <div className="stat-item">
          <h2>10+</h2>
          <p>Partners</p>
        </div>

      </div>
    </div>
  </div>
</section>

      <div className="container">

        {/* ABOUT */}
        <section className="about-section">

          <div className="about-image">
            <div className="image-box"></div>
          </div>

          <div className="about-content">

            <span className="section-tag">
              About L.A.D.S
            </span>

            <h2>
              Building Future Leaders &
              Social Entrepreneurs
            </h2>

            <p>
              We believe youth are the driving force
              of positive change. Through leadership
              development, entrepreneurship, and
              social innovation, we help young people
              transform their ideas into impactful
              initiatives.
            </p>

            <div className="about-features">

              <div>
                <Sparkles />
                <span>Innovation & Creativity</span>
              </div>

              <div>
                <GraduationCap />
                <span>Training & Mentorship</span>
              </div>

              <div>
                <Globe />
                <span>Community Development</span>
              </div>

              <div>
                <Briefcase />
                <span>Entrepreneurship</span>
              </div>

            </div>

          </div>

        </section>

        {/* VALUES */}
        <section className="values-section">

          <div className="section-header">
            <span className="section-tag">
              Our Values
            </span>

            <h2>
              What Drives Our Mission
            </h2>

            <p>
              Core principles shaping our community
              and initiatives.
            </p>
          </div>

          <div className="values-grid">

            <div className="value-card">
              <Lightbulb />
              <h3>Innovation</h3>
              <p>
                Encouraging creative thinking and
                problem-solving.
              </p>
            </div>

            <div className="value-card">
              <Users />
              <h3>Leadership</h3>
              <p>
                Developing confident and responsible
                leaders.
              </p>
            </div>

            <div className="value-card">
              <Target />
              <h3>Impact</h3>
              <p>
                Building sustainable social and
                economic impact.
              </p>
            </div>

            <div className="value-card">
              <TrendingUp />
              <h3>Growth</h3>
              <p>
                Empowering personal and professional
                development.
              </p>
            </div>

          </div>
        </section>

      {/* MAIN ACTIVITIES */}
<section className="programs-section">

  <div className="section-header">
    <span className="section-tag">
      Main Activities
    </span>

    <h2>
      Explore Our Community
    </h2>

    <p>
      Discover the events, activities, and news
      shaping the L.A.D.S community.
    </p>
  </div>

  <div className="programs-grid">

    {/* EVENTS */}
    <div className="activity-card">

      <div
        className="activity-image"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop')",
        }}
      ></div>

      <div className="activity-content">

        <div className="activity-icon">
          <CalendarDays size={22} />
        </div>

        <h3>Events</h3>

        <p>
          Conferences, workshops, networking sessions,
          and inspiring leadership events for youth.
        </p>

        <button className="activity-btn">
          View Events
        </button>

      </div>

    </div>

    {/* ACTIVITIES */}
    <div className="activity-card">

      <div
        className="activity-image"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1200&auto=format&fit=crop')",
        }}
      ></div>

      <div className="activity-content">

        <div className="activity-icon">
          <Users size={22} />
        </div>

        <h3>Activities</h3>

        <p>
          Volunteer programs, social initiatives,
          collaborative projects, and youth engagement.
        </p>

        <button className="activity-btn">
          Explore Activities
        </button>

      </div>

    </div>

    {/* NEWS */}
    <div className="activity-card">

      <div
        className="activity-image"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=1200&auto=format&fit=crop')",
        }}
      ></div>

      <div className="activity-content">

        <div className="activity-icon">
          <Newspaper size={22} />
        </div>

        <h3>News</h3>

        <p>
          Stay updated with the latest announcements,
          achievements, stories, and association updates.
        </p>

        <button className="activity-btn">
          Read News
        </button>

      </div>

    </div>

  </div>

</section>

      {/* FORMATIONS SECTION */}
<section className="formations-section">

  <div className="section-header">
    <span className="section-tag">
      Our Formations
    </span>

    <h2>
      Learn Through Modern Trainings
    </h2>

    <p>
      Leadership, entrepreneurship, innovation,
      soft skills, and practical workshops
      designed for ambitious youth.
    </p>
  </div>

  <div className="formations-slider">

    {/* LEFT IMAGE */}
    <div
      className="formation-card side-card"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop')",
      }}
    >
      <div className="formation-layer">
        <h3>Entrepreneurship</h3>
      </div>
    </div>

    {/* MAIN CENTER IMAGE */}
    <div
      className="formation-card main-card"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop')",
      }}
    >
      <div className="formation-layer">
        <h3>Leadership & Soft Skills</h3>
        <p>
          Interactive workshops and real-world
          learning experiences.
        </p>

        <button className="primary-btn">
          Explore Formations
        </button>
      </div>
    </div>

    {/* RIGHT IMAGE */}
    <div
      className="formation-card side-card"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop')",
      }}
    >
      <div className="formation-layer">
        <h3>Innovation Training</h3>
      </div>
    </div>

  </div>

</section>

        {/* TESTIMONIALS */}
        <section className="testimonials">

          <div className="section-header">
            <span className="section-tag">
              Testimonials
            </span>

            <h2>
              Voices From Our Community
            </h2>
          </div>

          <div className="testimonial-grid">

            <div className="testimonial-card">
              <p>
                “L.A.D.S helped me improve my
                confidence and leadership skills.”
              </p>

              <h4>— Association Member</h4>
            </div>

            <div className="testimonial-card">
              <p>
                “The workshops and mentorship changed
                the way I think about entrepreneurship.”
              </p>

              <h4>— Young Entrepreneur</h4>
            </div>

            <div className="testimonial-card">
              <p>
                “An inspiring environment full of
                ambitious and creative youth.”
              </p>

              <h4>— Volunteer</h4>
            </div>

          </div>

        </section>

        {/* CTA */}
        <section className="cta-section">

          <div className="cta-box">

            <h2>
              Ready to Become a Future Leader?
            </h2>

            <p>
              Join a community of ambitious young
              people building impactful initiatives.
            </p>

            <button className="primary-btn">
              Join L.A.D.S
              <ArrowRight size={18} />
            </button>

          </div>

        </section>

      </div>
    </div>
  );
}