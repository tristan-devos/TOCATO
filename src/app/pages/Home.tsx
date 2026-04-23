import { Hero } from "../components/Hero";
import { Categories } from "../components/Categories";
import { HowItWorks } from "../components/HowItWorks";
import { Trust } from "../components/Trust";
import { CallToAction } from "../components/CallToAction";

export function Home() {
  return (
    <>
      <Hero />
      <Categories />
      <HowItWorks />
      <Trust />
      <CallToAction />
    </>
  );
}
