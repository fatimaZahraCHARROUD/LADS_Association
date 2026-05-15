import React, {useState} from "react";
import {
  Users,
  GraduationCap,
  Briefcase,
  HeartHandshake,
  Send,  Loader2,
  CheckCircle2,
} from "lucide-react";

import "../../Styles/membership.css";

const API_URL =
  "http://localhost:3000/membership-requests";

export default function Membership() {
  const benefits = [
    {
      icon: <GraduationCap size={28} />,
      title: "Training Programs",
      text: "Access workshops, formations, and leadership sessions.",
    },

    {
      icon: <Users size={28} />,
      title: "Networking",
      text: "Connect with ambitious youth and inspiring leaders.",
    },

    {
      icon: <Briefcase size={28} />,
      title: "Project Opportunities",
      text: "Participate in impactful social and entrepreneurial projects.",
    },

    {
      icon: <HeartHandshake size={28} />,
      title: "Community Impact",
      text: "Contribute to initiatives that create positive change.",
    },
  ];

   const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    motivation: "",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const validate = () => {
    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.city.trim() ||
      !form.motivation.trim()
    ) {
      setError("All fields are required");
      setTimeout(() => setError(""), 2000);
      return false;
    }

    const phoneRegex =  /^(?:\+|00|0)?[1-9]\d{7,14}$/;


    if (!phoneRegex.test(form.phone)) {
      setError("Invalid phone number");
      setTimeout(() => setError(""), 2000);
      return false;
    }

    // motivation LENGTH
    if (form.motivation.trim().length < 10) {
      setError(
        "motivation must contain at least 10 characters"
      );
      return false;
    }


    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMsg("");

    if (!validate()) return;

    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "Request failed"
        );
      }

      setMsg("Request sent successfully!");

      setForm({
        fullName: "",
        email: "",
        phone: "",
        city: "",
        motivation: "",
      });

      setTimeout(() => setMsg(""), 2000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(""), 2000);
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <section className="membership-page">
      {/* HERO */}
      <div className="membership-hero">
        <div className="container hero-content">
          <span className="hero-badge">
            Join L.A.D.S
          </span>

          <h1>
            Become a <span>Member</span>
          </h1>

          <p>
            Join a community of young leaders passionate
            about innovation, leadership, and social impact.
          </p>
        </div>
      </div>

      <div className="container">
        {/* WHY JOIN */}
        <section className="why-section">
          <div className="why-content">
            <span className="section-tag">
              Why Join Us
            </span>

            <h2>Grow, Lead & Create Impact</h2>

            <p>
              L.A.D.S provides young people with the
              environment, mentorship, and opportunities to
              develop their skills and turn ideas into real
              impact.
            </p>

            <div className="why-list">
              <div>
                <CheckCircle2 size={20} />
                Leadership development opportunities
              </div>

              <div>
                <CheckCircle2 size={20} />
                Real social and entrepreneurial projects
              </div>

              <div>
                <CheckCircle2 size={20} />
                Professional networking & teamwork
              </div>

              <div>
                <CheckCircle2 size={20} />
                Workshops, activities, and events
              </div>
            </div>
          </div>

          <div className="why-image">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1400&auto=format&fit=crop"
              alt="Membership"
            />
          </div>
        </section>

        {/* BENEFITS */}
        <section className="benefits-section">
          <div className="section-header">
            <span className="section-tag">
              Membership Benefits
            </span>

            <h2>What You Will Get</h2>
          </div>

          <div className="benefits-grid">
            {benefits.map((item, index) => (
              <div
                className="benefit-card"
                key={index}
              >
                <div className="benefit-icon">
                  {item.icon}
                </div>

                <h3>{item.title}</h3>

                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FORM */}
        <section className="membership-form-section">
          <div className="form-card">
            <div className="section-header">
              <span className="section-tag">
                Membership Request
              </span>

              <h2>Apply Now</h2>
            </div>

            <form
              className="membership-form"
              onSubmit={handleSubmit}
            >
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Full Name"
                />
           

              <div className="form-row">
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Email Address"
                />
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Phone Number"
                />
              </div>

              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="City"
              />

              <textarea
                name="motivation"
                value={form.motivation}
                onChange={handleChange}
                rows="6"
                placeholder="Tell us why you want to join..."
              />

              {msg && (
                <p className="success-message">
                  {msg}
                </p>
              )}

              {error && (
                <p className="error-message">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    Sending...
                    <Loader2
                      size={18}
                      className="spin"
                    />
                  </>
                ) : (
                  <>
                    Submit Request
                    <Send size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        </section>
      </div>
    </section>
  );
}