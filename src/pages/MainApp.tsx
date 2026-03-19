import { useState, useEffect, useMemo } from 'react';
import { MessageCircle, Compass, Footprints, Wallet, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import ChatArea from '../components/ChatArea';
import RightPanelTabs, { type RightTabType } from '../components/RightPanelTabs';
import type { ChatMessage, ExpenseItem, LocationPin, JourneyEntry, TravelPlan, PostTripStatus } from '../services/ai';
import { processUserMessage } from '../services/ai';
import { dbService } from '../services/db';

const dummyInitialMessage: ChatMessage = {
  id: 'msg-0',
  role: 'assistant',
  content: '嗨囉！我是咻妮！💕 今天想去哪裡玩？買了什麼好東西？儘管跟我說，我幫你記下來！✨',
  timestamp: new Date()
};

const TRIP_ID = 'trip_shuni_demo';

export default function MainApp() {
  const { logout, userProfile, user } = useAuth();
  const [mobileTab, setMobileTab] = useState<'chat' | RightTabType>('chat');
  
  const [messages, setMessages] = useState<ChatMessage[]>([dummyInitialMessage]);
  const [isTyping, setIsTyping] = useState(false);
  
  const [phase, setPhase] = useState<'idle' | 'planning' | 'traveling' | 'post_trip'>('idle');
  const [travelPlan, setTravelPlan] = useState<TravelPlan | undefined>(undefined);
  const [postTripStatus, setPostTripStatus] = useState<PostTripStatus | undefined>(undefined);

  // Firestore Sync Effect
  useEffect(() => {
    if (!user) return; // Ignore if local dev bypass
    const uid = user.uid;
    
    // Initialize trip explicitly if it doesn't exist
    dbService.getOrInitializeTrip(uid, TRIP_ID);

    const unsubData = dbService.subscribeToTripData(uid, TRIP_ID, (data) => {
      if (data.phase) setPhase(data.phase);
      if (data.travelPlan) setTravelPlan(data.travelPlan);
      if (data.postTripStatus) setPostTripStatus(data.postTripStatus);
    });

    const unsubMsgs = dbService.subscribeToMessages(uid, TRIP_ID, (fetchedMsgs) => {
      if (fetchedMsgs.length > 0) {
        setMessages(fetchedMsgs);
      }
    });

    return () => { unsubData(); unsubMsgs(); };
  }, [user]);

  // Derive Expenses, Locations, and JourneyEntries from History
  const { expenses, locations, journeyEntries } = useMemo(() => {
    const exps: ExpenseItem[] = [];
    const locs: LocationPin[] = [];
    const entries: JourneyEntry[] = [];
    
    messages.forEach(msg => {
      if (msg.role === 'user') {
        if (msg.location) {
          locs.push(msg.location);
          entries.push({
            id: `je-loc-${msg.id}`, time: msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            type: 'checkin', title: `📍 ${msg.location.name}`, detail: msg.location.description, location: msg.location.name
          });
        }
        if (msg.expenses && msg.expenses.length > 0) {
          msg.expenses.forEach(exp => {
            exps.push(exp);
            entries.push({
              id: `je-exp-${exp.id}`, time: exp.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
              type: 'expense', title: exp.description || '消費', amount: exp.amount, currency: exp.currency, category: exp.category
            });
          });
        }
      }
    });
    return { expenses: exps, locations: locs, journeyEntries: entries };
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    // Optimistic user message
    const tempUserMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setIsTyping(true);

    try {
      // Pass the entire history and current phase
      const { 
        response, 
        expenses: newExpenses, 
        location: newLocation,
        travelPlan: newPlan,
        postTripStatus: newPostTrip,
        newPhase
      } = await processUserMessage(text, messages, phase);
      
      // Update the user msg with the extracted context data
      const finalUserMsg = { ...tempUserMsg, expenses: newExpenses, location: newLocation };
      
      // If we are in Dev bypass, fall back to React state. If user exists, save to DB.
      if (!user) {
         setMessages(prev => prev.map(m => m.id === finalUserMsg.id ? finalUserMsg : m));
         if (newPlan) setTravelPlan(newPlan);
         if (newPostTrip) setPostTripStatus(newPostTrip);
         if (newPhase !== phase) setPhase(newPhase);
      } else {
         await dbService.addMessage(user.uid, TRIP_ID, finalUserMsg);
         await dbService.updateTripState(user.uid, TRIP_ID, {
           phase: newPhase,
           ...(newPlan && { travelPlan: newPlan }),
           ...(newPostTrip && { postTripStatus: newPostTrip })
         });
      }

      if (newPhase !== phase) {
        // Automatically switch to Travel Plan tab if AI triggers planning or traveling
        if (newPhase === 'planning' || newPhase === 'traveling' || newPhase === 'post_trip') {
          setMobileTab('plan');
        }
      }

      const xiuniMsg: ChatMessage = {
        id: `msg-xiuni-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      if (!user) {
        setMessages(prev => [...prev, xiuniMsg]);
      } else {
        await dbService.addMessage(user.uid, TRIP_ID, xiuniMsg);
      }
      
    } catch(err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const renderContent = () => {
    switch (mobileTab) {
      case 'chat': return <ChatArea messages={messages} onSendMessage={handleSendMessage} isTyping={isTyping} />;
      default: return (
        <RightPanelTabs 
          expenses={expenses} entries={journeyEntries} locations={locations} forceTab={mobileTab as RightTabType} 
          travelPlan={travelPlan} postTripStatus={postTripStatus} phase={phase}
        />
      );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background lg:flex-row overflow-hidden relative">
      {/* 
        DESKTOP LAYOUT: 
        Left Side: Main Chat (Flexible taking remaining space, Max width ~900px, centered if screen very wide)
        Right Side: Accordion Panel (Fixed ~400px)
      */}
      
      {/* Main Center (Chat) */}
      <main className="flex-1 flex flex-col h-full bg-background relative w-full border-r border-transparent lg:border-border shadow-sm max-w-5xl mx-auto">
        {/* Header */}
        <header className="h-16 shrink-0 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-9 h-9 rounded-full bg-pikmin-cream shadow-card flex items-center justify-center text-xs border-[2px] border-primary/20"
              animate={{ rotate: [-2, 2, -2] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
               咻妮
            </motion.div>
            <div className="flex flex-col">
              <span className="font-display text-sm font-bold m-0 flex items-center gap-1.5 text-foreground">
                咻妮 🌱
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-pikmin-leaf animate-pulse" />
                為 {userProfile?.nickname || '你'} 服務中
              </span>
            </div>
          </div>
          <button onClick={logout} className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-full hover:bg-destructive/10">
            <LogOut size={16} />
          </button>
        </header>

        {/* Dynamic Content (Mobile vs Desktop) */}
        <div className="flex-1 overflow-hidden lg:flex lg:flex-col relative">
          {/* On Mobile: Render Active Tab Content */}
          <div className="block lg:hidden h-full">
            {renderContent()}
          </div>
          
          {/* On Desktop: Always Render Chat in Center Area */}
          <div className="hidden lg:block h-full">
            <ChatArea messages={messages} onSendMessage={handleSendMessage} isTyping={isTyping} />
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <nav className="lg:hidden shrink-0 border-t border-border bg-card/80 backdrop-blur-md pb-safe">
          <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
            <TabItem icon={MessageCircle} label="對話" isActive={mobileTab === 'chat'} onClick={() => setMobileTab('chat')} />
            <TabItem icon={Compass} label="旅遊規劃" isActive={mobileTab === 'plan'} onClick={() => setMobileTab('plan')} />
            <TabItem icon={Footprints} label="今日足跡" isActive={mobileTab === 'footprint'} onClick={() => setMobileTab('footprint')} />
            <TabItem icon={Wallet} label="今日花費" isActive={mobileTab === 'expense'} onClick={() => setMobileTab('expense')} />
          </div>
        </nav>
      </main>

      {/* Right Sidebar: Tabs Panel (Desktop Only) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[450px] lg:shrink-0 bg-muted/10 overflow-hidden shadow-[-4px_0_24px_-8px_rgba(0,0,0,0.05)] z-10 border-l border-border">
        <RightPanelTabs 
          expenses={expenses} entries={journeyEntries} locations={locations}
          travelPlan={travelPlan} postTripStatus={postTripStatus} phase={phase}
        />
      </aside>
    </div>
  );
}

function TabItem({ icon: Icon, label, isActive, badge, onClick }: any) {
  return (
    <button onClick={onClick} className="relative flex flex-col items-center justify-center w-full h-full gap-1 p-2">
      <div className="relative">
        <Icon size={20} className={`${isActive ? 'text-primary' : 'text-muted-foreground'} transition-colors`} />
        {badge > 0 && (
          <span className="absolute -top-1 -right-2 bg-pikmin-sun text-[10px] font-bold text-foreground px-1.5 py-0.5 rounded-full min-w-4 text-center">
            {badge}
          </span>
        )}
      </div>
      <span className={`${isActive ? 'text-[10px] font-medium text-primary' : 'text-[10px] font-medium text-muted-foreground'}`}>{label}</span>
      <AnimatePresence>
        {isActive && (
          <motion.div 
            layoutId="tab-indicator"
            className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-gradient-nature rounded-t-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
    </button>
  );
}
