import { Variants } from 'framer-motion'

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
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
      type: 'tween',
      duration: 0.3,
      ease: 'circOut',
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
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  exit: { opacity: 0 }
}

export const organicButtonVariants: Variants = {
  hover: { scale: 1.02, y: -1 },
  tap: { scale: 0.98, y: 0 }
}
