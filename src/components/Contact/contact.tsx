import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  MessageSquare,
  Send,
  AlertCircle,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { track } from "@vercel/analytics";
import Modal from "@/components/Modal/Modal";
import { useNotification } from "@/contexts/NotificationContext";
import { SUBJECT_OPTIONS } from "@/constants/contact";

const Contact = () => {
  const { t, locale } = useTranslation();
  const { showError } = useNotification();
  const isRTL = locale === "he";
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

    if (!formData.subject) {
      newErrors.subject = t("contact.subjectRequired");
    }

    if (!formData.message.trim()) {
      newErrors.message = t("contact.messageRequired");
    } else if (formData.message.trim().length < 10) {
      newErrors.message = t("contact.messageMinLength");
    } else if (formData.message.length > 500) {
      newErrors.message = t("contact.messageMaxLength");
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
        showError(t("contact.submitError"));
      }
    } catch (error) {
      console.error("Error submitting contact form:", error);
      showError(t("contact.submitError"));
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 mb-4">
            <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {t("contact.title")}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {t("contact.subtitle")}
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="space-y-5">
            {/* Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                {t("contact.nameLabel")}
              </label>
              <div className="relative">
                <User className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 ${isRTL ? "right-3" : "left-3"}`} />
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={`block w-full ${isRTL ? "pr-10 pl-3" : "pl-10 pr-3"} py-2.5 bg-white dark:bg-gray-700 border rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 dark:text-white transition-colors ${
                    errors.name ? "border-red-500 dark:border-red-500" : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder={t("contact.namePlaceholder")}
                />
              </div>
              {errors.name && (
                <div className={`flex items-center mt-1.5 text-sm text-red-600 dark:text-red-400 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <AlertCircle className={`h-4 w-4 ${isRTL ? "ml-1" : "mr-1"}`} />
                  {errors.name}
                </div>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                {t("contact.emailLabel")}
              </label>
              <div className="relative">
                <Mail className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 ${isRTL ? "right-3" : "left-3"}`} />
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  dir="ltr"
                  className={`block w-full ${isRTL ? "pr-10 pl-3 text-right" : "pl-10 pr-3"} py-2.5 bg-white dark:bg-gray-700 border rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 dark:text-white transition-colors ${
                    errors.email ? "border-red-500 dark:border-red-500" : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder={t("contact.emailPlaceholder")}
                />
              </div>
              {errors.email && (
                <div className={`flex items-center mt-1.5 text-sm text-red-600 dark:text-red-400 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <AlertCircle className={`h-4 w-4 ${isRTL ? "ml-1" : "mr-1"}`} />
                  {errors.email}
                </div>
              )}
            </div>

            {/* Subject Field */}
            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                {t("contact.subjectLabel")}
              </label>
              <div className="relative">
                <MessageSquare className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none ${isRTL ? "right-3" : "left-3"}`} />
                <ChevronDown className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none ${isRTL ? "left-3" : "right-3"}`} />
                <select
                  name="subject"
                  id="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className={`block w-full ${isRTL ? "pr-10 pl-10" : "pl-10 pr-10"} py-2.5 bg-white dark:bg-gray-700 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 dark:text-white appearance-none cursor-pointer transition-colors ${
                    errors.subject ? "border-red-500 dark:border-red-500" : "border-gray-300 dark:border-gray-600"
                  } ${!formData.subject ? "text-gray-400 dark:text-gray-500" : ""}`}
                >
                  <option value="" disabled>
                    {t("contact.subjectPlaceholder")}
                  </option>
                  {SUBJECT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </select>
              </div>
              {errors.subject && (
                <div className={`flex items-center mt-1.5 text-sm text-red-600 dark:text-red-400 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <AlertCircle className={`h-4 w-4 ${isRTL ? "ml-1" : "mr-1"}`} />
                  {errors.subject}
                </div>
              )}
            </div>

            {/* Message Field */}
            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                {t("contact.messageLabel")}
              </label>
              <div className="relative">
                <MessageSquare className={`absolute top-3 h-5 w-5 text-gray-400 dark:text-gray-500 ${isRTL ? "right-3" : "left-3"}`} />
                <textarea
                  name="message"
                  id="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  required
                  maxLength={500}
                  className={`block w-full ${isRTL ? "pr-10 pl-3" : "pl-10 pr-3"} py-2.5 bg-white dark:bg-gray-700 border rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 dark:text-white resize-none transition-colors ${
                    errors.message ? "border-red-500 dark:border-red-500" : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder={t("contact.messagePlaceholder")}
                />
              </div>
              <div className="flex justify-between items-center mt-1.5">
                {errors.message ? (
                  <div className={`flex items-center text-sm text-red-600 dark:text-red-400 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <AlertCircle className={`h-4 w-4 ${isRTL ? "ml-1" : "mr-1"}`} />
                    {errors.message}
                  </div>
                ) : (
                  <span />
                )}
                <span className={`text-xs ${formData.message.length > 450 ? "text-orange-500 dark:text-orange-400" : "text-gray-400 dark:text-gray-500"}`}>
                  {formData.message.length}/500
                </span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.99 }}
            className={`w-full flex justify-center items-center gap-2 py-3 px-4 mt-6 rounded-lg text-sm font-semibold transition-all ${
              isSubmitting
                ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 cursor-pointer shadow-sm"
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 dark:border-gray-500 border-t-transparent"></div>
                {t("contact.submitting")}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {t("contact.submitButton")}
              </>
            )}
          </motion.button>
        </motion.form>

        {/* Success Modal */}
        <Modal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title={t("contact.successTitle")}
          message={t("contact.successMessage")}
          confirmText={t("contact.closeButton")}
        >
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </Modal>
      </div>
    </motion.div>
  );
};

export default Contact;
