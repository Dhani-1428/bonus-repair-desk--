"use client"

import { useState, useEffect } from "react"
import { Marquee } from "@/components/magicui/marquee"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface Testimonial {
  id: string
  name: string
  username: string
  body: string
  img: string
  createdAt?: string
}

// Fallback testimonials if API fails
const fallbackTestimonials: Testimonial[] = [
  {
    id: "1",
    name: "Michael Chen",
    username: "@mike_repairs",
    body: "Bonus Repair Desk has completely transformed our repair shop operations. Tracking tickets and managing customers is now effortless. Highly recommend!",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    username: "@sarah_techfix",
    body: "The ticket management system is incredibly intuitive. We've reduced our processing time by 40% and our customers love the professional receipts.",
    img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: "3",
    name: "David Rodriguez",
    username: "@david_phonefix",
    body: "Best investment we made for our repair business. The customer database and payment tracking features alone are worth every penny. Game changer!",
    img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: "4",
    name: "Priya Patel",
    username: "@priya_devices",
    body: "Managing multiple repair tickets used to be a nightmare. Now everything is organized, searchable, and we never lose track of a device. Amazing platform!",
    img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: "5",
    name: "Robert Kim",
    username: "@rob_repairs",
    body: "The analytics and reports feature helps us understand our business better. We've identified our most profitable services and optimized our workflow.",
    img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: "6",
    name: "Emma Thompson",
    username: "@emma_fixit",
    body: "Switched from paper tickets to Bonus Repair Desk and it's been life-changing. Everything is digital, organized, and accessible from anywhere. Love it!",
    img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: "7",
    name: "Ahmed Hassan",
    username: "@ahmed_tech",
    body: "The team management feature is perfect for our growing shop. We can assign tickets, track progress, and manage our staff all in one place. Essential tool!",
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: "8",
    name: "Lisa Anderson",
    username: "@lisa_repairs",
    body: "Customer satisfaction has improved significantly since we started using Bonus Repair Desk. The professional receipts and status updates keep our customers informed.",
    img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: "9",
    name: "James Wilson",
    username: "@james_fixpro",
    body: "The free trial convinced us immediately. Easy to set up, user-friendly interface, and excellent customer support. Our repair shop runs smoother than ever!",
    img: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face",
  },
]

