import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { Lightbulb } from "lucide-react";

const TEXT =
  "O C-Search varre a cidade inteira, separa cada comércio por categoria e mostra quem ainda não tem site. " +
  "Você escolhe os melhores, confere no Maps e chama no WhatsApp com a mensagem pronta. Simples assim.";

function Word({ word, i, total, progress }: { word: string; i: number; total: number; progress: MotionValue<number> }) {
  const range = [i / total, (i + 1) / total];
  const opacity = useTransform(progress, range, [0.2, 1]);
  const color = useTransform(progress, range, ["hsl(0 0% 35%)", "hsl(0 0% 100%)"]);
  return (
    <motion.span style={{ opacity, color }} className="mr-[0.3em]">
      {word}
    </motion.span>
  );
}

export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end center"] });
  const words = TEXT.split(" ");

  return (
    <section className="flex min-h-screen items-center justify-center px-8 md:px-28 py-24 md:py-32">
      <div ref={containerRef} className="mx-auto flex max-w-3xl flex-col items-start gap-10">
        <span className="font-serif text-7xl leading-none text-muted-foreground select-none">“</span>
        <p className="flex flex-wrap text-4xl md:text-5xl font-medium leading-[1.2]">
          {words.map((w, i) => (
            <Word key={i} word={w} i={i} total={words.length} progress={scrollYProgress} />
          ))}
          <span className="ml-2 text-muted-foreground">”</span>
        </p>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-foreground">
            <Lightbulb className="h-6 w-6" />
          </div>
          <div>
            <div className="text-base font-semibold leading-7 text-foreground">Comece por restaurantes e padarias</div>
            <div className="text-sm font-normal leading-5 text-muted-foreground">Cardápio digital é o produto mais fácil de vender</div>
          </div>
        </div>
      </div>
    </section>
  );
}
