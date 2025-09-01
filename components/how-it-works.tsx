import { Gift, Search, MessageCircle } from 'lucide-react';

const steps = [
  {
    icon: <Gift className="h-8 w-8 text-primary" />,
    title: 'Donate Food',
    description: 'Post a listing of your surplus food items in just a few taps.'
  },
  {
    icon: <Search className="h-8 w-8 text-primary" />,
    title: 'Find Food',
    description: 'Browse available food donations near you and make a request.'
  },
  {
    icon: <MessageCircle className="h-8 w-8 text-primary" />,
    title: 'Connect',
    description: 'Coordinate pickup details directly with the donor through our messaging system.'
  }
];

export function HowItWorks() {
  return (
    <section className="bg-background py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How It Works</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Join our community and help reduce food waste in three simple steps
          </p>
        </div>
        
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="group relative rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                {step.icon}
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                <span className="mr-2 text-primary">0{index + 1}.</span>
                {step.title}
              </h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