const TestimonialCard = ({
  img,
  name,
  username,
  body,
}: {
  img: string
  name: string
  username: string
  body: string
}) => {
  return (
    <div className="relative w-full max-w-xs overflow-hidden rounded-3xl border border-gray-800/50 bg-gradient-to-br from-gray-900/50 via-black/50 to-gray-900/50 p-10 shadow-xl hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 transform hover:scale-[1.02] hover:border-blue-500/30">
      <div className="absolute -top-5 -left-5 -z-10 h-40 w-40 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 blur-md"></div>

      <div className="text-white/90 leading-relaxed">{body}</div>

      <div className="mt-5 flex items-center gap-2">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur opacity-50"></div>
          <img src={img || "/placeholder.svg"} alt={name} height="40" width="40" className="relative h-10 w-10 rounded-full ring-2 ring-gray-800" />
        </div>
        <div className="flex flex-col">
          <div className="leading-5 font-medium tracking-tight text-white">{name}</div>
          <div className="leading-5 tracking-tight text-gray-400">{username}</div>
        </div>
      </div>
    </div>
  )
}

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(fallbackTestimonials)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    body: "",
  })

  useEffect(() => {
    loadTestimonials()
  }, [])

  const loadTestimonials = async () => {
    try {
      const response = await fetch("/api/testimonials")
      if (response.ok) {
        const data = await response.json()
        if (data.testimonials && data.testimonials.length > 0) {
          // Combine database testimonials with fallback ones
          const combined = [...data.testimonials, ...fallbackTestimonials]
          setTestimonials(combined)
        }
      }
    } catch (error) {
      console.error("Error loading testimonials:", error)
      // Use fallback testimonials on error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.body.trim()) {
      toast.error("Please fill in your name and comment")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/testimonials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          username: formData.username.trim() || undefined,
          body: formData.body.trim(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || "Thank you for your feedback! Your comment will be reviewed and published soon.")
        setFormData({ name: "", username: "", body: "" })
        setIsDialogOpen(false)
        // Reload testimonials after a short delay
        setTimeout(() => {
          loadTestimonials()
        }, 1000)
      } else {
        toast.error(data.error || "Failed to submit comment. Please try again.")
      }
    } catch (error) {
      console.error("Error submitting testimonial:", error)
      toast.error("Failed to submit comment. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const firstColumn = testimonials.slice(0, 3)
  const secondColumn = testimonials.slice(3, 6)
  const thirdColumn = testimonials.slice(6, 9)

  return (
    <>
      <section id="testimonials" className="mb-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-[540px]">
            <div className="flex justify-center">
              <button
                type="button"
                className="group relative z-[60] mx-auto rounded-full border border-gray-800/50 bg-gradient-to-r from-gray-900/50 to-black/50 px-6 py-1 text-xs backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20 active:scale-100 md:text-sm"
              >
                <div className="absolute inset-x-0 -top-px mx-auto h-0.5 w-1/2 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-2xl transition-all duration-500 group-hover:w-3/4"></div>
                <div className="absolute inset-x-0 -bottom-px mx-auto h-0.5 w-1/2 bg-gradient-to-r from-transparent via-purple-500 to-transparent shadow-2xl transition-all duration-500 group-hover:h-px"></div>
                <span className="relative text-white">Testimonials</span>
              </button>
            </div>
            <h2 className="from-foreground/60 via-foreground to-foreground/60 dark:from-muted-foreground/55 dark:via-foreground dark:to-muted-foreground/55 mt-5 bg-gradient-to-r bg-clip-text text-center text-4xl font-semibold tracking-tighter text-transparent md:text-[54px] md:leading-[60px] __className_bb4e88 relative z-10">
              What our users say
            </h2>

            <p className="mt-5 relative z-10 text-center text-lg text-zinc-500">
              Trusted by repair shop owners worldwide. See how Bonus Repair Desk is helping businesses streamline operations and grow.
            </p>
          </div>

          <div className="my-16 flex max-h-[738px] justify-center gap-6 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)]">
            <div>
              <Marquee pauseOnHover vertical className="[--duration:20s]">
                {firstColumn.map((testimonial) => (
                  <TestimonialCard key={testimonial.id || testimonial.username} {...testimonial} />
                ))}
              </Marquee>
            </div>

            <div className="hidden md:block">
              <Marquee reverse pauseOnHover vertical className="[--duration:25s]">
                {secondColumn.map((testimonial) => (
                  <TestimonialCard key={testimonial.id || testimonial.username} {...testimonial} />
                ))}
              </Marquee>
            </div>

            <div className="hidden lg:block">
              <Marquee pauseOnHover vertical className="[--duration:30s]">
                {thirdColumn.map((testimonial) => (
                  <TestimonialCard key={testimonial.id || testimonial.username} {...testimonial} />
                ))}
              </Marquee>
            </div>
          </div>

          <div className="-mt-8 flex justify-center">
            <button 
              onClick={() => setIsDialogOpen(true)}
              className="group relative inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm px-6 py-3 text-sm font-medium text-white transition-all duration-300 hover:border-blue-500/60 hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-purple-600/20 hover:shadow-xl hover:shadow-blue-500/20 active:scale-95"
            >
              <div className="absolute inset-x-0 -top-px mx-auto h-px w-3/4 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent"></div>
              <div className="absolute inset-x-0 -bottom-px mx-auto h-px w-3/4 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent"></div>
              <svg className="h-4 w-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"></path>
              </svg>
              Share your experience
            </button>
          </div>
        </div>
      </section>

      {/* Comment Submission Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white border-blue-200 text-black">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-black">Share Your Experience</DialogTitle>
            <DialogDescription className="text-black">
              We'd love to hear about your experience with Bonus Repair Desk. Your feedback helps us improve!
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-black">Your Name *</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-white border-blue-300 text-black placeholder:text-gray-400 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-black">Username (Optional)</Label>
              <Input
                id="username"
                placeholder="@username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="bg-white border-blue-300 text-black placeholder:text-gray-400 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body" className="text-black">Your Comment *</Label>
              <Textarea
                id="body"
                placeholder="Share your experience with Bonus Repair Desk..."
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                required
                rows={5}
                className="bg-white border-blue-300 text-black placeholder:text-gray-400 focus:border-blue-500 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false)
                  setFormData({ name: "", username: "", body: "" })
                }}
                className="flex-1 bg-white border-blue-300 text-black hover:bg-blue-50"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
