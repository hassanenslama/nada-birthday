import { motion } from 'framer-motion';

const CharacterReveal = ({ text, direction = 'ltr' }) => {
    // Split by words to preserve Arabic cursive connections
    const words = text.split(' ');

    const containerVariants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.08,
                staggerDirection: direction === 'ltr' ? 1 : -1
            }
        },
        exit: {
            transition: {
                staggerChildren: 0.06,
                staggerDirection: direction === 'ltr' ? -1 : 1
            }
        }
    };

    const wordVariants = {
        hidden: {
            opacity: 0,
            x: direction === 'ltr' ? 20 : -20,
            filter: 'blur(8px)',
            scale: 0.9
        },
        visible: {
            opacity: 1,
            x: 0,
            filter: 'blur(0px)',
            scale: 1,
            transition: {
                duration: 0.4,
                ease: 'easeOut'
            }
        },
        exit: {
            opacity: 0,
            x: direction === 'ltr' ? -20 : 20,
            filter: 'blur(8px)',
            scale: 0.9,
            transition: {
                duration: 0.3,
                ease: 'easeIn'
            }
        }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-black/20 backdrop-blur-sm px-6 py-3 rounded-2xl border border-gold/10 shadow-lg inline-block"
        >
            <p dir="rtl" className="text-xl md:text-3xl font-bold font-cairo leading-relaxed flex flex-wrap justify-center gap-x-2">
                {words.map((word, index) => (
                    <motion.span
                        key={index}
                        variants={wordVariants}
                        className="bg-clip-text text-transparent bg-gradient-to-r from-[#F7E7CE] via-gold to-[#F7E7CE]"
                    >
                        {word}
                    </motion.span>
                ))}
            </p>
        </motion.div>
    );
};

export default CharacterReveal;
