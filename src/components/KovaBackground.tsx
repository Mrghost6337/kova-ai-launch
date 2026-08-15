import { motion, useScroll, useSpring, useTransform } from "framer-motion";

export function KovaBackground() {
  const { scrollY } = useScroll();
  const smoothScroll = useSpring(scrollY, { stiffness: 55, damping: 24, mass: 0.8 });
  const sceneY = useTransform(smoothScroll, [0, 900, 1800, 3200], [0, -22, 34, -14]);
  const sceneScale = useTransform(smoothScroll, [0, 1200, 2600], [1, 1.025, 0.99]);
  const washOpacity = useTransform(smoothScroll, [0, 800, 1800, 3200], [1, 0.82, 0.94, 0.78]);

  return (
    <div className="kova-background" aria-hidden="true">
      <motion.div className="kova-background__wash" style={{ opacity: washOpacity }} />
      <motion.div className="kova-background__scene" style={{ y: sceneY, scale: sceneScale }}>
        <motion.div
          className="kova-background__orb kova-background__orb--one"
          animate={{ x: [0, 28, -12, 0], y: [0, -20, 14, 0], scale: [1, 1.05, 0.98, 1] }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="kova-background__orb kova-background__orb--two"
          animate={{ x: [0, -24, 10, 0], y: [0, 18, -10, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="kova-background__line kova-background__line--one"
          animate={{ rotate: [0, 2, -1, 0], opacity: [0.2, 0.34, 0.2] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="kova-background__line kova-background__line--two"
          animate={{ rotate: [0, -2, 1, 0], opacity: [0.12, 0.25, 0.12] }}
          transition={{ duration: 23, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="kova-background__grain" />
      </motion.div>
    </div>
  );
}

export function SectionReveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.14 }}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
