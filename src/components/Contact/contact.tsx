import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  MessageSquare,
  Send,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { track } from "@vercel/analytics";

const Contact = () => {
  const { t, locale } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {
      name: "",
      email: "",
      subject: "",
      message: "",
    };

    if (!formData.name.trim()) {
      newErrors.name = t("contact.nameRequired");
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t("contact.nameMinLength");
    } else if (!/^[a-zA-Zא-ת\s]+$/.test(formData.name.trim())) {
      newErrors.name = t("contact.nameInvalid");
    }

    if (!formData.email.trim()) {
      newErrors.email = t("contact.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = t("contact.emailInvalid");
    }

    if (!formData.subject.trim()) {
      newErrors.subject = t("contact.subjectRequired");
    } else if (formData.subject.trim().length < 5) {
      newErrors.subject = t("contact.subjectMinLength");
    }

    if (!formData.message.trim()) {
      newErrors.message = t("contact.messageRequired");
    } else if (formData.message.trim().length < 10) {
      newErrors.message = t("contact.messageMinLength");
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));

    if (errors[name as keyof typeof errors]) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Track successful contact form submission
        track("contact_form_submitted", {
          subject: formData.subject,
        });
        setShowSuccessModal(true);
        setFormData({ name: "", email: "", subject: "", message: "" });
        setErrors({ name: "", email: "", subject: "", message: "" });
      } else {
        console.error("Failed to submit contact form");
      }
    } catch (error) {
      console.error("Error submitting contact form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gray-50 text-gray-900 py-12 px-4 sm:px-6 lg:px-8"
      style={{ direction: locale === "he" ? "rtl" : "ltr" }}
    >
      <div className="max-w-2xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl font-bold text-center mb-10 text-gray-900"
        >
          {t("contact.title")}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center text-lg text-gray-600 mb-12"
        >
          {t("contact.subtitle")}
        </motion.p>
        <motion.form
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          onSubmit={handleSubmit}
          className="space-y-6 bg-white p-8 rounded-lg shadow-sm border border-gray-200"
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("contact.nameLabel")}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={`mt-1 block w-full pl-10 pr-3 py-2 bg-white border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder={t("contact.namePlaceholder")}
              />
            </div>
            {errors.name && (
              <div className="flex items-center mt-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.name}
              </div>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
          >
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("contact.emailLabel")}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={`mt-1 block w-full pl-10 pr-3 py-2 bg-white border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                placeholder={t("contact.emailPlaceholder")}
              />
            </div>
            {errors.email && (
              <div className="flex items-center mt-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.email}
              </div>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
          >
            <label
              htmlFor="subject"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("contact.subjectLabel")}
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="subject"
                id="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className={`mt-1 block w-full pl-10 pr-3 py-2 bg-white border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 ${
                  errors.subject ? "border-red-500" : "border-gray-300"
                }`}
                placeholder={t("contact.subjectPlaceholder")}
              />
            </div>
            {errors.subject && (
              <div className="flex items-center mt-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.subject}
              </div>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 1.4 }}
          >
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("contact.messageLabel")}
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                name="message"
                id="message"
                rows={4}
                value={formData.message}
                onChange={handleChange}
                required
                className={`mt-1 block w-full pl-10 pr-3 py-2 bg-white border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 ${
                  errors.message ? "border-red-500" : "border-gray-300"
                }`}
                placeholder={t("contact.messagePlaceholder")}
              />
            </div>
            {errors.message && (
              <div className="flex items-center mt-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.message}
              </div>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.6 }}
          >
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
              className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-white ${
                isSubmitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t("contact.submitting")}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {t("contact.submitButton")}
                </>
              )}
            </motion.button>
          </motion.div>
        </motion.form>

        <AnimatePresence>
          {showSuccessModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white rounded-lg p-6 max-w-md mx-4"
              >
                <div className="flex items-center justify-center mb-4">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-center mb-2">
                  {t("contact.successTitle")}
                </h3>
                <p className="text-center text-gray-600 mb-6">
                  {t("contact.successMessage")}
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  {t("contact.closeButton")}
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Contact;
