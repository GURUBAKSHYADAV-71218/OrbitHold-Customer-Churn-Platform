import { Construction } from "lucide-react";

export default function ComingSoon({ title, note }: { title: string; note?: string }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 py-32 text-center">
      <Construction className="h-8 w-8 text-mustard" strokeWidth={1.5} aria-hidden />
      <h1 className="font-display text-3xl text-espresso">{title}</h1>
      <p className="text-espresso/60">
        {note ?? "This part of OrbitHold is being built in the next implementation phase."}
      </p>
    </div>
  );
}
