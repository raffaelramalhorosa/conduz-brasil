import { motion } from "framer-motion";

const stats = [
  { value: '10k+', label: 'Alunos Aprovados' },
  { value: '500+', label: 'Instrutores Certificados' },
  { value: '50+', label: 'Autoescolas Parceiras' },
  { value: '4.9★', label: 'Avaliação Média' },
];

const StatsSection = () => {
  return (
    <section className="py-16 md:py-20 gradient-mesh">
      <div className="container-custom">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold font-display text-gradient mb-2">
                {stat.value}
              </div>
              <div className="text-muted-foreground font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
