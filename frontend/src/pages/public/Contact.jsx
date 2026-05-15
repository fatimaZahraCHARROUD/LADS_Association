import React, { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Loader2,
} from "lucide-react";

import {
  FaInstagram,
  FaLinkedinIn,
  FaWhatsapp,
  FaFacebookF,
} from "react-icons/fa";

import "../../Styles/contact.css";

const API_URL = "http://localhost:3000/contact-messages";

export default function Contact() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const showError = (msg) => {
    setError(msg);

    setTimeout(() => {
      setError("");
    }, 2000);
  };

  const showSuccess = (msg) => {
    setSuccess(msg);

    setTimeout(() => {
      setSuccess("");
    }, 2000);
  };

  const validateForm = () => {
    const {
      firstName,
      lastName,
      email,
      phone,
      subject,
      message,
    } = formData;

    // ALL REQUIRED
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !subject.trim() ||
      !message.trim()
    ) {
      showError("All fields are required");
      return false;
    }

    // EMAIL VALIDATION
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      showError("Invalid email address");
      return false;
    }

    // PHONE VALIDATION
const phoneRegex =  /^(?:\+|00|0)?[1-9]\d{7,14}$/;
      if (!phoneRegex.test(phone)) {
      showError("Invalid phone number");
      return false;
    }

    // MESSAGE LENGTH
    if (message.trim().length < 10) {
      showError(
        "Message must contain at least 10 characters"
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSuccess("");
    setError("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = {
        fullName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
      };

      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
            "Failed to send message"
        );
      }

      showSuccess(
        "Message sent successfully!"
      );

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (err) {
      showError(
        err.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="contact-page">
      {/* HERO */}
      <div className="contact-hero">
        <div className="container hero-content">
          <span className="hero-badge">
            L.A.D.S Association
          </span>

          <h1>
            Contact <span>Us</span>
          </h1>

          <p>
            Empowering youth through leadership,
            innovation, and social entrepreneurship.
          </p>
        </div>
      </div>

      {/* CONTACT CARD */}
      <div className="container">
        <div className="contact-card">
          {/* LEFT SIDE */}
          <div className="contact-info">
            <h2>Let’s Connect</h2>

            <p>
              Have questions, ideas, or want to
              collaborate with L.A.D.S? Feel free
              to contact us anytime.
            </p>

            <div className="info-item">
              <Mail size={20} />
              <span>contact@lads.org</span>
            </div>

            <div className="info-item">
              <Phone size={20} />
              <span>+212 6 00 00 00 00</span>
            </div>

            <div className="info-item">
              <MapPin size={20} />
              <span>Berkane, Morocco</span>
            </div>

            <div className="social-icons">
              <a
                href="#"
                target="_blank"
                rel="noreferrer"
              >
                <FaFacebookF />
              </a>

              <a
                href="#"
                target="_blank"
                rel="noreferrer"
              >
                <FaInstagram />
              </a>

              <a
                href="#"
                target="_blank"
                rel="noreferrer"
              >
                <FaLinkedinIn />
              </a>

              <a
                href="#"
                target="_blank"
                rel="noreferrer"
              >
                <FaWhatsapp />
              </a>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="contact-form">
            <h2>Send Message</h2>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                />

                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>

              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
              />

              <input
                type="text"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
              />

              <input
                type="text"
                name="subject"
                placeholder="Subject"
                value={formData.subject}
                onChange={handleChange}
              />

              <textarea
                rows="6"
                name="message"
                placeholder="Write your message..."
                value={formData.message}
                onChange={handleChange}
              ></textarea>

              {success && (
                <p className="success-message">
                  {success}
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
                    Send Message
                    <Send size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}