"use client";
import HeroSection from "@/components/shared/homePage/hero-section"
import TestimonialsSection from "@/components/shared/testimonial"
import CauseSection from "@/components/shared/cause-secction"
import Faqsection from "@/components/shared/homePage/faq-section";
import ContactComponent from "@/components/shared/contactus";


export default function HomePage() {

  return (
    <section className="min-h-screen bg-white overflow-x-hidden">
      <HeroSection />
      <CauseSection />
      <TestimonialsSection />
      <Faqsection />
      <ContactComponent isHomePage ={true}/>
    </section>
  )
}