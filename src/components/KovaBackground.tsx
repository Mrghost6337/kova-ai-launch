import { motion } from "framer-motion";

export function KovaBackground() {
  return (
    <div className="kova-background" aria-hidden="true">
      <div className="kova-background__wash" />
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
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.14 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
