"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Hero from "@/components/home/hero"
import { AboutSection } from "@/components/about-section"
import Features from "@/components/features"
import { TestimonialsSection } from "@/components/testimonials"
import { NewReleasePromo } from "@/components/new-release-promo"
import { FAQSection } from "@/components/faq-section"
import { ContactSection } from "@/components/contact-section"
import { PricingSection } from "@/components/pricing-section"
import { ScrollToTop } from "@/components/scroll-to-top"
import { WhatsAppFloat } from "@/components/whatsapp-float"

export default function Home() {
  const { t } = useTranslation()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const root = window.document.documentElement
      root.classList.remove("light", "system")
      root.classList.add("dark")
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleMobileNavClick = (elementId: string) => {
    setIsMobileMenuOpen(false)
    setTimeout(() => {
      const element = document.getElementById(elementId)
      if (element) {
        const headerOffset = 120 // Account for sticky header height + margin
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
        const offsetPosition = elementPosition - headerOffset

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        })
      }
    }, 100)
  }

  return (
    <div className="min-h-screen w-full relative bg-black">
      {/* Pearl Mist Background with Top Glow */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse 50% 35% at 50% 0%, rgba(226, 232, 240, 0.12), transparent 60%), #000000",
        }}
      />

      {/* Desktop Header */}
      <header
        className={`sticky top-4 z-[9999] mx-auto hidden w-full flex-row items-center justify-between self-start rounded-full bg-gradient-to-r from-gray-900/90 via-black/90 to-gray-900/90 md:flex backdrop-blur-md border border-gray-800/50 shadow-2xl transition-all duration-300 ${
          isScrolled ? "max-w-3xl px-2" : "max-w-5xl px-4"
        } py-2`}
        style={{
          willChange: "transform",
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
          perspective: "1000px",
        }}
      >
        <Link
          className={`z-50 flex items-center justify-center gap-3 transition-all duration-300 group flex-shrink-0 ${
            isScrolled ? "ml-2" : ""
          }`}
          href="/"
        >
          <img src="/BRD LOGO..png" alt="BRD Logo" className={`rounded-full object-cover ${
            isScrolled ? "h-8 w-8 hidden sm:block" : "h-10 w-10"
          }`} />
          <span className={`text-foreground font-bold tracking-tight group-hover:text-blue-300 transition-colors duration-300 ${
            isScrolled ? "text-base hidden sm:inline" : "text-lg"
          }`}>
            Bonus Repair Desk
          </span>
        </Link>

        <div className={`hidden flex-1 flex-row items-center justify-center space-x-1 text-sm font-medium text-gray-300 transition duration-300 md:flex md:space-x-1 pointer-events-none ${
          isScrolled ? "space-x-0" : "space-x-2"
        }`}>
          <a
            className={`relative text-gray-300 hover:text-white transition-all duration-300 cursor-pointer group pointer-events-auto ${
              isScrolled ? "px-2 py-1 text-xs" : "px-4 py-2"
            }`}
            onClick={(e) => {
              e.preventDefault()
              const element = document.getElementById("about")
              if (element) {
                const headerOffset = 120
                const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
                const offsetPosition = elementPosition - headerOffset
                window.scrollTo({ top: offsetPosition, behavior: "smooth" })
              }
            }}
          >
            <span className="relative z-20 group-hover:text-blue-300 whitespace-nowrap">{t("website.nav.about")}</span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 group-hover:w-full transition-all duration-300"></span>
          </a>
          <a
            className={`relative text-gray-300 hover:text-white transition-all duration-300 cursor-pointer group pointer-events-auto ${
              isScrolled ? "px-2 py-1 text-xs" : "px-4 py-2"
            }`}
            onClick={(e) => {
              e.preventDefault()
              const element = document.getElementById("features")
              if (element) {
                const headerOffset = 120
                const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
                const offsetPosition = elementPosition - headerOffset
                window.scrollTo({ top: offsetPosition, behavior: "smooth" })
              }
            }}
          >
            <span className="relative z-20 group-hover:text-blue-300 whitespace-nowrap">{t("website.nav.features")}</span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 group-hover:w-full transition-all duration-300"></span>
          </a>
          <a
            className={`relative text-gray-300 hover:text-white transition-all duration-300 cursor-pointer group pointer-events-auto ${
              isScrolled ? "px-2 py-1 text-xs" : "px-4 py-2"
            }`}
            onClick={(e) => {
              e.preventDefault()
              const element = document.getElementById("pricing")
              if (element) {
                const headerOffset = 120
                const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
                const offsetPosition = elementPosition - headerOffset
                window.scrollTo({ top: offsetPosition, behavior: "smooth" })
              }
            }}
          >
            <span className="relative z-20 group-hover:text-blue-300 whitespace-nowrap">{t("website.nav.pricing")}</span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 group-hover:w-full transition-all duration-300"></span>
          </a>
          <a
            className={`relative text-gray-300 hover:text-white transition-all duration-300 cursor-pointer group pointer-events-auto ${
              isScrolled ? "px-2 py-1 text-xs hidden lg:block" : "px-4 py-2"
            }`}
            onClick={(e) => {
              e.preventDefault()
              const element = document.getElementById("testimonials")
              if (element) {
                const headerOffset = 120
                const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
                const offsetPosition = elementPosition - headerOffset
                window.scrollTo({ top: offsetPosition, behavior: "smooth" })
              }
            }}
          >
            <span className="relative z-20 group-hover:text-blue-300 whitespace-nowrap">{t("website.nav.testimonials")}</span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 group-hover:w-full transition-all duration-300"></span>
          </a>
          <a
            className={`relative text-gray-300 hover:text-white transition-all duration-300 cursor-pointer group pointer-events-auto ${
              isScrolled ? "px-2 py-1 text-xs" : "px-4 py-2"
            }`}
            onClick={(e) => {
              e.preventDefault()
              const element = document.getElementById("faq")
              if (element) {
                const headerOffset = 120
                const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
                const offsetPosition = elementPosition - headerOffset
                window.scrollTo({ top: offsetPosition, behavior: "smooth" })
              }
            }}
          >
            <span className="relative z-20 group-hover:text-blue-300 whitespace-nowrap">{t("website.nav.faq")}</span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 group-hover:w-full transition-all duration-300"></span>
          </a>
          <a
            className={`relative text-gray-300 hover:text-white transition-all duration-300 cursor-pointer group pointer-events-auto ${
              isScrolled ? "px-2 py-1 text-xs" : "px-4 py-2"
            }`}
            onClick={(e) => {
              e.preventDefault()
              const element = document.getElementById("contact")
              if (element) {
                const headerOffset = 120
                const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
                const offsetPosition = elementPosition - headerOffset
                window.scrollTo({ top: offsetPosition, behavior: "smooth" })
              }
            }}
          >
            <span className="relative z-20 group-hover:text-blue-300 whitespace-nowrap">{t("website.nav.contact")}</span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 group-hover:w-full transition-all duration-300"></span>
          </a>
            </div>

        <div className="flex items-center gap-2 sm:gap-4 relative z-10 flex-shrink-0">
          <WebsiteLanguageSelector />
          <Link
            href="/login"
            className={`font-medium transition-all duration-300 hover:text-blue-300 text-gray-300 cursor-pointer relative z-10 whitespace-nowrap ${
              isScrolled ? "text-xs px-2" : "text-sm"
            }`}
          >
            {t("website.nav.logIn")}
          </Link>

          <Link
            href="/register"
            className={`rounded-md font-bold relative cursor-pointer hover:-translate-y-0.5 transition-all duration-300 inline-block text-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/20 text-white transform hover:scale-105 z-10 whitespace-nowrap ${
              isScrolled ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
            }`}
          >
            {t("website.nav.signUp")}
          </Link>
                  </div>
      </header>

      {/* Mobile Header */}
      <header className="sticky top-4 z-[9999] mx-4 flex w-auto flex-row items-center justify-between rounded-full bg-gradient-to-r from-gray-900/90 via-black/90 to-gray-900/90 backdrop-blur-md border border-gray-800/50 shadow-2xl md:hidden px-4 py-3">
        <Link
          className="flex items-center justify-center gap-2 group"
          href="/"
        >
          <img src="/BRD LOGO..png" alt="BRD Logo" className="h-8 w-8 rounded-full object-cover" />
          <span className="text-foreground font-bold text-base tracking-tight group-hover:text-blue-300 transition-colors duration-300">
            Bonus Repair Desk
          </span>
        </Link>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-background/50 border border-border/50 transition-colors hover:bg-background/80"
          aria-label="Toggle menu"
        >
          <div className="flex flex-col items-center justify-center w-5 h-5 space-y-1">
            <span
              className={`block w-4 h-0.5 bg-foreground transition-all duration-300 ${isMobileMenuOpen ? "rotate-45 translate-y-1.5" : ""}`}
            ></span>
            <span
              className={`block w-4 h-0.5 bg-foreground transition-all duration-300 ${isMobileMenuOpen ? "opacity-0" : ""}`}
            ></span>
            <span
              className={`block w-4 h-0.5 bg-foreground transition-all duration-300 ${isMobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""}`}
            ></span>
          </div>
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-md md:hidden">
          <div className="absolute top-20 left-4 right-4 bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-xl border border-gray-800/50 rounded-2xl shadow-2xl p-6 animate-fade-in">
            <nav className="flex flex-col space-y-2">
              <button
                onClick={() => handleMobileNavClick("about")}
                className="text-left px-4 py-3 text-lg font-medium text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-purple-600/20 transition-all duration-300 rounded-lg"
              >
                {t("website.nav.about")}
              </button>
              <button
                onClick={() => handleMobileNavClick("features")}
                className="text-left px-4 py-3 text-lg font-medium text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-purple-600/20 transition-all duration-300 rounded-lg"
              >
                {t("website.nav.features")}
              </button>
              <button
                onClick={() => handleMobileNavClick("pricing")}
                className="text-left px-4 py-3 text-lg font-medium text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-purple-600/20 transition-all duration-300 rounded-lg"
              >
                {t("website.nav.pricing")}
              </button>
              <button
                onClick={() => handleMobileNavClick("testimonials")}
                className="text-left px-4 py-3 text-lg font-medium text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-purple-600/20 transition-all duration-300 rounded-lg"
              >
                {t("website.nav.testimonials")}
              </button>
              <button
                onClick={() => handleMobileNavClick("faq")}
                className="text-left px-4 py-3 text-lg font-medium text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-purple-600/20 transition-all duration-300 rounded-lg"
              >
                {t("website.nav.faq")}
              </button>
              <button
                onClick={() => handleMobileNavClick("contact")}
                className="text-left px-4 py-3 text-lg font-medium text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-purple-600/20 transition-all duration-300 rounded-lg"
              >
                {t("website.nav.contact")}
              </button>
              <div className="border-t border-gray-800/50 pt-4 mt-4 flex flex-col space-y-3">
                <Link
                  href="/login"
                  className="px-4 py-3 text-lg font-medium text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-purple-600/20 transition-all duration-300 rounded-lg cursor-pointer"
                >
                  {t("website.nav.logIn")}
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-3 text-lg font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-300 transform hover:scale-105"
                >
                  {t("website.nav.signUp")}
                </Link>
            </div>
            </nav>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <Hero />

      {/* About Section */}
      <div id="about">
        <AboutSection />
      </div>

      {/* Features Section */}
      <div id="features">
        <Features />
      </div>

      {/* Pricing Section */}
      <div id="pricing">
        <PricingSection />
      </div>

      {/* Testimonials Section */}
      <div id="testimonials">
        <TestimonialsSection />
      </div>

      <NewReleasePromo />

      {/* FAQ Section */}
      <div id="faq">
        <FAQSection />
      </div>

      {/* Contact Section */}
      <div id="contact">
        <ContactSection />
      </div>

      {/* Footer with Developer Credit and Copyright */}
      <footer className="relative z-10 py-12 border-t border-gray-800/50 bg-gradient-to-b from-black via-black to-black mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col items-center justify-center space-y-4">
            {/* Developed by Bonus IT Solutions */}
            <p className="text-center text-base text-gray-300">
              {t("website.footer.developedBy")}{" "}
              <a
                href="https://bonusitsolutions.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors duration-300 font-semibold hover:underline"
              >
                Bonus IT Solutions
              </a>
            </p>
            
            {/* Copyright Notice */}
            <p className="text-center text-base text-white font-medium">
              {t("website.footer.copyright")}
            </p>
          </div>
        </div>
      </footer>

      {/* WhatsApp Float Button */}
      <WhatsAppFloat />

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  )
}
