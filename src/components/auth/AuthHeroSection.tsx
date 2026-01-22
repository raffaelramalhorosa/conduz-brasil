import { motion } from 'framer-motion';

const stats = [
  { value: '500+', label: 'Instrutores' },
  { value: '5.000+', label: 'Alunos' },
  { value: '4.8', label: 'Avaliação média' },
  { value: '98%', label: 'Aprovação' }
];

export function AuthHeroSection() {
  return (
    <div className="relative hidden lg:flex w-1/2 min-h-screen bg-[hsl(210,50%,20%)] overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center px-8 lg:px-12 xl:px-16 w-full">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
            Conquiste sua habilitação
          </h1>
          <p className="text-lg text-white/70 max-w-md">
            Encontre os melhores instrutores autônomos perto de você
            e comece sua jornada até a CNH.
          </p>
        </motion.div>
        
        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-2 gap-4 max-w-md"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
                delayChildren: 0.4
              }
            }
          }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              className="group bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-5 transition-all duration-300 hover:bg-white/15 hover:-translate-y-1"
            >
              <div className="text-2xl lg:text-3xl font-bold text-primary transition-transform duration-300 group-hover:scale-110">
                {stat.value}
              </div>
              <div className="text-sm text-white/60 mt-1">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
