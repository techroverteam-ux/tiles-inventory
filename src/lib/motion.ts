import { Variants } from 'framer-motion'

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 200,
    },
  },
}

export const hoverVariants: Variants = {
  hover: {
    y: -4,
    scale: 1.01,
    transition: {
      type: 'spring',
      damping: 15,
      stiffness: 400,
    },
  },
  tap: {
    scale: 0.98,
  },
}

export const pageVariants: Variants = {
  initial: { opacity: 0, x: -10 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1]
    }
  },
  exit: { opacity: 0, x: 10 }
}

export const organicButtonVariants: Variants = {
  hover: { scale: 1.02, y: -1 },
  tap: { scale: 0.98, y: 0 }
}
