import { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

// Mock simple SVG for Shuni Avatar until real assets are fully linked
const ShuniAvatar = () => (
  <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg filter">
    <rect x="25" y="20" width="65" height="45" rx="16" fill="hsl(340, 65%, 65%)" />
    <path d="M 25 30 Q 5 10 10 50 Q 15 65 25 50" fill="#E5E7EB" />
    <rect x="70" y="35" width="4" height="6" rx="2" fill="#1F2937" />
    <rect x="78" y="35" width="4" height="6" rx="2" fill="#1F2937" />
    <ellipse cx="65" cy="40" rx="4" ry="2" fill="hsl(42, 90%, 62%)" />
    <ellipse cx="88" cy="40" rx="4" ry="2" fill="hsl(42, 90%, 62%)" />
    <path d="M 40 65 L 40 85 Q 40 90 45 90 L 50 90 Q 55 90 55 85 L 50 65" fill="#E5E7EB" />
    <path d="M 60 65 L 60 85 Q 60 90 65 90 L 70 90 Q 75 90 75 85 L 70 65" fill="#E5E7EB" />
  </svg>
);

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (isLogin) {
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (loginError: any) {
          console.error(loginError);
          // If the error implies user not found, prompt them to register
          if (loginError.code === 'auth/user-not-found' || loginError.code === 'auth/invalid-credential') {
            try {
              // Double check if email exists to be sure it's not just a wrong password
              const methods = await fetchSignInMethodsForEmail(auth, email);
              if (methods.length === 0) {
                setErrorMsg('這個信箱還沒註冊過喔！請先填寫暱稱來註冊 🌱');
                setIsLogin(false);
                setIsLoading(false);
                return;
              }
            } catch (e) {
              // Ignore fetch error, just show standard invalid credential
            }
            setErrorMsg('信箱或密碼錯誤，請再試一次 🤔');
          } else {
            setErrorMsg(loginError.message);
          }
        }
      } else {
        if (!nickname.trim()) {
          setErrorMsg('請輸入怎麼稱呼你喔！');
          setIsLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Save nickname to Firestore
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          nickname: nickname.trim(),
          createdAt: Date.now()
        });
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('這個信箱已經註冊過囉，幫您切換到登入畫面！');
        setIsLogin(true);
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('密碼太短啦，至少要 6 個字！');
      } else {
        setErrorMsg('發生錯誤：' + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Floating Elements Background */}
      <div className="absolute inset-0 pointer-events-none opacity-20 text-4xl overflow-hidden">
        <motion.div animate={{ y: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="absolute top-20 left-[10%]">🌱</motion.div>
        <motion.div animate={{ y: [0, -30, 0], x: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="absolute top-40 right-[15%]">🌸</motion.div>
        <motion.div animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 2.5 }} className="absolute bottom-32 left-[20%]">✨</motion.div>
        <motion.div animate={{ y: [0, -25, 0], x: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3.5 }} className="absolute bottom-20 right-[10%]">👣</motion.div>
      </div>

      <div className="z-10 w-full max-w-sm px-6 flex flex-col items-center">
        {/* Avatar & Header */}
        <motion.div 
          className="animate-float mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <ShuniAvatar />
        </motion.div>
        
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold text-primary flex items-center justify-center gap-2">
            咻妮 <span className="text-xl">🌱</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">你的 AI 旅遊記帳好夥伴</p>
        </div>

        {/* Auth Card */}
        <motion.div 
          className="w-full bg-card border border-border rounded-[16px] p-6 shadow-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-lg font-bold text-foreground mb-6 text-center">
            {isLogin ? "歡迎回來 👋" : "加入冒險 🌿"}
          </h2>

          {errorMsg && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg text-center font-medium">
              {errorMsg}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="怎麼稱呼你？" 
                  className="w-full bg-background border border-border rounded-xl text-sm pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  required={!isLogin}
                />
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="信箱" 
                className="w-full bg-background border border-border rounded-xl text-sm pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                <Lock size={18} />
              </div>
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="密碼" 
                className="w-full bg-background border border-border rounded-xl text-sm pl-10 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full mt-2 bg-gradient-nature text-primary-foreground font-display font-bold rounded-xl py-3 flex items-center justify-center transition-transform active:scale-95 disabled:opacity-70 shadow-soft"
            >
              {isLoading ? (
                <span className="animate-spin text-xl">🌀</span>
              ) : (
                isLogin ? "出發！" : "開始冒險！"
              )}
            </button>
          </form>

          <div className="mt-6 text-center flex flex-col items-center gap-3">
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMsg('');
              }}
              className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium border-b border-transparent hover:border-primary pb-0.5"
            >
              {isLogin ? "還沒有帳號？註冊" : "已經有帳號了？登入"}
            </button>
            <button
               type="button"
               onClick={() => {
                 localStorage.setItem('shuni_dev_bypass', 'true');
                 window.location.reload();
               }}
               className="text-[10px] text-primary opacity-50 hover:opacity-100 mt-2"
            >
               [Dev] 略過登入，先看新版 UI (手風琴)
            </button>
          </div>
        </motion.div>

        <div className="mt-8 text-center text-[10px] text-muted-foreground">
          <p>走過必留下足跡 🌱 探索世界的每一步都值得記錄</p>
        </div>
      </div>
    </div>
  );
}
