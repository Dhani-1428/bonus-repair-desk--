"use client"

import { useState } from "react"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Send, MessageSquare } from "lucide-react"
import { useTranslation } from "@/components/language-provider"

export function ContactSection() {
  const { t } = useTranslation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Send email to bonusrepairdesk@gmail.com (admin notification)
      // Use user's email as the sender so it appears to come from them
      const adminResponse = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: "bonusrepairdesk@gmail.com",
          from: formState.email, // User's email as sender
          senderName: formState.name, // User's name for the from field
          replyTo: formState.email, // Reply-to also set to user's email
          subject: `Contact Form: ${formState.subject}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${formState.name}</p>
            <p><strong>Email:</strong> ${formState.email}</p>
            <p><strong>Subject:</strong> ${formState.subject}</p>
            <p><strong>Message:</strong></p>
            <p>${formState.message.replace(/\n/g, "<br>")}</p>
          `,
          text: `
New Contact Form Submission

Name: ${formState.name}
Email: ${formState.email}
Subject: ${formState.subject}

Message:
${formState.message}
          `,
        }),
      })

      // Send confirmation email to the user
      const userResponse = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: formState.email,
          from: "bonusrepairdesk@gmail.com",
          subject: "Thank You for Contacting Bonus Repair Desk",
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                  .info-box { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>✅ Message Received!</h1>
                  </div>
                  <div class="content">
                    <p>Dear ${formState.name},</p>
                    
                    <p>Thank you for contacting Bonus Repair Desk!</p>
                    
                    <div class="info-box">
                      <p><strong>We have received your message regarding:</strong> ${formState.subject}</p>
                      <p>Our team will review your inquiry and get back to you as soon as possible, typically within 24 hours.</p>
                    </div>
                    
                    <p>If you have any urgent questions, please feel free to contact us directly:</p>
                    <ul>
                      <li>Email: <a href="mailto:bonusrepairdesk@gmail.com">bonusrepairdesk@gmail.com</a></li>
                      <li>WhatsApp: <a href="https://wa.me/351920306889">+351 920 306 889</a></li>
                    </ul>
                    
                    <p>We appreciate your interest in Bonus Repair Desk and look forward to assisting you!</p>
                    
                    <p>Best regards,<br><strong>Bonus Repair Desk Team</strong><br>bonusrepairdesk@gmail.com</p>
                  </div>
                </div>
              </body>
            </html>
          `,
          text: `
Message Received!

Dear ${formState.name},

Thank you for contacting Bonus Repair Desk!

We have received your message regarding: ${formState.subject}

Our team will review your inquiry and get back to you as soon as possible, typically within 24 hours.

If you have any urgent questions, please feel free to contact us directly:
- Email: bonusrepairdesk@gmail.com
- WhatsApp: +351 920 306 889

We appreciate your interest in Bonus Repair Desk and look forward to assisting you!

Best regards,
Bonus Repair Desk Team
bonusrepairdesk@gmail.com
          `,
        }),
      })

      if (adminResponse.ok && userResponse.ok) {
        setSubmitted(true)
        setFormState({ name: "", email: "", subject: "", message: "" })
        setTimeout(() => setSubmitted(false), 5000)
      } else {
        throw new Error("Failed to send message")
      }
    } catch (error) {
      console.error("Error sending contact form:", error)
      alert("Failed to send message. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <section id="contact" className="relative py-12 sm:py-16 pb-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center mb-4">
            <span className="px-4 py-1.5 rounded-full border border-purple-500/30 bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-sm font-medium text-purple-400">
              Contact Us
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
            {t("website.contact.title")}
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            {t("website.contact.subtitle")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="p-6 rounded-xl bg-gradient-to-br from-gray-900/50 via-black/50 to-gray-900/50 border border-gray-800/50">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">{t("website.contact.emailUs")}</h3>
                  <p className="text-gray-400 text-sm">{t("website.contact.emailUsDesc")}</p>
                </div>
              </div>
              <a
                href="mailto:bonusrepairdesk@gmail.com"
                className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                bonusrepairdesk@gmail.com
              </a>
            </div>

            <div className="p-6 rounded-xl bg-gradient-to-br from-gray-900/50 via-black/50 to-gray-900/50 border border-gray-800/50">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-green-500 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">{t("website.contact.whatsapp")}</h3>
                  <p className="text-gray-400 text-sm">{t("website.contact.whatsappDesc")}</p>
                </div>
              </div>
              <a
                href="https://wa.me/351920306889"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 transition-colors font-medium"
              >
                +351 920 306 889
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="p-8 rounded-xl bg-gradient-to-br from-gray-900/50 via-black/50 to-gray-900/50 border border-gray-800/50"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-name" className="text-sm font-medium text-gray-300">
                    Name
                  </Label>
                  <Input
                    id="contact-name"
                    name="name"
                    value={formState.name}
                    onChange={handleChange}
                    placeholder={t("website.contact.name")}
                    className="h-11 bg-gray-900/50 border-gray-700 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email" className="text-sm font-medium text-gray-300">
                    Email
                  </Label>
                  <Input
                    id="contact-email"
                    name="email"
                    type="email"
                    value={formState.email}
                    onChange={handleChange}
                    placeholder={t("website.contact.email")}
                    className="h-11 bg-gray-900/50 border-gray-700 text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-subject" className="text-sm font-medium text-gray-300">
                  Subject
                </Label>
                <Input
                  id="contact-subject"
                  name="subject"
                  value={formState.subject}
                  onChange={handleChange}
                  placeholder={t("website.contact.subject")}
                  className="h-11 bg-gray-900/50 border-gray-700 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-message" className="text-sm font-medium text-gray-300">
                  Message
                </Label>
                <Textarea
                  id="contact-message"
                  name="message"
                  value={formState.message}
                  onChange={handleChange}
                  placeholder={t("website.contact.message")}
                  rows={6}
                  className="bg-gray-900/50 border-gray-700 text-white"
                  required
                />
              </div>

              {submitted && (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-sm text-green-400">
                  ✓ {t("website.contact.success")}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                disabled={loading}
              >
                <Send className="h-4 w-4 mr-2" />
                {loading ? t("website.contact.sending") : t("website.contact.sendMessage")}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

