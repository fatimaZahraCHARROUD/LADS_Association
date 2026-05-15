import React from "react";
import {
  Target,
  Eye,
  Users,
  Lightbulb,
  Briefcase,
  HeartHandshake,
} from "lucide-react";

import "../../Styles/About.css";

export default function About() {
  const objectives = [
    "Empowering and training young people",
    "Building leadership and innovation skills",
    "Creating sustainable social impact",
    "Encouraging citizenship and responsibility",
  ];

  const departments = [
    {
      icon: <Users size={28} />,
      title: "Human Development",
      text: "Leadership programs and youth empowerment.",
    },

    {
      icon: <Lightbulb size={28} />,
      title: "Innovation & Skills",
      text: "Developing creativity and future skills.",
    },

    {
      icon: <Briefcase size={28} />,
      title: "Social Entrepreneurship",
      text: "Turning ideas into impactful projects.",
    },

    {
      icon: <HeartHandshake size={28} />,
      title: "Social Action",
      text: "Community service and volunteering initiatives.",
    },
  ];

  const team = [
    {
      name: "Fatima Zahra",
      role: "Communication Manager",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop",
    },

    {
      name: "Ayoub",
      role: "Project Coordinator",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
    },

    {
      name: "Duaa",
      role: "Social Media Manager",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&auto=format&fit=crop",
    },
  ];

  return (
    <section className="about-page">
      {/* HERO */}
      <div className="about-hero">
        <div className="container hero-content">
          <span className="hero-badge">About L.A.D.S</span>

          <h1>
            Building Future <span>Leaders</span>
          </h1>

          <p>
            A youth association focused on leadership,
            innovation, social entrepreneurship, and human
            development.
          </p>
        </div>
      </div>

      <div className="container">
        {/* STORY */}
        <section className="story-section">
          <div className="story-image">
            <img
              src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1200&auto=format&fit=crop"
              alt="LADS Team"
            />
          </div>

          <div className="story-content">
            <span className="section-tag">
              Association Story
            </span>

            <h2>Our Story</h2>

            <p>
              L.A.D.S was founded to empower youth and help
              them transform ideas into impactful social
              projects. Inspired by leadership, volunteering,
              and innovation, the association creates a space
              where young people can learn, grow, and lead
              positive change.
            </p>

            <p>
              Through workshops, mentorship, and community
              initiatives, we aim to build a generation capable
              of creating sustainable impact.
            </p>
          </div>
        </section>

        {/* MISSION VISION */}
        <section className="mission-grid">
          <div className="mission-card">
            <div className="mission-icon">
              <Target size={30} />
            </div>

            <h3>Our Mission</h3>

            <p>
              Empowering youth through leadership,
              entrepreneurship, and social innovation.
            </p>
          </div>

          <div className="mission-card">
            <div className="mission-icon">
              <Eye size={30} />
            </div>

            <h3>Our Vision</h3>

            <p>
              Creating a generation of young leaders capable
              of building sustainable positive impact.
            </p>
          </div>
        </section>

        {/* OBJECTIVES */}
        <section className="objectives-section">
          <div className="section-header">
            <span className="section-tag">
              Strategic Objectives
            </span>

            <h2>What We Focus On</h2>
          </div>

          <div className="objectives-grid">
            {objectives.map((item, index) => (
              <div className="objective-card" key={index}>
                <span>0{index + 1}</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* DEPARTMENTS */}
        <section className="departments-section">
          <div className="section-header">
            <span className="section-tag">
              Departments Overview
            </span>

            <h2>Our Main Departments</h2>
          </div>

          <div className="departments-grid">
            {departments.map((dept, index) => (
              <div className="department-card" key={index}>
                <div className="department-icon">
                  {dept.icon}
                </div>

                <h3>{dept.title}</h3>

                <p>{dept.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* TEAM */}
        <section className="team-section">
          <div className="section-header">
            <span className="section-tag">
              Team Members
            </span>

            <h2>Meet Our Team</h2>
          </div>

          <div className="team-grid">
            {team.map((member, index) => (
              <div className="team-card" key={index}>
                <img
                  src={member.image}
                  alt={member.name}
                />

                <div className="team-info">
                  <h3>{member.name}</h3>
                  <p>{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}