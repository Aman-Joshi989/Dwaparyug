import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Heart, Star, Users, Gift, Sparkles, Trophy, Crown, HandHeart, Zap } from 'lucide-react';
import { useRouter } from "next/navigation"

const DonationSuccessPage = ({ totalDonationAmount = 2500, tipAmount = 125, grandTotal = 2625, }) => {
  const router = useRouter()
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  const impactMessages = [
    "You just changed someone's life forever",
    "Your kindness will echo through generations",
    "You are the hero someone was praying for",
    "This moment makes you part of something beautiful"
  ];

  const confettiParticles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 3 + Math.random() * 2,
    color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'][Math.floor(Math.random() * 5)]
  }));

  useEffect(() => {
    setShowConfetti(true);
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % impactMessages.length);
    }, 3000);

    return () => clearInterval(messageInterval);
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-purple-300 to-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-64 h-64 bg-gradient-to-r from-yellow-300 to-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-40 w-64 h-64 bg-gradient-to-r from-blue-300 to-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Confetti Animation */}
      <AnimatePresence>
        {showConfetti && confettiParticles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ y: -20, x: `${particle.x}vw`, opacity: 1, rotate: 0 }}
            animate={{
              y: '110vh',
              rotate: 360,
              opacity: [1, 1, 0]
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              ease: "easeOut"
            }}
            className="absolute w-3 h-3 rounded-full z-10"
            style={{ backgroundColor: particle.color }}
          />
        ))}
      </AnimatePresence>

      <div className="relative z-20 min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-2xl w-full"
        >
          {/* Main Success Icon with Pulse Effect */}
          <motion.div
            className="text-center mb-8 relative"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            <div className="relative inline-block">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  boxShadow: [
                    "0 0 0 0 rgba(34, 197, 94, 0.7)",
                    "0 0 0 20px rgba(34, 197, 94, 0)",
                    "0 0 0 0 rgba(34, 197, 94, 0)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl"
              >
                <CheckCircle className="w-16 h-16 text-white" />
              </motion.div>

              {/* Floating Icons Around Main Icon */}
              {[Heart, Star, Gift, Crown].map((Icon, index) => (
                <motion.div
                  key={index}
                  className="absolute"
                  style={{
                    top: index === 0 ? '-10px' : index === 1 ? '20px' : index === 2 ? '60px' : '40px',
                    left: index === 0 ? '20px' : index === 1 ? '-20px' : index === 2 ? '-15px' : '100px'
                  }}
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0],
                    scale: [0.8, 1.1, 0.8]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: index * 0.5
                  }}
                >
                  <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-purple-500" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Dynamic Headline */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center mb-6"
          >
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              You're a Hero!
            </h1>

            <motion.div
              className="text-xl md:text-2xl text-gray-700 font-medium min-h-[2.5rem] flex items-center justify-center"
              key={currentMessageIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8 }}
            >
              {impactMessages[currentMessageIndex]}
            </motion.div>
          </motion.div>

          {/* Impact Stats */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-3 gap-4 mb-8"
          >
            {[
              { icon: Users, number: "50+", label: "Lives Touched", color: "from-blue-500 to-cyan-500" },
              { icon: Heart, number: "∞", label: "Love Shared", color: "from-red-500 to-pink-500" },
              { icon: Sparkles, number: "1st", label: "In Our Hearts", color: "from-yellow-500 to-orange-500" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 1 + index * 0.2, type: "spring" }}
                className="text-center"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-2xl mx-auto mb-2 flex items-center justify-center shadow-xl`}>
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-800">{stat.number}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Donation Summary Card */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/50 mb-8"
          >
            <div className="flex items-center justify-center mb-6">
              <Trophy className="w-8 h-8 text-yellow-500 mr-3" />
              <h3 className="text-2xl font-bold text-gray-800">Your Incredible Impact</h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                <span className="text-lg text-gray-700 flex items-center">
                  <HandHeart className="w-5 h-5 mr-2 text-green-600" />
                  Donation Amount
                </span>
                <span className="text-2xl font-bold text-green-600">₹{totalDonationAmount.toLocaleString()}</span>
              </div>

              {tipAmount > 0 && (
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl">
                  <span className="text-lg text-gray-700 flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-purple-600" />
                    Platform Support
                  </span>
                  <span className="text-xl font-bold text-purple-600">₹{tipAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="border-t-2 border-dashed border-gray-200 pt-4">
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
                  <span className="text-xl font-bold text-gray-800 flex items-center">
                    <Crown className="w-6 h-6 mr-2 text-yellow-600" />
                    Total Blessing Given
                  </span>
                  <span className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                    ₹{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Emotional Message */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-center mb-8"
          >
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-2xl">
              <p className="text-lg leading-relaxed">
                <strong>You didn't just donate money today.</strong><br />
                You gave hope to someone who needed it most. You became part of their story of survival, growth, and dreams coming true.
                <br /><br />
                <span className="text-yellow-200 font-semibold">Somewhere, someone is smiling because of you.</span>
              </p>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router?.push('/causes')}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center"
            >
              <Heart className="w-6 h-6 mr-2" />
              Spread More Love
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router?.push('/')}
              className="bg-white text-gray-700 px-8 py-4 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-gray-200"
            >
              Return Home
            </motion.button>
          </motion.div>

          {/* Certificate Badge */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 2, type: "spring", stiffness: 100 }}
            className="text-center mt-12"
          >
            <div className="inline-block bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-yellow-900 px-6 py-3 rounded-full font-bold text-sm shadow-xl">
              🏆 CERTIFIED CHANGEMAKER 🏆
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default DonationSuccessPage;