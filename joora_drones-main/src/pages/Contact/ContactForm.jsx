import React, { useRef } from "react";
import "./ContactForm.css";
import { MdOutlineClose } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import ContactBg from "../../assets/contact.webp";
import {  toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ContactForm = () => {
  const navigate = useNavigate();
  const form = useRef();
  
  
  return (
    <div className="FormContainer">
      <img src={ContactBg} alt="Contact Form background" />
      <div className="underOverlay" onClick={() => navigate(-1)}></div>
      <div className="close" onClick={() => navigate(-1)}>
        <MdOutlineClose />
      </div>
      <div class="form__container">
        <h2>Get In Touch</h2>
        <form id="contact-form" ref={form} method="POST" action="https://formsubmit.co/sagar.sahit@jooradrones.com">
          <div class="form-group">
            <label for="name">
              <h4>Name:</h4>
            </label>
            <input
              type="text"
              id="name"
              name="from_name"
              placeholder="Your Name"
              required
            />
          </div>
          <div class="form-group">
            <label for="email">
              <h4>Email:</h4>
            </label>
            <input
              type="email"
              id="email"
              name="from_email"
              placeholder="Your Email"
              required
            />
          </div>
          <div class="form-group">
            <label for="phone">
              <h4>Phone Number:</h4>
            </label>
            <input
              type="tel"
              id="phone"
              name="from_phoneNumber"
              placeholder="Your Phone Number"
              required
            />
          </div>
          <div class="form-group">
            <label for="message">
              <h4>Message:</h4>
            </label>
            <textarea
              name="message"
              id="message"
              cols="30"
              rows="3"
              placeholder="Message..."
            ></textarea>
          </div>
          <div class="form-group">
            <input type="submit" value="Submit" />
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactForm;
